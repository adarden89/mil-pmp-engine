import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { LinkButton } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";
import { loginHref } from "@/lib/api-client";
import { isProductId } from "@/lib/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <>
      <PageHeader
        eyebrow="Command dashboard"
        title="Your certification operation"
        description="Everything you have unlocked, where you stand, and the next action to take."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* The session read happens at request time, so it streams in behind this boundary. */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const params = await searchParams;
  const welcome = typeof params.welcome === "string" && isProductId(params.welcome) ? params.welcome : null;

  if (!supabasePublicConfig()) {
    return (
      <Card className="p-8 text-sm text-muted">
        Accounts are not configured on this deployment yet. Set the Supabase variables in your environment to enable
        sign-in and purchases.
      </Card>
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-semibold">Sign in to see your dashboard</h2>
        <p className="mt-2 text-sm text-muted">We will email you a secure one-time link. No password to remember.</p>
        <LinkButton href={loginHref("/dashboard")} className="mt-6">
          Sign in
        </LinkButton>
      </Card>
    );
  }

  const entitlements = await getEntitlements(supabase, user.id);
  return <DashboardView email={user.email} serverEntitlements={entitlements} welcome={welcome} />;
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[1.4fr_1fr]" aria-label="Loading dashboard">
      <div className="h-80 rounded-2xl bg-surface-2" />
      <div className="h-80 rounded-2xl bg-surface-2" />
    </div>
  );
}
