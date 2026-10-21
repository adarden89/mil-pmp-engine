import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { FlashcardEngine } from "@/components/vault/flashcard-engine";
import { ResourceDirectory } from "@/components/vault/resource-directory";

export const metadata: Metadata = {
  title: "PMP Study Vault",
  description:
    "Spaced-repetition PMP and CAPM flashcards mapped to the People, Process, and Business Environment domains, plus a curated study resource directory.",
};

export default function VaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="Study vault"
        title="Drill what the exam actually weights"
        description="Cards are tagged by exam domain and by predictive, agile, or hybrid approach. Every answer moves a card through five Leitner boxes, so you spend your time on what you are about to forget."
      />
      <div className="mx-auto max-w-7xl space-y-24 px-4 py-14 sm:px-6 lg:px-8">
        <FlashcardEngine />
        <ResourceDirectory />
      </div>
    </>
  );
}
