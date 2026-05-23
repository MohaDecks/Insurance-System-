import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";

function Stat({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function DashboardPage() {
  const can = useCan();
  const [daily, setDaily] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, c] = await Promise.all([
          can("reports:read") ? api.get("/reports/daily").then((r) => r.data) : null,
          api.get("/reports/charts?days=14").then((r) => r.data),
        ]);
        setDaily(d);
        setCharts(c);
      } catch {
        /* handled globally */
      }
    };
    load();
  }, [can]);

  const chartData =
    charts?.incomeSeries?.map((inc, i) => ({
      day: inc.date.slice(5, 10),
      income: inc.income,
      unpaid: charts.unpaidSeries?.[i]?.unpaid ?? 0,
    })) || [];

  const totals = daily?.totalsByCurrency
    ? Object.entries(daily.totalsByCurrency)
        .map(([code, v]) => `${v.symbol || ""} ${v.amount.toFixed(0)} ${code}`)
        .join(" · ")
    : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500">Today&apos;s snapshot and trends</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          title="Payments today"
          value={daily?.counts?.paymentRecords ?? "—"}
          hint={can("reports:read") ? totals : "Grant reports:read for totals"}
        />
        <Stat title="Paid customers (today)" value={daily?.counts?.paidCustomers ?? "—"} />
        <Stat title="Unpaid customers (today)" value={daily?.counts?.unpaidCustomers ?? "—"} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Income & unpaid (14 days)</h2>
          {can("customers:read") ? (
            <Link to="/customers" className="text-sm font-semibold text-brand-600 hover:underline">
              View customers
            </Link>
          ) : null}
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" name="Income" stroke="#0b84ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="unpaid" name="Unpaid" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
