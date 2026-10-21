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
    for (const id of ["opnav-1500-57-prep", "jst-audit-checklist", "voucher-prep-worksheet"] as const) {
      const buffer = buildCoolDocument(id, personalization);
      expect(pdfHeader(buffer)).toBe("%PDF-");
      expect(buffer.byteLength).toBeGreaterThan(2000);
    }
  });

  it("never accepts identifiers it does not need", () => {
    const parsed = packetPersonalizationSchema.parse({ ssn: "123-45-6789", dodId: "1234567890" });
    expect(parsed).not.toHaveProperty("ssn");
    expect(parsed).not.toHaveProperty("dodId");
  });

  it("applies defaults and rejects malformed months", () => {
    expect(packetPersonalizationSchema.parse({})).toMatchObject({ branch: "navy", credential: "CAPM" });
    expect(packetPersonalizationSchema.safeParse({ targetExamMonth: "June" }).success).toBe(false);
  });
});
