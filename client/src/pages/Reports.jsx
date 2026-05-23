import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select } from "../components/Input.jsx";

export default function ReportsPage() {
  const can = useCan();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [insuranceTypeId, setInsuranceTypeId] = useState("");
  const [userId, setUserId] = useState("");
  const [report, setReport] = useState(null);
  const [types, setTypes] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    const params = { date };
    if (insuranceTypeId) params.insuranceTypeId = insuranceTypeId;
    if (userId) params.userId = userId;
    const { data } = await api.get("/reports/collections", { params });
    setReport(data);
  };

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    api
      .get("/insurance-types")
      .then((r) => setTypes(r.data.data))
      .catch(() => {});
    if (can("users:read")) {
      api
        .get("/users", { params: { limit: 200 } })
        .then((r) => setUsers(r.data.data))
        .catch(() => {});
    }
  }, [can]);

  const exportCsvAuth = async () => {
    try {
      const params = new URLSearchParams({ date });
      if (insuranceTypeId) params.set("insuranceTypeId", insuranceTypeId);
      if (userId) params.set("userId", userId);
      const res = await api.get(`/reports/export.csv?${params.toString()}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `report-${date}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const payRows = report?.paymentsCollected || [];
  const columns = [
    { key: "c", label: "Customer", render: (p) => p.customer?.fullName },
    { key: "a", label: "Amount", render: (p) => p.amount },
    { key: "ccy", label: "CCY", render: (p) => p.currency?.code },
    { key: "u", label: "Recorded by", render: (p) => p.recordedBy?.name },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-500">Daily collections and customer payment status</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Insurance type</Label>
          <Select value={insuranceTypeId} onChange={(e) => setInsuranceTypeId(e.target.value)}>
            <option value="">All</option>
            {types.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>User (recorded by)</Label>
          <Select value={userId} onChange={(e) => setUserId(e.target.value)} disabled={!can("users:read")}>
            <option value="">All</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button className="w-full" onClick={() => load().catch((e) => toast.error(e.message))}>
            Run report
          </Button>
        </div>
      </div>

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase text-slate-500">Payments recorded</div>
            <div className="mt-2 text-2xl font-bold">{report.counts.paymentRecords}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase text-slate-500">Paid customers</div>
            <div className="mt-2 text-2xl font-bold">{report.counts.paidCustomers}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase text-slate-500">Unpaid customers</div>
            <div className="mt-2 text-2xl font-bold">{report.counts.unpaidCustomers}</div>
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 text-sm font-semibold">Totals by currency</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {Object.entries(report.totalsByCurrency || {}).map(([code, v]) => (
              <div key={code}>
                {code}: {v.amount.toFixed(2)} {v.symbol}
              </div>
            ))}
            {!Object.keys(report.totalsByCurrency || {}).length ? "—" : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payment lines</h2>
        {can("reports:export") ? <Button variant="secondary" onClick={exportCsvAuth}>Export CSV</Button> : null}
      </div>
      <DataTable columns={columns} rows={payRows.map((p) => ({ ...p, id: p._id }))} emptyText="No payments for filters" />
    </div>
  );
}
