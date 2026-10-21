import { describe, expect, it } from "vitest";
import { buildCoolDocument, packetPersonalizationSchema } from "./cool-packet";

function pdfHeader(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(new Uint8Array(buffer).slice(0, 5));
}

describe("COOL packet documents", () => {
  const personalization = packetPersonalizationSchema.parse({
    branch: "navy",
    credential: "PMP",
    fullName: "Jordan Rivera",
    rank: "IT1",
    rateOrMos: "Information Systems Technician",
    obligatedServiceEnd: "2028-06",
  });

  it("builds a valid PDF for each document", () => {
    for (const id of ["jst-audit-checklist", "voucher-prep-worksheet"] as const) {
      const buffer = buildCoolDocument(id, personalization);
      expect(pdfHeader(buffer)).toBe("%PDF-");
      expect(buffer.byteLength).toBeGreaterThan(2000);
    }
  });

  it("applies defaults and rejects malformed months", () => {
    expect(packetPersonalizationSchema.parse({})).toMatchObject({ branch: "navy", credential: "CAPM" });
    expect(packetPersonalizationSchema.safeParse({ targetExamMonth: "June" }).success).toBe(false);
  });
});
