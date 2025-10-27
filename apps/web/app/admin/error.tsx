'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('SnapSell admin error', error);
  }, [error]);

  return (
    <main className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="text-sm text-slate-600">We were unable to load the admin tools. Retry the request or contact support if the issue persists.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
