import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label } from "../components/Input.jsx";

export default function SettingsPage() {
  const can = useCan();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => setData(r.data.data))
      .catch((e) => toast.error(e.message));
  }, []);

  const update = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.target);
      const body = {
        default_currency_code: fd.get("default_currency_code"),
        notifications: {
          pushEnabled: fd.get("pushEnabled") === "on",
          smsEnabled: fd.get("smsEnabled") === "on",
        },
        payment_api: {
          provider: fd.get("payment_provider"),
          publicKey: fd.get("payment_public"),
          webhookSecret: fd.get("payment_webhook"),
        },
        sms_provider: {
          provider: fd.get("sms_provider_name"),
          templateId: fd.get("sms_template"),
        },
      };
      const { data: res } = await api.put("/settings", body);
      setData(res.data);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="text-sm text-slate-500">Loading…</div>;

  const n = data.notifications || {};
  const p = data.payment_api || {};
  const s = data.sms_provider || {};

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500">Defaults, notifications, and payment provider configuration</p>
      </div>

      <form onSubmit={update} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Default currency</h2>
          <div>
            <Label>Currency code</Label>
            <Input name="default_currency_code" defaultValue={data.default_currency_code || "ETB"} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notifications</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pushEnabled" defaultChecked={!!n.pushEnabled} />
            Enable push notifications (stub until keys configured)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="smsEnabled" defaultChecked={!!n.smsEnabled} />
            Enable SMS (uses server SMS_API_URL when set)
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment API</h2>
          <div>
            <Label>Provider label</Label>
            <Input name="payment_provider" defaultValue={p.provider || ""} placeholder="e.g. waafi" />
          </div>
          <div>
            <Label>Public key</Label>
            <Input name="payment_public" defaultValue={p.publicKey || ""} />
          </div>
          <div>
            <Label>Webhook secret</Label>
            <Input name="payment_webhook" type="password" defaultValue={p.webhookSecret || ""} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">SMS provider meta</h2>
          <div>
            <Label>Provider name</Label>
            <Input name="sms_provider_name" defaultValue={s.provider || "custom"} />
          </div>
          <div>
            <Label>Template id</Label>
            <Input name="sms_template" defaultValue={s.templateId || ""} />
          </div>
        </section>

        {can("settings:update") ? (
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
        ) : (
          <p className="text-sm text-slate-500">You can view settings but not update them.</p>
        )}
      </form>

      {can("notifications:send") ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Manual reminder job</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Refreshes statuses and sends SMS/push stubs for unpaid customers.
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            type="button"
            onClick={async () => {
              try {
                await api.post("/notifications/remind-unpaid");
                toast.success("Reminder job finished");
              } catch (e) {
                toast.error(e.message);
              }
            }}
          >
            Run unpaid reminders
          </Button>
        </div>
      ) : null}
    </div>
  );
}
