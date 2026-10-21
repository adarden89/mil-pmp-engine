import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SAMPLE_REQUEST, SAMPLE_TRANSLATION } from "./sample-translation";
import {
  buildMailtoLink,
  buildOutreachEmail,
  EMPTY_PROCESS_GROUPS,
  encodeMailtoValue,
  findSensitiveNumbers,
  formatDateRange,
  formatMonth,
  INTEGRITY_SENTENCE,
  issuesByField,
  MAILTO_MAX_LENGTH,
  normalizeText,
  packetFileName,
  packetSupervisorSchema,
  processGroupEvidence,
  projectFromSaved,
  SUPERVISOR_ROLES,
  supervisorPacketSchema,
  toPdfText,
  type SupervisorPacket,
} from "./supervisor-packet";
import type { SavedTranslation } from "./translation-schema";

const saved: SavedTranslation = {
  id: "8d6f1f2e-0d39-4f39-9d3b-7c8c3f1e2a10",
  projectTitle: SAMPLE_REQUEST.projectTitle,
  civilianProjectTitle: SAMPLE_TRANSLATION.civilianProjectTitle,
  branch: "navy",
  startMonth: SAMPLE_REQUEST.startMonth,
  endMonth: SAMPLE_REQUEST.endMonth,
  createdAt: "2026-10-01T12:00:00Z",
  input: SAMPLE_REQUEST,
  translation: SAMPLE_TRANSLATION,
};

function packet(overrides: Partial<SupervisorPacket> = {}): SupervisorPacket {
  return {
    applicant: { name: "Jordan Rivera", dutyTitle: "Leading Petty Officer", contact: "jordan.rivera@example.com" },
    supervisor: { name: "LCDR Dana Ortiz", role: "department_head", email: "dana.ortiz@example.com" },
    project: projectFromSaved(saved),
    ...overrides,
  };
}

/** Every key a zod schema accepts, nested objects included. */
function schemaKeys(schema: z.ZodType): string[] {
  if (schema instanceof z.ZodObject) {
    return Object.entries(schema.shape as Record<string, z.ZodType>).flatMap(([key, value]) => [
      key,
      ...schemaKeys(value),
    ]);
  }
  if (schema instanceof z.ZodArray) return schemaKeys(schema.element as z.ZodType);
  return [];
}

describe("supervisor packet input", () => {
  it("has no field for an SSN, DoD ID, birth date, unit, or location", () => {
    const keys = schemaKeys(supervisorPacketSchema).map((key) => key.toLowerCase());
    expect(keys).toContain("militarytext");
    for (const key of keys) {
      expect(key).not.toMatch(/ssn|social|dod|edipi|birth|dob|unit|uic|location|address|station|base/);
    }
  });

  it("strips identifiers that are sent anyway", () => {
    const parsed = supervisorPacketSchema.parse({
      ...packet(),
      ssn: "123-45-6789",
      applicant: { ...packet().applicant, dodId: "1234567890", unit: "USS Example" },
    });
    expect(parsed).not.toHaveProperty("ssn");
    expect(parsed.applicant).not.toHaveProperty("dodId");
    expect(parsed.applicant).not.toHaveProperty("unit");
  });

  it("treats the supervisor email as optional but checks it when present", () => {
    const base = { name: "CDR Lee", role: "commanding_officer" as const };
    expect(packetSupervisorSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    const bad = packetSupervisorSchema.safeParse({ ...base, email: "not-an-email" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(issuesByField(bad.error).email).toMatch(/valid email/);
  });

  it("rejects an end month before the start month", () => {
    const result = supervisorPacketSchema.safeParse(
      packet({ project: { ...packet().project, startMonth: "2025-06", endMonth: "2025-01" } }),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(issuesByField(result.error)["project.endMonth"]).toMatch(/on or after/);
  });

  it("offers every role the wizard lists", () => {
    expect(SUPERVISOR_ROLES).toHaveLength(8);
  });
});

describe("projectFromSaved", () => {
  it("pairs the original bullets with the PMI summary and keeps the glossary and process groups", () => {
    const project = projectFromSaved(saved);
    expect(project.title).toBe("CANES network refresh");
    expect(project.pmiTitle).toBe(SAMPLE_TRANSLATION.civilianProjectTitle);
    expect(project.militaryText).toContain("LPO for 12-Sailor work center");
    expect(project.pmiText).toBe(SAMPLE_TRANSLATION.applicationSummary);
    expect(project.glossary.length).toBe(SAMPLE_TRANSLATION.jargonTranslations.length);
    expect(project.processGroups.planning.length).toBeGreaterThan(0);
  });
});

describe("text helpers", () => {
  it("normalizes line endings and blank lines", () => {
    expect(normalizeText("a  \r\nb\r\rc\n\n\n\nd ")).toBe("a\nb\n\nc\n\nd");
  });

  it("formats months and ranges", () => {
    expect(formatMonth("2024-03")).toBe("March 2024");
    expect(formatMonth("March")).toBe("March");
    expect(formatDateRange("2024-02", "2024-09")).toBe("February 2024 to September 2024");
    expect(formatDateRange("2024-02", "2024-02")).toBe("February 2024");
    expect(formatDateRange("", "")).toBe("");
  });

  it("lists only process groups with evidence, in lifecycle order", () => {
    const groups = { ...EMPTY_PROCESS_GROUPS, closing: ["Handed over"], initiating: ["Set scope", "  "] };
    expect(processGroupEvidence(groups)).toEqual([
      { key: "initiating", label: "Initiating", items: ["Set scope"] },
      { key: "closing", label: "Closing", items: ["Handed over"] },
    ]);
  });

  it("makes a safe file name", () => {
    expect(packetFileName({ title: "CANES / network refresh!" })).toBe(
      "supervisor-verification-canes-network-refresh.pdf",
    );
    expect(packetFileName({ title: "***" })).toBe("supervisor-verification-project.pdf");
  });
});

describe("buildOutreachEmail", () => {
  it("always carries the integrity sentence, the project, and the dates", () => {
    const email = buildOutreachEmail(packet());
    expect(email.body).toContain(INTEGRITY_SENTENCE);
    expect(email.body).toContain("CANES network refresh");
    expect(email.body).toContain("February 2024 to September 2024");
    expect(email.body).toContain("when you were my Department Head");
    expect(email.subject).toBe("Quick review of my PMI application: CANES network refresh");
  });

  it("explains the random audit, shows both columns, and asks for corrections", () => {
    const { body } = buildOutreachEmail(packet());
    expect(body).toMatch(/selects some applications for audit at random/);
    expect(body).toContain("WHAT MY EVALUATION SAYS");
    expect(body).toContain("WHAT I WROTE FOR PMI");
    expect(body).toMatch(/reply with any corrections/);
    expect(body.indexOf("WHAT MY EVALUATION SAYS")).toBeLessThan(body.indexOf("WHAT I WROTE FOR PMI"));
  });

  it("never asks for a signature now or makes a promise about the audit", () => {
    const { body, subject } = buildOutreachEmail(packet());
    // Only the applicant's own letter; the quoted evaluation and PMI text below it are the member's material.
    const text = `${subject}\n${body.slice(0, body.indexOf("WHAT MY EVALUATION SAYS"))}`;
    expect(text).toContain("There is nothing to sign right now");
    expect(text).not.toMatch(/please sign|sign (?:and|the) |guarantee|audit-proof|asap|urgent|deadline/i);
  });

  it("leaves out empty optional sections instead of printing blanks", () => {
    const project = {
      ...packet().project,
      pmiTitle: "",
      glossary: [],
      processGroups: EMPTY_PROCESS_GROUPS,
    };
    const { body } = buildOutreachEmail(packet({ project, supervisor: { ...packet().supervisor, email: "" } }));
    expect(body).not.toContain("Project title on my application");
    expect(body).not.toContain("MILITARY TERMS I TRANSLATED");
    expect(body).not.toMatch(/undefined|null/);
    expect(body).toContain(INTEGRITY_SENTENCE);
  });

  it("includes the civilian title and glossary when they add something", () => {
    const { body } = buildOutreachEmail(packet());
    expect(body).toContain(`Project title on my application: ${SAMPLE_TRANSLATION.civilianProjectTitle}`);
    expect(body).toContain("MILITARY TERMS I TRANSLATED");
    expect(body).toContain(`- ${SAMPLE_TRANSLATION.jargonTranslations[0].military}:`);
  });

  it("keeps names and the subject on one line and normalizes pasted line endings", () => {
    const email = buildOutreachEmail(
      packet({
        supervisor: { name: "CDR\nLee", role: "other", email: "" },
        project: { ...packet().project, title: "Line one\r\nline two", militaryText: "- First\r\n- Second" },
      }),
    );
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.body).toContain("Hello CDR Lee,");
    expect(email.body).toContain("when you were my supervisor");
    expect(email.body).toContain("- First\n- Second");
    expect(email.body).not.toContain("\r");
  });

  it("shortens very long titles in the subject only", () => {
    const title = "A".repeat(150);
    const email = buildOutreachEmail(packet({ project: { ...packet().project, title } }));
    expect(email.subject.length).toBeLessThan(130);
    expect(email.subject.endsWith("...")).toBe(true);
    expect(email.body).toContain(title);
  });
});

describe("buildMailtoLink", () => {
  const short = { subject: "Quick review: CANES & more", body: "Hello,\nLine two\r\nLine three" };

  it("encodes the subject and body, with CRLF line breaks", () => {
    const link = buildMailtoLink("dana.ortiz@example.com", short);
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    expect(link.href.startsWith("mailto:dana.ortiz@example.com?subject=")).toBe(true);
    expect(link.href).toContain("Quick%20review%3A%20CANES%20%26%20more");
    expect(link.href).toContain("Hello%2C%0D%0ALine%20two%0D%0ALine%20three");
    expect(link.href).not.toContain("%0D%0D");
    expect(decodeURIComponent(link.href.split("&body=")[1])).toBe("Hello,\r\nLine two\r\nLine three");
  });

  it("leaves the recipient blank when there is no valid address", () => {
    for (const to of [undefined, "", "not an email"]) {
      const link = buildMailtoLink(to, short);
      expect(link.ok && link.href.startsWith("mailto:?subject=")).toBe(true);
    }
  });

  it("encodes characters in the address that would break the link", () => {
    const link = buildMailtoLink("a+b@example.com", short);
    expect(link.ok && link.href.startsWith("mailto:a%2Bb@example.com?")).toBe(true);
  });

  it("refuses links mail apps may truncate", () => {
    const link = buildMailtoLink("dana.ortiz@example.com", buildOutreachEmail(packet()));
    expect(link.ok).toBe(false);
    if (link.ok) return;
    expect(link.reason).toBe("too_long");
    expect(link.limit).toBe(MAILTO_MAX_LENGTH);
    expect(link.length).toBeGreaterThan(MAILTO_MAX_LENGTH);
  });

  it("counts the encoded length, not the raw length", () => {
    const body = "\n".repeat(400);
    expect(encodeMailtoValue(body).length).toBe(400 * 6);
    expect(buildMailtoLink(undefined, { subject: "s", body }, 2000).ok).toBe(false);
  });
});

describe("findSensitiveNumbers", () => {
  it("flags SSN and DoD ID shapes", () => {
    expect(findSensitiveNumbers("SSN 123-45-6789 on the header")).toEqual(["ssn"]);
    expect(findSensitiveNumbers("SSN 123456789")).toEqual(["ssn"]);
    expect(findSensitiveNumbers("DoD ID 1234567890")).toEqual(["dod_id"]);
  });

  it("ignores budgets, counts, dates, and phone numbers", () => {
    expect(findSensitiveNumbers("Managed $180,000 and 220 workstations; 2024-02; call 555-123-4567")).toEqual([]);
    expect(findSensitiveNumbers("Budget of 1,234,567,890 dollars")).toEqual([]);
  });
});

describe("toPdfText", () => {
  it("keeps WinAnsi punctuation and replaces symbols the PDF fonts cannot draw", () => {
    expect(toPdfText("“Quoted” – done… • item")).toBe("“Quoted” – done… • item");
    expect(toPdfText("A → B, ≥ 3, 5×")).toBe("A -> B, >= 3, 5x");
    expect(toPdfText("Ship 🚢 done​")).toBe("Ship  done");
    expect(toPdfText("Line\nbreak")).toBe("Line\nbreak");
  });
});
