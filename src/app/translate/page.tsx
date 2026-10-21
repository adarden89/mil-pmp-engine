import type { Metadata } from "next";
import { TranslationStudio } from "@/components/translate/translation-studio";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "AI Translation Studio",
  description:
    "Translate military evaluation bullets into first-person PMI project experience with an audit-density score.",
};

export default function TranslatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Military-to-PMI translation studio"
        title="Your evaluations already prove you lead projects. Now say it in PMI's language."
        description="Paste the bullets from one project. You get a 200 to 500 word first-person description, evidence mapped across the project lifecycle, a jargon glossary, and an audit-risk score, ready to copy or export."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <TranslationStudio />
      </div>
    </>
  );
}
