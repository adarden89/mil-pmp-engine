import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center px-4 py-16">
      <div className="bg-grid mask-fade-b absolute inset-0" aria-hidden />
      <div className="relative w-full">
        <Suspense fallback={<div className="mx-auto h-72 max-w-md animate-pulse rounded-2xl bg-surface-2" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
