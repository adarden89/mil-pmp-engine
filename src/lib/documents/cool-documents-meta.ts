/** Document catalog, kept free of jsPDF so client components can import it cheaply. */
export const COOL_DOCUMENT_IDS = ["jst-audit-checklist", "voucher-prep-worksheet"] as const;
export type CoolDocumentId = (typeof COOL_DOCUMENT_IDS)[number];

export const COOL_DOCUMENT_META: Record<CoolDocumentId, { title: string; description: string; filename: string }> = {
  "jst-audit-checklist": {
    title: "JST Audit Checklist",
    description: "Verify your Joint Services Transcript supports your PM education hours and experience narrative.",
    filename: "miltopmp-jst-audit-checklist.pdf",
  },
  "voucher-prep-worksheet": {
    title: "COOL Voucher Prep Worksheet",
    description:
      "Every field and approval your service's COOL request asks for, pre-filled, plus ESO and command email templates.",
    filename: "miltopmp-cool-voucher-worksheet.pdf",
  },
};
