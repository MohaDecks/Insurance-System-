import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client.js";
import { useAuth, useCan } from "../context/AuthContext.jsx";
import { Button } from "../components/Button.jsx";
import { Input, Label, Select } from "../components/Input.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Modal } from "../components/Modal.jsx";

const emptySectionForm = {
  id: "",
  label: "",
  sidebarTitle: "",
  kind: "links",
  menuLabel: "",
  menuIcon: "Folder",
  sortOrder: 50,
};

export default function ModulesPage() {
  const can = useCan();
  const { reload, isSuperEngr } = useAuth();
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    resource: "",
    label: "",
    path: "",
    icon: "FileText",
    section: "app",
  });
  const [sectionForm, setSectionForm] = useState(emptySectionForm);
  const [edit, setEdit] = useState(null);

  const sectionOptions = useMemo(
    () =>
      [...sections]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((s) => ({ value: s.id, label: s.label || s.id })),
    [sections]
  );

  const load = useCallback(async () => {
    const { data } = await api.get("/pages");
    const list = data.data.sections || [];
    setPages(data.data.pages || []);
    setSections(list);
    const ids = list.map((s) => s.id);
    if (ids.length) {
      setForm((f) => (ids.includes(f.section) ? f : { ...f, section: ids[0] }));
    }
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const registerSection = async (e) => {
    e.preventDefault();
    try {
      await api.post("/pages/sections", sectionForm);
      toast.success("Sidebar section added");
      setSectionForm(emptySectionForm);
      await load();
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeSection = async (id) => {
    if (!window.confirm(`Remove section "${id}"? Pages using it stay registered but won't show in sidebar until reassigned.`)) return;
    try {
      await api.delete(`/pages/sections/${encodeURIComponent(id)}`);
      toast.success("Section removed");
      await load();
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/pages", form);
      toast.success(data.message || "Page registered");
      setForm((f) => ({ ...f, resource: "", label: "", path: "" }));
      await load();
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      await api.patch(`/pages/${encodeURIComponent(edit.resource)}`, {
        label: edit.label,
        path: edit.path,
        section: edit.section,
      });
      toast.success("Updated — log out and in if sidebar did not refresh");
      setEdit(null);
      await load();
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (resource) => {
    if (!window.confirm(`Remove "${resource}" from registry?`)) return;
    try {
      await api.delete(`/pages/${encodeURIComponent(resource)}`);
      toast.success("Removed");
      await load();
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "label", label: "Page" },
    { key: "resource", label: "Key" },
    {
      key: "path",
      label: "Path",
      render: (r) => (
        <Link to={r.path} className="text-brand-600 hover:underline">
          {r.path}
        </Link>
      ),
    },
    {
      key: "section",
      label: "Sidebar",
      render: (r) => sections.find((s) => s.id === r.section)?.label || r.section,
    },
    {
      key: "perm",
      label: "Read permission",
      render: (r) => <code className="text-xs">{r.resource}:read</code>,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          {can("roles:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setEdit({ ...r })}>
              Edit
            </Button>
          ) : null}
          {can("roles:update") ? (
            <Button variant="ghost" className="!px-2 !py-1 text-xs text-rose-600" onClick={() => remove(r.resource)}>
              Remove
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const sectionColumns = [
    { key: "id", label: "ID" },
    { key: "label", label: "Dropdown label" },
    { key: "sidebarTitle", label: "Sidebar heading" },
    { key: "kind", label: "Type" },
    { key: "sortOrder", label: "Order" },
    {
      key: "actions",
      label: "",
      render: (r) =>
        can("roles:update") ? (
          <Button variant="ghost" className="!px-2 !py-1 text-xs text-rose-600" onClick={() => removeSection(r.id)}>
            Remove
          </Button>
        ) : null,
    },
  ];

  if (!isSuperEngr) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
        Page registry is only for users with <code>superEngr: true</code> in MongoDB (
        <code>users</code> collection). Set it in the database, then log out and log in.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Page registry</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Bogagga iyo qaybaha sidebar-ka waxay ka yimaadaan database-ka (<code>settings.sidebar_sections</code> iyo{" "}
          <code>registered_pages</code>). Ku dar qayb cusub, kadib bog ku xidh.
        </p>
      </div>

      {can("roles:update") ? (
        <form
          onSubmit={registerSection}
          className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Add sidebar section</h2>
          <div>
            <Label>Section id</Label>
            <Input
              value={sectionForm.id}
              onChange={(e) => setSectionForm((f) => ({ ...f, id: e.target.value }))}
              placeholder="sales"
              required
            />
          </div>
          <div>
            <Label>Dropdown label</Label>
            <Input
              value={sectionForm.label}
              onChange={(e) => setSectionForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Sales menu"
              required
            />
          </div>
          <div>
            <Label>Sidebar heading</Label>
            <Input
              value={sectionForm.sidebarTitle}
              onChange={(e) => setSectionForm((f) => ({ ...f, sidebarTitle: e.target.value }))}
              placeholder="Sales"
            />
            <p className="mt-1 text-xs text-slate-500">Cinwaanka qaybta sidebar-ka (haddii la isku darayo, hal madax).</p>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={sectionForm.kind} onChange={(e) => setSectionForm((f) => ({ ...f, kind: e.target.value }))}>
              <option value="links">Direct links</option>
              <option value="menu">Collapsible menu</option>
            </Select>
          </div>
          {sectionForm.kind === "menu" ? (
            <>
              <div>
                <Label>Menu label</Label>
                <Input
                  value={sectionForm.menuLabel}
                  onChange={(e) => setSectionForm((f) => ({ ...f, menuLabel: e.target.value }))}
                  placeholder="Sales"
                />
              </div>
              <div>
                <Label>Menu icon (Lucide name)</Label>
                <Input
                  value={sectionForm.menuIcon}
                  onChange={(e) => setSectionForm((f) => ({ ...f, menuIcon: e.target.value }))}
                />
              </div>
            </>
          ) : null}
          <Button type="submit">Add section</Button>
        </form>
      ) : null}

      <div>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Sidebar sections</h2>
        <DataTable columns={sectionColumns} rows={sections.map((r) => ({ ...r, id: r.id }))} />
      </div>

      {can("roles:update") ? (
        <form
          onSubmit={register}
          className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Register new page</h2>
          <div>
            <Label>Resource key</Label>
            <Input
              value={form.resource}
              onChange={(e) => setForm((f) => ({ ...f, resource: e.target.value }))}
              placeholder="dealers"
              required
            />
          </div>
          <div>
            <Label>Label</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Path</Label>
            <Input value={form.path} onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))} placeholder="/dealers" />
          </div>
          <div>
            <Label>Sidebar section</Label>
            <Select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
              {sectionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Register page</Button>
        </form>
      ) : null}

      <div>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">All registered pages</h2>
        <DataTable columns={columns} rows={pages.map((r) => ({ ...r, id: r.resource }))} />
      </div>

      <p className="text-sm text-slate-500">
        Kadib: <Link to="/roles" className="text-brand-600 hover:underline">Roles & permissions</Link> → xulo Read
        → logout / login.
      </p>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit page" footer={
        <>
          <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
          <Button onClick={saveEdit}>Save</Button>
        </>
      }>
        {edit ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Key: {edit.resource} (lama beddeli karo)</p>
            <div>
              <Label>Label</Label>
              <Input value={edit.label} onChange={(e) => setEdit((x) => ({ ...x, label: e.target.value }))} />
            </div>
            <div>
              <Label>Path</Label>
              <Input value={edit.path} onChange={(e) => setEdit((x) => ({ ...x, path: e.target.value }))} />
            </div>
            <div>
              <Label>Sidebar section</Label>
              <Select value={edit.section} onChange={(e) => setEdit((x) => ({ ...x, section: e.target.value }))}>
                {sectionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
