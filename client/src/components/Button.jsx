export function Button({ variant = "primary", className = "", type = "button", disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50";
  const styles =
    variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "ghost"
        ? "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        : variant === "secondary"
          ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          : "bg-brand-600 text-white hover:bg-brand-700";
  return <button type={type} className={`${base} ${styles} ${className}`} disabled={disabled} {...props} />;
}
