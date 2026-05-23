import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select } from "../components/Input.jsx";
import IdDocumentsBlock from "../components/IdDocumentsBlock.jsx";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const can = useCan();
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", currencyId: "", forDate: "", reference: "" });

  const load = async () => {
    const { data: res } = await api.get(`/customers/${id}`);
    setData(res.data);
    setPayments(res.payments);
    setPayForm((f) => ({
      ...f,
      amount: res.data?.insuranceType?.dailyPrice ?? "",
      currencyId: res.data?.currency?._id || res.data?.currency || "",
    }));
  };

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
    api
      .get("/currencies")
      .then((r) => setCurrencies(r.data.data))
      .catch(() => {});
  }, [id]);

  const addPayment = async () => {
    try {
      await api.post("/payments", {
        customerId: id,
        amount: Number(payForm.amount),
        currencyId: payForm.currencyId,
        forDate: payForm.forDate || undefined,
        reference: payForm.reference,
      });
      toast.success("Payment recorded");
      setPayOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!data) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  const payColumns = [
    { key: "forDate", label: "Day", render: (p) => new Date(p.forDate).toISOString().slice(0, 10) },
    { key: "amount", label: "Amount" },
    { key: "cur", label: "Currency", render: (p) => p.currency?.code },
    { key: "by", label: "Recorded by", render: (p) => p.recordedBy?.name || p.recordedBy?.email || "—" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/customers" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Customers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{data.fullName}</h1>
          <p className="text-sm text-slate-500">{data.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              data.paymentStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
            }`}
          >
            {data.paymentStatus}
          </span>
          {can("payments:create") ? (
            <Button onClick={() => setPayOpen(true)}>Record payment</Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">ID type</dt>
              <dd className="text-right">{data.idType || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">CNI</dt>
              <dd className="text-right font-mono text-xs">{data.cni || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Address</dt>
              <dd className="text-right">{data.address || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Vehicle</dt>
              <dd className="text-right">{data.vehicleType?.name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Insurance</dt>
              <dd className="text-right">{data.insuranceType?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Daily price</dt>
              <dd className="text-right">
                {data.insuranceType?.dailyPrice} {data.currency?.code}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reference</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Relation</dt>
              <dd className="text-right">{data.refRelation || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-right">{data.refName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-right">{data.refPhone || "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Meta</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Created by</dt>
              <dd className="text-right">{data.createdBy?.name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Notes</dt>
              <dd className="text-right">{data.notes || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">ID documents</h2>
        <p className="mt-1 text-xs text-slate-500">Passport, license, or dhalasho — horizontal previews; use View or click the image for full size.</p>
        <div className="mt-4">
          <IdDocumentsBlock
            customerId={data._id}
            documents={data.idDocuments || []}
            canEdit={can("customers:update")}
            onUpdated={(cust) => setData(cust)}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Payment history</h2>
        <DataTable columns={payColumns} rows={payments.map((p) => ({ ...p, id: p._id }))} emptyText="No payments yet" />
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        description="One payment per customer per UTC calendar day."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addPayment}>Save payment</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <Label>Amount</Label>
            <Input type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={payForm.currencyId} onChange={(e) => setPayForm((f) => ({ ...f, currencyId: e.target.value }))}>
              {currencies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>For date (optional, default today UTC)</Label>
            <Input type="date" value={payForm.forDate} onChange={(e) => setPayForm((f) => ({ ...f, forDate: e.target.value }))} />
          </div>
          <div>
            <Label>Reference</Label>
            <Input value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
