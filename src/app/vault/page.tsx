import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { FlashcardEngine } from "@/components/vault/flashcard-engine";
import { ResourceDirectory } from "@/components/vault/resource-directory";

export const metadata: Metadata = {
  title: "PMP Study Vault",
  description:
    "Beginner-friendly CAPM and PMP flashcards across PM Fundamentals, Agile/Scrum, Predictive, Hybrid, and Business Analysis, plus a directory of top trainers and tools.",
};

export default function VaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="Zero-knowledge study vault"
        title="From 'what is a project?' to exam-ready"
        description="Five categories, starting from absolute basics: PM Fundamentals, Agile / Scrum, Predictive / Waterfall, Hybrid, and Business Analysis. Every answer moves a card through five Leitner boxes, so you spend your time on what you are about to forget."
      />
      <div className="mx-auto max-w-7xl space-y-24 px-4 py-14 sm:px-6 lg:px-8">
        <FlashcardEngine />
        <ResourceDirectory />
      </div>
    </>
  );
}
