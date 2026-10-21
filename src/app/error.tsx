"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-danger uppercase">Unexpected error</p>
      <h1 className="mt-3 text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-muted">
        The issue has been logged{error.digest ? ` (reference ${error.digest})` : ""}. Try again, and if it keeps
        happening, contact support with that reference.
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
