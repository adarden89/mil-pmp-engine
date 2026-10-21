/** Document catalog, kept free of jsPDF so client components can import it cheaply. */
export const COOL_DOCUMENT_IDS = ["opnav-1500-57-prep", "jst-audit-checklist", "voucher-prep-worksheet"] as const;
export type CoolDocumentId = (typeof COOL_DOCUMENT_IDS)[number];

export const COOL_DOCUMENT_META: Record<
  CoolDocumentId,
  { title: string; description: string; filename: string; navyOnly?: boolean }
> = {
  "opnav-1500-57-prep": {
    title: "OPNAV 1500/57 Prep Packet",
    description:
      "Every field the Navy COOL funding request asks for, filled in from your answers, plus a timing check and a command routing memo. Transfer it onto the official form.",
    filename: "miltopmp-opnav-1500-57-prep-packet.pdf",
    navyOnly: true,
  },
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
