import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-brand uppercase">404 · Off course</p>
      <h1 className="mt-3 text-3xl font-semibold">This page isn&apos;t on the map</h1>
      <p className="mt-3 text-muted">The link may be outdated. Head back to base and pick up where you left off.</p>
      <LinkButton href="/" className="mt-8">
        Return home
      </LinkButton>
    </div>
  );
}
