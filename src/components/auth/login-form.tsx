"use client";

import { motion } from "framer-motion";
import { Mail, MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, Field, inputClasses } from "@/components/ui/primitives";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/utils";

export function LoginForm() {
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"));
  const linkExpired = params.get("error") === "link_expired";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(
    linkExpired ? "That sign-in link expired or was already used. Request a new one." : null,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Sign-in is not configured on this deployment yet.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (signInError) {
      setStatus("idle");
      setError(signInError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <Card className="mx-auto w-full max-w-md p-8">
      {status === "sent" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a secure sign-in link to <span className="text-fg">{email}</span>. It works once and expires soon.
          </p>
          <p className="mt-4 text-xs text-subtle">
            Using a .mil address? Government mail filters often delay or block external links. A personal email is
            usually faster.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h1 className="text-xl font-semibold">Sign in to MilToPMP</h1>
          <p className="mt-2 text-sm text-muted">No password. We email you a one-time link.</p>
          <Field label="Email" htmlFor="email" className="mt-6" error={error ?? undefined}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClasses}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(error)}
              required
            />
          </Field>
          <Button
            type="submit"
            className="mt-6 w-full"
            loading={status === "sending"}
            icon={<Mail className="size-4" aria-hidden />}
          >
            Email me a sign-in link
          </Button>
        </form>
      )}
    </Card>
  );
}
