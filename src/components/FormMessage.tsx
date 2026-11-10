export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-2xl border border-coral/50 bg-coral/10 px-4 py-3 text-sm">
        {error}
      </p>
    );
  if (info)
    return (
      <p role="status" className="rounded-2xl border border-mint/50 bg-mint/10 px-4 py-3 text-sm">
        {info}
      </p>
    );
  return null;
}
