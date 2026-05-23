import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select, Textarea } from "../components/Input.jsx";
import { ID_TYPES, REF_RELATIONS } from "../constants/customerRegistration.js";
import IdDocumentsBlock from "../components/IdDocumentsBlock.jsx";

function customerToForm(c) {
  return {
    fullName: c.fullName,
    phoneNumber: c.phoneNumber,
    address: c.address || "",
    idType: c.idType || "",
    cni: c.cni || "",
    refRelation: c.refRelation || "",
    refName: c.refName || "",
    refPhone: c.refPhone || "",
    vehicleTypeId: c.vehicleType?._id || c.vehicleType,
    insuranceTypeId: c.insuranceType?._id || c.insuranceType,
    currencyId: c.currency?._id || c.currency,
    notes: c.notes || "",
  };
}

export default function CustomersPage() {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [types, setTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const params = { page, limit: 15, search };
    if (status) params.status = status;
    const { data } = await api.get("/customers", { params });
    setRows(data.data);
    setTotal(data.total);
  }, [page, search, status]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [t, v, c] = await Promise.all([
          api.get("/insurance-types"),
          api.get("/vehicle-types"),
          api.get("/currencies"),
        ]);
        setTypes(t.data.data);
        setVehicleTypes(v.data.data);
        setCurrencies(c.data.data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const openCreate = () => {
    setForm({
      fullName: "",
      phoneNumber: "",
      address: "",
      idType: ID_TYPES[0] || "",
      cni: "",
      refRelation: "",
      refName: "",
      refPhone: "",
      vehicleTypeId: vehicleTypes[0]?._id || "",
      insuranceTypeId: types[0]?._id || "",
      currencyId: currencies.find((x) => x.isDefault)?._id || currencies[0]?._id || "",
      notes: "",
    });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (r) => {
    setForm(customerToForm(r));
    setModal({ open: true, mode: "edit", record: r });
  };

  const save = async () => {
    try {
      if (modal.mode === "create") {
        const { data } = await api.post("/customers", {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          address: form.address,
          idType: form.idType,
          cni: form.cni,
          refRelation: form.refRelation || undefined,
          refName: form.refName,
          refPhone: form.refPhone,
          vehicleTypeId: form.vehicleTypeId,
          insuranceTypeId: form.insuranceTypeId,
          currencyId: form.currencyId,
          notes: form.notes,
        });
        toast.success("Customer created — you can upload ID scans below.");
        setForm(customerToForm(data.data));
        setModal({ open: true, mode: "edit", record: data.data });
        await load();
        return;
      }
      await api.patch(`/customers/${modal.record._id}`, {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        idType: form.idType,
        cni: form.cni,
        refRelation: form.refRelation,
        refName: form.refName,
        refPhone: form.refPhone,
        vehicleTypeId: form.vehicleTypeId,
        insuranceTypeId: form.insuranceTypeId,
        currencyId: form.currencyId,
        notes: form.notes,
      });
      toast.success("Customer updated");
      setModal({ open: false, mode: "create", record: null });
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/customers/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "fullName", label: "Name", render: (r) => <Link className="font-medium text-brand-600 hover:underline" to={`/customers/${r._id}`}>{r.fullName}</Link> },
    { key: "phone", label: "Phone", render: (r) => r.phoneNumber },
    { key: "cni", label: "CNI", render: (r) => r.cni || "—" },
    { key: "vehicle", label: "Vehicle", render: (r) => r.vehicleType?.name || "—" },
    {
      key: "type",
      label: "Insurance",
      render: (r) => r.insuranceType?.name || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            r.paymentStatus === "PAID"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
          }`}
        >
          {r.paymentStatus}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("customers:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(r)}>
              Edit
            </Button>
          ) : null}
          {can("customers:delete") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs text-rose-600" onClick={() => setDel(r)}>
              Delete
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-sm text-slate-500">Registration, vehicle, and daily status</p>
        </div>
        {can("customers:create") ? (
          <Button onClick={openCreate} disabled={!types.length || !currencies.length || !vehicleTypes.length}>
            Add customer
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name, phone, or CNI"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
        </Select>
        <Button variant="secondary" onClick={() => setPage(1)}>
          Apply
        </Button>
      </div>

      <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r._id }))} />

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} · {total} total
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <Button variant="secondary" disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add customer" : "Edit customer"}
        description="Use the wide layout below; ID scans show in a horizontal row after save."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, mode: "create", record: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="max-h-[78vh] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-x-5 xl:gap-y-4">
            <div className="sm:col-span-2 xl:col-span-8">
              <Label>Full name</Label>
              <Input value={form.fullName || ""} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 xl:col-span-4">
              <Label>Phone</Label>
              <Input value={form.phoneNumber || ""} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
            </div>

            <div className="sm:col-span-2 xl:col-span-12 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-600/80">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identification</p>
                  <p className="mt-0.5 text-xs text-slate-400">ID type & customer ID number (CNI)</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID scans</p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>ID type</Label>
                  <Select value={form.idType || ""} onChange={(e) => setForm((f) => ({ ...f, idType: e.target.value }))}>
                    <option value="">{modal.mode === "create" ? "Select…" : "— (not set)"}</option>
                    {ID_TYPES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Customer ID number (CNI)</Label>
                  <Input value={form.cni || ""} onChange={(e) => setForm((f) => ({ ...f, cni: e.target.value }))} placeholder="CNI" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300/90 bg-white/80 p-3 dark:border-slate-600 dark:bg-slate-900/50">
                <IdDocumentsBlock
                  customerId={modal.record?._id}
                  documents={modal.record?.idDocuments || []}
                  canEdit={can("customers:update")}
                  compact
                  onUpdated={(cust) => {
                    setModal((m) => (m.open ? { ...m, record: cust } : m));
                    setForm(customerToForm(cust));
                  }}
                />
              </div>
            </div>

            <div className="sm:col-span-2 xl:col-span-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</p>
              <Label>Vehicle type</Label>
              <Select
                value={form.vehicleTypeId || ""}
                onChange={(e) => setForm((f) => ({ ...f, vehicleTypeId: e.target.value }))}
              >
                {vehicleTypes.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2 xl:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</p>
              <p className="mt-0.5 text-xs text-slate-400">Guarantor / emergency contact</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>Ref relation</Label>
                  <Select value={form.refRelation || ""} onChange={(e) => setForm((f) => ({ ...f, refRelation: e.target.value }))}>
                    <option value="">—</option>
                    {REF_RELATIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Ref name</Label>
                  <Input value={form.refName || ""} onChange={(e) => setForm((f) => ({ ...f, refName: e.target.value }))} />
                </div>
                <div>
                  <Label>Ref phone</Label>
                  <Input value={form.refPhone || ""} onChange={(e) => setForm((f) => ({ ...f, refPhone: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 xl:col-span-12 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address &amp; plan</p>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Address</Label>
                  <Textarea rows={3} value={form.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <Label>Insurance type</Label>
                  <Select
                    value={form.insuranceTypeId || ""}
                    onChange={(e) => setForm((f) => ({ ...f, insuranceTypeId: e.target.value }))}
                  >
                    {types.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.dailyPrice}/day)
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currencyId || ""} onChange={(e) => setForm((f) => ({ ...f, currencyId: e.target.value }))}>
                    {currencies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <Label>Notes</Label>
                  <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete customer"
        description="This removes the customer and all linked payment rows."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Delete <span className="font-semibold">{del?.fullName}</span>?
        </p>
      </Modal>
    </div>
  );
}
