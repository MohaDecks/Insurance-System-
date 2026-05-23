export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      {...props}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      rows={3}
      {...props}
    />
  );
}
