import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label } from "../components/Input.jsx";

export default function CurrenciesPage() {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const { data } = await api.get("/currencies");
    setRows(data.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const openCreate = () => {
    setForm({ code: "", name: "", symbol: "", isDefault: false });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (r) => {
    setForm({
      code: r.code,
      name: r.name,
      symbol: r.symbol || "",
      isDefault: r.isDefault,
    });
    setModal({ open: true, mode: "edit", record: r });
  };

  const save = async () => {
    try {
      const body = {
        code: form.code,
        name: form.name,
        symbol: form.symbol,
        isDefault: !!form.isDefault,
      };
      if (modal.mode === "create") {
        await api.post("/currencies", body);
        toast.success("Created");
      } else {
        await api.patch(`/currencies/${modal.record._id}`, body);
        toast.success("Updated");
      }
      setModal({ open: false, mode: "create", record: null });
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/currencies/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "symbol", label: "Symbol" },
    {
      key: "def",
      label: "Default",
      render: (r) => (r.isDefault ? <span className="text-emerald-600 font-semibold">Yes</span> : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("currencies:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(r)}>
              Edit
            </Button>
          ) : null}
          {can("currencies:delete") ? (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Currencies</h1>
          <p className="text-sm text-slate-500">Used across pricing and payments</p>
        </div>
        {can("currencies:create") ? <Button onClick={openCreate}>Add currency</Button> : null}
      </div>

      <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r._id }))} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add currency" : "Edit currency"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, mode: "create", record: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <Label>Code (e.g. ETB)</Label>
            <Input value={form.code || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Symbol</Label>
            <Input value={form.symbol || ""} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Default currency
          </label>
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete currency"
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
        <p className="text-sm">Delete {del?.code}?</p>
      </Modal>
    </div>
  );
}
