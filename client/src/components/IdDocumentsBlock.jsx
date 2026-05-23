import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { deleteCustomerIdDocument, postCustomerIdDocument } from "../api/customerUploads.js";
import { Button } from "./Button.jsx";
import { Label } from "./Input.jsx";
import { Modal } from "./Modal.jsx";

function isPdf(mime, name) {
  if (mime?.includes("pdf")) return true;
  return String(name || "").toLowerCase().endsWith(".pdf");
}

/**
 * Upload + thumbnail strip + lightbox for customer ID documents.
 * `documents` items should include `url`, `fileId`, `originalName`, `mimeType`.
 */
export default function IdDocumentsBlock({
  customerId,
  documents = [],
  canEdit,
  onUpdated,
  compact,
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const onPickFiles = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files?.length || !customerId) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const { data } = await postCustomerIdDocument(customerId, file);
          onUpdated?.(data.data);
        }
        toast.success(files.length > 1 ? "Files uploaded" : "File uploaded");
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [customerId, onUpdated]
  );

  const remove = async (fileId) => {
    if (!customerId) return;
    try {
      const { data } = await deleteCustomerIdDocument(customerId, fileId);
      onUpdated?.(data.data);
      toast.success("Removed");
      setPreview((p) => (p?.fileId === fileId ? null : p));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  if (!customerId) {
    return (
      <div className="flex min-h-[4.5rem] items-center rounded-xl border border-dashed border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100/80 px-4 py-3 text-xs text-slate-600 dark:border-slate-600 dark:from-slate-800/60 dark:to-slate-900/40 dark:text-slate-400">
        <span className="leading-relaxed">
          Save the customer first, then you can upload passport / license / dhalasho scans here. Files appear in a horizontal row with <strong className="font-semibold text-slate-700 dark:text-slate-300">View</strong> to open full size.
        </span>
      </div>
    );
  }

  /** Landscape preview strip (not square). */
  const thumbFrame = compact
    ? "relative aspect-[5/3] w-full min-h-[4.25rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
    : "relative aspect-[5/3] w-full min-h-[5.5rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800";

  const cardW = compact ? "w-[9.25rem]" : "w-[11.5rem]";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {canEdit ? (
          <div className="min-w-0 flex-1 sm:max-w-md">
            <Label>ID scan (passport / license / dhalasho)</Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              multiple
              disabled={uploading}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700"
              onChange={onPickFiles}
            />
            <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, or PDF · max 8 MB each · up to 8 files</p>
          </div>
        ) : null}
      </div>

      {documents.length ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin]">
          {documents.map((d) => (
            <div
              key={d.fileId}
              className={`group flex ${cardW} flex-shrink-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/80`}
            >
              <button
                type="button"
                className={`${thumbFrame} block w-full ring-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-500`}
                onClick={() => setPreview(d)}
              >
                {isPdf(d.mimeType, d.originalName) ? (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    PDF
                  </div>
                ) : (
                  <img src={d.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </button>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  className="!min-h-0 flex-1 !px-2 !py-1.5 !text-xs"
                  onClick={() => setPreview(d)}
                >
                  View
                </Button>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="!min-h-0 !px-2 !py-1.5 !text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => remove(d.fileId)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No ID scans uploaded yet.</p>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="ID document — full view" size="xl">
        {preview ? (
          <div className="max-h-[75vh] overflow-auto">
            {isPdf(preview.mimeType, preview.originalName) ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">{preview.originalName || "PDF"}</p>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  Open PDF in new tab
                </a>
                <embed src={preview.url} type="application/pdf" className="mt-2 h-[65vh] w-full rounded-lg border border-slate-200 dark:border-slate-700" />
              </div>
            ) : (
              <img src={preview.url} alt="" className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain" />
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
