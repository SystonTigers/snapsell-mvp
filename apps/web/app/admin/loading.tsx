export default function AdminLoading() {
  return (
    <main className="p-6 space-y-4" aria-busy>
      <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </main>
  );
}
