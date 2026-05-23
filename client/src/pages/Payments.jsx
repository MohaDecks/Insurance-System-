import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select } from "../components/Input.jsx";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentsUnpaidTab() {
  const {
    forDate,
    setForDate,
    search,
    setSearch,
    applyFilters,
    can,
    unpaidColumns,
    unpaidRows,
    unpaidTotal,
    unpaidPage,
    setUnpaidPage,
  } = useOutletContext();

  return (
    <section className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Unpaid for day</h2>
        <NavLink
          to="/payments/paid"
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Paid payments →
        </NavLink>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Date (UTC day)</Label>
          <Input type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} className="w-44" />
        </div>
        <div className="min-w-[200px] flex-1">
          <Label>Search name / phone</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter list…" />
        </div>
        <Button onClick={applyFilters}>Apply</Button>
      </div>
      {!can("notifications:send") ? (
        <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
          SMS / Push buttons need the <code className="rounded bg-white/60 px-1 dark:bg-black/30">notifications:send</code> permission.
        </p>
      ) : null}

      <DataTable
        columns={unpaidColumns}
        rows={unpaidRows.map((r) => ({ ...r, id: r._id }))}
        emptyText="Everyone paid for this day (or no customers yet)."
      />

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          Page {unpaidPage} · {unpaidTotal} unpaid
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={unpaidPage <= 1} onClick={() => setUnpaidPage((p) => p - 1)}>
            Prev
          </Button>
          <Button variant="secondary" disabled={unpaidPage * 20 >= unpaidTotal} onClick={() => setUnpaidPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PaymentsLedgerTab() {
  const { ledgerColumns, ledger, ledgerTotal, ledgerPage, setLedgerPage } = useOutletContext();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Paid — payment ledger</h2>
        <NavLink
          to="/payments/unpaid"
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          ← Unpaid for day
        </NavLink>
      </div>
      <p className="text-sm text-slate-500">Recent recorded payments (all days).</p>
      <DataTable columns={ledgerColumns} rows={ledger.map((r) => ({ ...r, id: r._id }))} emptyText="No payments yet" />
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {ledgerPage} · {ledgerTotal} lines
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={ledgerPage <= 1} onClick={() => setLedgerPage((p) => p - 1)}>
            Prev
          </Button>
          <Button variant="secondary" disabled={ledgerPage * 15 >= ledgerTotal} onClick={() => setLedgerPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function PaymentsPage() {
  const can = useCan();
  const location = useLocation();
  const isLedger = location.pathname.includes("/paid");

  const [forDate, setForDate] = useState(todayInput);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [unpaidRows, setUnpaidRows] = useState([]);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [unpaidPage, setUnpaidPage] = useState(1);

  const [ledger, setLedger] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [customers, setCustomers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [sending, setSending] = useState({});

  const loadUnpaid = useCallback(async () => {
    const { data } = await api.get("/payments/unpaid", {
      params: {
        date: forDate,
        search: appliedSearch || undefined,
        page: unpaidPage,
        limit: 20,
      },
    });
    setUnpaidRows(data.data);
    setUnpaidTotal(data.total);
  }, [forDate, appliedSearch, unpaidPage]);

  const loadLedger = useCallback(async () => {
    const { data } = await api.get("/payments/paid", { params: { page: ledgerPage, limit: 15 } });
    setLedger(data.data);
    setLedgerTotal(data.total);
  }, [ledgerPage]);

  useEffect(() => {
    loadUnpaid().catch((e) => toast.error(e.message));
  }, [loadUnpaid]);

  useEffect(() => {
    loadLedger().catch((e) => toast.error(e.message));
  }, [loadLedger]);

  useEffect(() => {
    (async () => {
      try {
        const [c, cur] = await Promise.all([
          api.get("/customers", { params: { limit: 300 } }),
          api.get("/currencies"),
        ]);
        setCustomers(c.data.data);
        setCurrencies(cur.data.data);
        const def = cur.data.data.find((x) => x.isDefault) || cur.data.data[0];
        setForm((f) => ({
          ...f,
          customerId: c.data.data[0]?._id || "",
          currencyId: def?._id || "",
          amount: "",
          forDate: "",
          reference: "",
        }));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    setUnpaidPage(1);
  }, [forDate]);

  const applyFilters = useCallback(() => {
    setAppliedSearch(search.trim());
    setUnpaidPage(1);
  }, [search]);

  const remind = async (customerId, channel) => {
    const key = `${customerId}-${channel}`;
    setSending((s) => ({ ...s, [key]: true }));
    try {
      const { data } = await api.post("/payments/remind", {
        customerId,
        date: forDate,
        channel,
      });
      const d = data.result?.detail || "Sent";
      toast.success(channel === "sms" ? `SMS: ${d}` : `Push: ${d}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending((s) => ({ ...s, [key]: false }));
    }
  };

  const openPayModal = (cust) => {
    const curId = cust.currency?._id || cust.currency;
    const amt = cust.insuranceType?.dailyPrice ?? "";
    setForm({
      customerId: cust._id,
      currencyId: curId || form.currencyId,
      amount: String(amt),
      forDate,
      reference: "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      await api.post("/payments", {
        customerId: form.customerId,
        amount: Number(form.amount),
        currencyId: form.currencyId,
        forDate: form.forDate || undefined,
        reference: form.reference,
      });
      toast.success("Payment saved");
      setOpen(false);
      await Promise.all([loadUnpaid(), loadLedger()]);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const unpaidColumns = [
      {
        key: "name",
        label: "Customer",
        render: (c) => (
          <Link className="font-medium text-brand-600 hover:underline" to={`/customers/${c._id}`}>
            {c.fullName}
          </Link>
        ),
      },
      { key: "phone", label: "Phone", render: (c) => c.phoneNumber },
      { key: "vehicle", label: "Vehicle", render: (c) => c.vehicleType?.name || "—" },
      {
        key: "plan",
        label: "Insurance",
        render: (c) => c.insuranceType?.name || "—",
      },
      {
        key: "due",
        label: "Due (daily)",
        render: (c) => {
          const p = c.insuranceType?.dailyPrice;
          const code = c.currency?.code || "";
          return p != null ? `${p} ${code}` : "—";
        },
      },
      {
        key: "sms",
        label: "SMS",
        render: (c) =>
          can("notifications:send") ? (
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              disabled={sending[`${c._id}-sms`]}
              onClick={() => remind(c._id, "sms")}
            >
              {sending[`${c._id}-sms`] ? "…" : "SMS"}
            </Button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        key: "push",
        label: "Push",
        render: (c) =>
          can("notifications:send") ? (
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              disabled={sending[`${c._id}-push`]}
              onClick={() => remind(c._id, "push")}
            >
              {sending[`${c._id}-push`] ? "…" : "Push"}
            </Button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      {
        key: "pay",
        label: "Pay",
        render: (c) =>
          can("payments:create") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openPayModal(c)}>
              Record
            </Button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
    ];

  const ledgerColumns = [
      {
        key: "day",
        label: "Day",
        render: (p) => new Date(p.forDate).toISOString().slice(0, 10),
      },
      {
        key: "cust",
        label: "Customer",
        render: (p) => (
          <Link className="text-brand-600 hover:underline" to={`/customers/${p.customer?._id}`}>
            {p.customer?.fullName}
          </Link>
        ),
      },
      { key: "amount", label: "Amount" },
      { key: "cur", label: "CCY", render: (p) => p.currency?.code },
      { key: "by", label: "By", render: (p) => p.recordedBy?.name || "—" },
    ];

  const outletContext = {
    forDate,
    setForDate,
    search,
    setSearch,
    applyFilters,
    can,
    unpaidColumns,
    unpaidRows,
    unpaidTotal,
    unpaidPage,
    setUnpaidPage,
    ledgerColumns,
    ledger,
    ledgerTotal,
    ledgerPage,
    setLedgerPage,
  };

  const tabClass = ({ isActive }) =>
    `rounded-xl px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-brand-600 text-white shadow-sm"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-sm text-slate-500">
            {!isLedger ? (
              <>
                Customers with <strong>no payment</strong> for the selected UTC day — send SMS or push, then record payment.
              </>
            ) : (
              <>Recorded payments — history of amounts collected and who logged them.</>
            )}
          </p>
        </div>
        {can("payments:create") ? (
          <Button
            onClick={() => {
              setForm((f) => ({ ...f, forDate, amount: "", reference: "" }));
              setOpen(true);
            }}
            disabled={!customers.length}
          >
            New payment
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <NavLink to="/payments/unpaid" className={tabClass}>
          Unpaid
        </NavLink>
        <NavLink to="/payments/paid" className={tabClass}>
          Paid
        </NavLink>
      </div>

      <Outlet context={outletContext} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record payment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <Label>Customer</Label>
            <Select value={form.customerId || ""} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fullName} — {c.phoneNumber}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currencyId || ""} onChange={(e) => setForm((f) => ({ ...f, currencyId: e.target.value }))}>
              {currencies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>For date</Label>
            <Input type="date" value={form.forDate || ""} onChange={(e) => setForm((f) => ({ ...f, forDate: e.target.value }))} />
          </div>
          <div>
            <Label>Reference</Label>
            <Input value={form.reference || ""} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
