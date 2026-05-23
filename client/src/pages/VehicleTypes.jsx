import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label } from "../components/Input.jsx";

export default function VehicleTypesPage() {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const { data } = await api.get("/vehicle-types");
    setRows(data.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const openCreate = () => {
    setForm({ name: "", sortOrder: "0" });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (r) => {
    setForm({ name: r.name, sortOrder: String(r.sortOrder ?? 0) });
    setModal({ open: true, mode: "edit", record: r });
  };

  const save = async () => {
    try {
      const body = {
        name: form.name,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (modal.mode === "create") {
        await api.post("/vehicle-types", body);
        toast.success("Created");
      } else {
        await api.patch(`/vehicle-types/${modal.record._id}`, body);
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
      await api.delete(`/vehicle-types/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "order", label: "Order", render: (r) => r.sortOrder ?? 0 },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("vehicle_types:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(r)}>
              Edit
            </Button>
          ) : null}
          {can("vehicle_types:delete") ? (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicle types</h1>
          <p className="text-sm text-slate-500">Catalog for customer registration (loaded from the database)</p>
        </div>
        {can("vehicle_types:create") ? (
          <Button onClick={openCreate}>Add vehicle type</Button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r._id }))} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add vehicle type" : "Edit vehicle type"}
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
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete vehicle type"
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
