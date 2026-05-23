import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select, Textarea } from "../components/Input.jsx";

export default function InsuranceTypesPage() {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const { data } = await api.get("/insurance-types");
    setRows(data.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  useEffect(() => {
    api
      .get("/currencies")
      .then((r) => setCurrencies(r.data.data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({
      name: "",
      description: "",
      dailyPrice: "",
      currencyId: currencies.find((c) => c.isDefault)?._id || currencies[0]?._id || "",
    });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (r) => {
    setForm({
      name: r.name,
      description: r.description || "",
      dailyPrice: r.dailyPrice,
      currencyId: r.currency?._id || r.currency,
    });
    setModal({ open: true, mode: "edit", record: r });
  };

  const save = async () => {
    try {
      const body = {
        name: form.name,
        description: form.description,
        dailyPrice: Number(form.dailyPrice),
        currencyId: form.currencyId,
      };
      if (modal.mode === "create") {
        await api.post("/insurance-types", body);
        toast.success("Created");
      } else {
        await api.patch(`/insurance-types/${modal.record._id}`, body);
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
      await api.delete(`/insurance-types/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "desc", label: "Description", render: (r) => r.description || "—" },
    {
      key: "price",
      label: "Daily price",
      render: (r) => `${r.dailyPrice} ${r.currency?.code || ""}`,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("insurance_types:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(r)}>
              Edit
            </Button>
          ) : null}
          {can("insurance_types:delete") ? (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Insurance types</h1>
          <p className="text-sm text-slate-500">Plans and daily pricing</p>
        </div>
        {can("insurance_types:create") ? (
          <Button onClick={openCreate} disabled={!currencies.length}>
            Add type
          </Button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r._id }))} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add insurance type" : "Edit insurance type"}
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
            <Label>Name</Label>
            <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>Daily price</Label>
            <Input type="number" value={form.dailyPrice} onChange={(e) => setForm((f) => ({ ...f, dailyPrice: e.target.value }))} />
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
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete insurance type"
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
        <p className="text-sm">Delete type {del?.name}?</p>
      </Modal>
    </div>
  );
}
