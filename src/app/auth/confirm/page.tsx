import { LogIn } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <div className="flex min-h-[70vh] items-center px-4 py-16">
      <Suspense fallback={<div className="mx-auto h-60 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <ConfirmCard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ConfirmCard({ searchParams }: { searchParams: PageProps<"/auth/confirm">["searchParams"] }) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = typeof params.type === "string" ? params.type : "";
  const next = safeRedirectPath(typeof params.next === "string" ? params.next : null);

  return (
    <Card className="mx-auto w-full max-w-md p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Finish signing in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One click to open your MilToPMP dashboard. This extra step stops email security scanners from using up your
        one-time link.
      </p>
      {tokenHash ? (
        <form action="/auth/confirm/verify" method="post" className="mt-6">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <Button type="submit" className="w-full" size="lg">
            Continue to my dashboard
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-destructive">
          This link is incomplete. Request a new one from the sign-in page.
        </p>
      )}
    </Card>
  );
}
