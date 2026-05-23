import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useCan } from "../context/AuthContext.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Textarea } from "../components/Input.jsx";
import {
  CRUD_ORDER,
  RESOURCE_LABELS,
  groupPermissionsForMatrix,
} from "../config/permissionMatrix.js";

export default function RolesPage() {
  const can = useCan();
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "create", record: null });
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", selected: new Set() });

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([api.get("/roles"), api.get("/permissions")]);
    setRoles(r.data.data);
    setPerms(p.data.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const openCreate = () => {
    setForm({ name: "", description: "", selected: new Set() });
    setModal({ open: true, mode: "create", record: null });
  };

  const openEdit = (role) => {
    const selected = new Set((role.permissions || []).map((x) => x._id || x));
    setForm({ name: role.name, description: role.description || "", selected });
    setModal({ open: true, mode: "edit", record: role });
  };

  const togglePerm = (id) => {
    setForm((f) => {
      const next = new Set(f.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, selected: next };
    });
  };

  const save = async () => {
    try {
      const permissionIds = [...form.selected];
      if (modal.mode === "create") {
        await api.post("/roles", {
          name: form.name,
          description: form.description,
          permissionIds,
        });
        toast.success("Role created");
      } else {
        await api.patch(`/roles/${modal.record._id}`, {
          name: form.name,
          description: form.description,
          permissionIds,
        });
        toast.success("Role updated");
      }
      setModal({ open: false, mode: "create", record: null });
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/roles/${del._id}`);
      toast.success("Deleted");
      setDel(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const matrixRows = useMemo(() => groupPermissionsForMatrix(perms), [perms]);

  const columns = [
    { key: "name", label: "Role" },
    { key: "desc", label: "Description", render: (r) => r.description || "—" },
    {
      key: "n",
      label: "Permissions",
      render: (r) => `${r.permissions?.length || 0} keys`,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("roles:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(r)}>
              Edit
            </Button>
          ) : null}
          {can("roles:delete") ? (
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Roles & permissions</h1>
          <p className="text-sm text-slate-500">Controls sidebar visibility and API access</p>
        </div>
        {can("roles:create") ? <Button onClick={openCreate}>Add role</Button> : null}
      </div>

      <DataTable columns={columns} rows={roles.map((r) => ({ ...r, id: r._id }))} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: "create", record: null })}
        title={modal.mode === "create" ? "Add role" : "Edit role"}
        size="xl"
        description="Tick Create, Read, Update, Delete per module (same rules as before)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, mode: "create", record: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950/80">
                  <th className="px-3 py-2">Module</th>
                  {CRUD_ORDER.map((a) => (
                    <th key={a} className="px-2 py-2 text-center">
                      {a}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center">Other</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr
                    key={row.resource}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {RESOURCE_LABELS[row.resource] || row.resource}
                    </td>
                    {CRUD_ORDER.map((action) => {
                      const p = row.byAction[action];
                      return (
                        <td key={action} className="px-2 py-2 text-center align-middle">
                          {p ? (
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              checked={form.selected.has(p._id)}
                              onChange={() => togglePerm(p._id)}
                              aria-label={`${row.resource} ${action}`}
                            />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center align-middle">
                      {row.extras.length ? (
                        <div className="flex flex-col items-center gap-1">
                          {row.extras.map((p) => (
                            <label key={p._id} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                checked={form.selected.has(p._id)}
                                onChange={() => togglePerm(p._id)}
                              />
                              <span className="font-mono">{p.action}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete role"
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
        <p className="text-sm">Delete role {del?.name}?</p>
      </Modal>
    </div>
  );
}
