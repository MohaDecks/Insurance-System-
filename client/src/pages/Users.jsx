import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select } from "../components/Input.jsx";

export default function UsersPage() {
  const can = useCan();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    const { data } = await api.get("/users", { params: { limit: 100 } });
    setRows(data.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  useEffect(() => {
    api
      .get("/roles")
      .then((r) => setRoles(r.data.data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      roleId: roles[0]?._id || "",
      isActive: true,
    });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      roleId: u.role?._id || u.role,
      isActive: u.isActive,
    });
    setModal({ open: true, mode: "edit", record: u });
  };

  const save = async () => {
    try {
      if (modal.mode === "create") {
        await api.post("/users", {
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
          isActive: !!form.isActive,
        });
        toast.success("User created");
      } else {
        const body = {
          name: form.name,
          email: form.email,
          roleId: form.roleId,
          isActive: !!form.isActive,
        };
        if (form.password) body.password = form.password;
        await api.patch(`/users/${modal.record._id}`, body);
        toast.success("User updated");
      }
      setModal({ open: false, mode: "create", record: null });
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/users/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (u) => u.role?.name },
    {
      key: "active",
      label: "Active",
      render: (u) => (u.isActive ? "Yes" : "No"),
    },
    {
      key: "actions",
      label: "",
      render: (u) => (
        <div className="flex gap-2">
          {can("users:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(u)}>
              Edit
            </Button>
          ) : null}
          {can("users:delete") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs text-rose-600" onClick={() => setDel(u)}>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-sm text-slate-500">Created by administrators</p>
        </div>
        {can("users:create") ? (
          <Button onClick={openCreate} disabled={!roles.length}>
            Add user
          </Button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r._id }))} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add user" : "Edit user"}
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
            <Label>Email</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>{modal.mode === "create" ? "Password" : "Password (leave blank to keep)"}</Label>
            <Input type="password" value={form.password || ""} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.roleId || ""} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete user"
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
        <p className="text-sm">Delete user {del?.email}?</p>
      </Modal>
    </div>
  );
}
