import type { jsPDF } from "jspdf";
import { PdfBuilder } from "@/lib/documents/pdf-builder";
import {
  COLUMN_HEADINGS,
  formatDateRange,
  INTEGRITY_SENTENCE,
  normalizeText,
  oneLine,
  PACKET_FOOTER,
  processGroupEvidence,
  SUPERVISOR_CHECKLIST,
  supervisorRoleLabel,
  toPdfText,
  type SupervisorPacket,
} from "@/lib/supervisor-packet";

/**
 * One-page supervisor verification PDF. PdfBuilder supplies the letter-size
 * document, the footer on every page, and saving. The layout here is denser
 * than PdfBuilder's flowing sections (smaller type, grids, a two-column
 * comparison table) so a typical packet fits on one page. Everything the
 * supervisor acts on comes first; the glossary and process-group reference
 * come last, so a long write-up pushes only reference material onto page 2.
 */

type Rgb = [number, number, number];

// Same palette as PdfBuilder so every MilToPMP document looks related.
const BRAND: Rgb = [37, 99, 235];
const MUTED: Rgb = [100, 116, 139];
const TEXT: Rgb = [15, 23, 42];
const RULE: Rgb = [226, 232, 240];
const HEADER_FILL: Rgb = [241, 245, 249];
const BOX: Rgb = [148, 163, 184];

const MARGIN = 54;
const TOP = 36;
const BODY_SIZE = 8;
const LEADING = 9.75;
const CELL_PADDING = 6;
const COLUMN_GAP = 16;

class PacketLayout {
  private y = TOP;
  private readonly width: number;
  private readonly bottom: number;

  constructor(private readonly doc: jsPDF) {
    this.width = doc.internal.pageSize.getWidth();
    // Last baseline sits clear of PdfBuilder's footer, which is stamped at height - 36.
    this.bottom = doc.internal.pageSize.getHeight() - 48;
  }

  private get contentWidth(): number {
    return this.width - MARGIN * 2;
  }

  private style(size: number, weight: "normal" | "bold", color: Rgb = TEXT): void {
    this.doc.setFont("helvetica", weight).setFontSize(size).setTextColor(...color);
  }

  /** Wrap with the current font; call style() first. */
  private wrap(text: string, width: number): string[] {
    return this.doc.splitTextToSize(toPdfText(text), width) as string[];
  }

  /** Wrapped lines for multi-paragraph text, keeping blank lines between paragraphs. */
  private wrapParagraphs(text: string, width: number): string[] {
    return normalizeText(text)
      .split("\n")
      .flatMap((paragraph) => (paragraph.trim() ? this.wrap(paragraph, width) : [""]));
  }

  private newPage(): void {
    this.doc.addPage();
    this.y = TOP + 8;
  }

  private ensure(height: number): void {
    if (this.y + height > this.bottom) this.newPage();
  }

  header(title: string, subtitle: string): void {
    this.doc.setFillColor(...BRAND);
    this.doc.rect(0, 0, this.width, 6, "F");
    this.style(7.5, "bold", BRAND);
    this.doc.text("MILTOPMP ENTERPRISE", MARGIN, this.y);
    this.y += 18;
    this.style(15, "bold");
    for (const line of this.wrap(title, this.contentWidth)) {
      this.doc.text(line, MARGIN, this.y);
      this.y += 18;
    }
    this.style(8.5, "normal", MUTED);
    for (const line of this.wrap(subtitle, this.contentWidth)) {
      this.doc.text(line, MARGIN, this.y);
      this.y += 11;
    }
    this.y += 8;
  }

  section(title: string): void {
    this.ensure(30);
    this.y += 5;
    this.style(8.5, "bold");
    this.doc.text(toPdfText(title.toUpperCase()), MARGIN, this.y);
    this.y += 4;
    this.rule();
    this.y += 10;
  }

  rule(): void {
    this.doc.setDrawColor(...RULE).setLineWidth(0.8);
    this.doc.line(MARGIN, this.y, this.width - MARGIN, this.y);
  }

  gap(points: number): void {
    this.y += points;
  }

  /** Small-caps label above a wrapped value, laid out in equal columns. */
  grid(cells: { label: string; value: string; strong?: boolean }[], columns = 2): void {
    const columnWidth = (this.contentWidth - COLUMN_GAP * (columns - 1)) / columns;
    for (let start = 0; start < cells.length; start += columns) {
      const row = cells.slice(start, start + columns).map((cell) => {
        this.style(cell.strong ? 9.5 : 8.5, cell.strong ? "bold" : "normal");
        return { ...cell, lines: this.wrap(cell.value, columnWidth) };
      });
      const height = 10 + Math.max(...row.map((cell) => cell.lines.length)) * 11 + 5;
      this.ensure(height);
      row.forEach((cell, index) => {
        const x = MARGIN + index * (columnWidth + COLUMN_GAP);
        this.style(6.5, "bold", MUTED);
        this.doc.text(toPdfText(cell.label.toUpperCase()), x, this.y);
        this.style(cell.strong ? 9.5 : 8.5, cell.strong ? "bold" : "normal");
        cell.lines.forEach((line, lineIndex) => this.doc.text(line, x, this.y + 10 + lineIndex * 11));
      });
      this.y += height;
    }
  }

  /** The two-column table: evaluation text on the left, PMI text on the right, line by line. */
  comparison(left: { heading: string; text: string }, right: { heading: string; text: string }): void {
    const columnWidth = this.contentWidth / 2;
    const textWidth = columnWidth - CELL_PADDING * 2;
    this.style(BODY_SIZE, "normal");
    const leftLines = this.wrapParagraphs(left.text, textWidth);
    const rightLines = this.wrapParagraphs(right.text, textWidth);
    const rowCount = Math.max(leftLines.length, rightLines.length);
    const headerHeight = 17;

    this.ensure(headerHeight + LEADING * 4);
    let segmentTop = this.y;
    const drawHeader = (continued: boolean) => {
      this.doc.setFillColor(...HEADER_FILL);
      this.doc.rect(MARGIN, this.y, this.contentWidth, headerHeight, "F");
      this.style(8, "bold");
      const suffix = continued ? " (continued)" : "";
      this.doc.text(toPdfText(left.heading + suffix), MARGIN + CELL_PADDING, this.y + 11.5);
      this.doc.text(toPdfText(right.heading + suffix), MARGIN + columnWidth + CELL_PADDING, this.y + 11.5);
      this.y += headerHeight + 10;
      this.style(BODY_SIZE, "normal");
    };
    const closeSegment = () => {
      const segmentBottom = this.y - LEADING + 5;
      this.doc.setDrawColor(...RULE).setLineWidth(0.8);
      this.doc.rect(MARGIN, segmentTop, this.contentWidth, segmentBottom - segmentTop);
      this.doc.line(MARGIN + columnWidth, segmentTop, MARGIN + columnWidth, segmentBottom);
    };

    drawHeader(false);
    for (let row = 0; row < rowCount; row += 1) {
      if (this.y > this.bottom) {
        closeSegment();
        this.newPage();
        segmentTop = this.y;
        drawHeader(true);
      }
      if (leftLines[row]) this.doc.text(leftLines[row], MARGIN + CELL_PADDING, this.y);
      if (rightLines[row]) this.doc.text(rightLines[row], MARGIN + columnWidth + CELL_PADDING, this.y);
      this.y += LEADING;
    }
    closeSegment();
    this.y += 4;
  }

  paragraph(text: string, weight: "normal" | "bold" = "normal"): void {
    this.style(8.5, weight);
    for (const line of this.wrap(text, this.contentWidth)) {
      this.ensure(11);
      this.doc.text(line, MARGIN, this.y);
      this.y += 11;
    }
    this.y += 3;
  }

  checklist(items: readonly string[]): void {
    this.style(8.5, "normal");
    for (const item of items) {
      const lines = this.wrap(item, this.contentWidth - 16);
      this.ensure(lines.length * 11 + 2);
      this.doc.setDrawColor(...BOX).setLineWidth(0.8);
      this.doc.rect(MARGIN, this.y - 7, 7.5, 7.5);
      lines.forEach((line, index) => this.doc.text(line, MARGIN + 15, this.y + index * 11));
      this.y += lines.length * 11 + 2;
    }
  }

  /**
   * Term and translation pairs in two columns. "TERM  translation" shares a
   * line when it fits; otherwise the translation wraps under the term.
   */
  glossary(entries: { military: string; civilian: string }[]): void {
    const columnWidth = (this.contentWidth - COLUMN_GAP) / 2;
    const layoutEntry = (entry: { military: string; civilian: string }) => {
      this.style(BODY_SIZE, "bold");
      const term = toPdfText(entry.military);
      const termWidth = this.doc.getTextWidth(term) + 5;
      this.style(BODY_SIZE, "normal");
      const civilian = toPdfText(entry.civilian);
      if (termWidth + this.doc.getTextWidth(civilian) <= columnWidth) {
        return { term, termLines: [term], inline: civilian, lines: [] as string[], height: LEADING };
      }
      this.style(BODY_SIZE, "bold");
      const termLines = this.wrap(term, columnWidth);
      this.style(BODY_SIZE, "normal");
      const lines = this.wrap(civilian, columnWidth - 8);
      return { term, termLines, inline: null, lines, height: (termLines.length + lines.length) * LEADING };
    };

    for (let start = 0; start < entries.length; start += 2) {
      const row = entries.slice(start, start + 2).map(layoutEntry);
      const height = Math.max(...row.map((entry) => entry.height)) + 2;
      this.ensure(height);
      row.forEach((entry, index) => {
        const x = MARGIN + index * (columnWidth + COLUMN_GAP);
        this.style(BODY_SIZE, "bold");
        entry.termLines.forEach((line, lineIndex) => this.doc.text(line, x, this.y + lineIndex * LEADING));
        this.style(BODY_SIZE, "normal");
        if (entry.inline !== null) {
          this.style(BODY_SIZE, "bold");
          const offset = this.doc.getTextWidth(entry.term) + 5;
          this.style(BODY_SIZE, "normal");
          this.doc.text(entry.inline, x + offset, this.y);
        } else {
          const top = this.y + entry.termLines.length * LEADING;
          entry.lines.forEach((line, lineIndex) => this.doc.text(line, x + 8, top + lineIndex * LEADING));
        }
      });
      this.y += height;
    }
  }

  /** Bold label in a fixed left column, wrapped value to its right. */
  rows(entries: { label: string; value: string }[], labelWidth = 108): void {
    const valueWidth = this.contentWidth - labelWidth;
    for (const entry of entries) {
      this.style(BODY_SIZE, "bold");
      const labelLines = this.wrap(entry.label, labelWidth - 8);
      this.style(BODY_SIZE, "normal");
      const valueLines = this.wrap(entry.value, valueWidth);
      const height = Math.max(labelLines.length, valueLines.length) * LEADING + 2;
      this.ensure(height);
      valueLines.forEach((line, index) => this.doc.text(line, MARGIN + labelWidth, this.y + index * LEADING));
      this.style(BODY_SIZE, "bold");
      labelLines.forEach((line, index) => this.doc.text(line, MARGIN, this.y + index * LEADING));
      this.y += height;
    }
  }
}

function preparedDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Build the packet PDF. Call save() or toArrayBuffer() on the result. */
export function buildVerificationPdf(packet: SupervisorPacket, preparedOn: Date = new Date()): PdfBuilder {
  const { applicant, supervisor, project } = packet;
  const pdf = new PdfBuilder(PACKET_FOOTER);
  const layout = new PacketLayout(pdf.doc);
  const applicantName = oneLine(applicant.name);
  const supervisorName = oneLine(supervisor.name);
  const pmiTitle = oneLine(project.pmiTitle);
  const showPmiTitle = Boolean(pmiTitle) && pmiTitle.toLowerCase() !== oneLine(project.title).toLowerCase();

  layout.header(
    "Experience verification summary",
    `Prepared by ${applicantName} for ${supervisorName} on ${preparedDate(preparedOn)}, before submitting a PMI certification application.`,
  );

  layout.grid([
    { label: "Applicant", value: applicantName, strong: true },
    { label: "Supervisor", value: supervisorName, strong: true },
    { label: "Duty title at the time · contact", value: `${oneLine(applicant.dutyTitle)} · ${oneLine(applicant.contact)}` },
    {
      label: oneLine(supervisor.email) ? "Role · email" : "Role",
      value: [supervisorRoleLabel(supervisor.role), oneLine(supervisor.email)].filter(Boolean).join(" · "),
    },
  ]);

  layout.rule();
  layout.gap(12);
  layout.grid([
    { label: "Project", value: oneLine(project.title) },
    showPmiTitle
      ? { label: "Title on my PMI application", value: pmiTitle }
      : { label: "Dates", value: formatDateRange(project.startMonth, project.endMonth) },
    ...(showPmiTitle ? [{ label: "Dates", value: formatDateRange(project.startMonth, project.endMonth) }] : []),
    { label: "My role", value: oneLine(applicant.dutyTitle) },
  ]);

  layout.comparison(
    { heading: COLUMN_HEADINGS.military, text: project.militaryText },
    { heading: COLUMN_HEADINGS.pmi, text: project.pmiText },
  );

  layout.section("For the supervisor");
  layout.paragraph(INTEGRITY_SENTENCE, "bold");
  layout.checklist(SUPERVISOR_CHECKLIST);
  layout.paragraph("Nothing here needs a signature. A reply with corrections, or a note that it is accurate, is enough.");

  const glossary = project.glossary
    .map((entry) => ({ military: oneLine(entry.military), civilian: oneLine(entry.civilian) }))
    .filter((entry) => entry.military && entry.civilian);
  if (glossary.length > 0) {
    layout.section("Military terms and how I translated them");
    layout.glossary(glossary);
  }

  const evidence = processGroupEvidence(project.processGroups);
  if (evidence.length > 0) {
    layout.section("Project lifecycle evidence (PMI process groups)");
    layout.rows(evidence.map((group) => ({ label: group.label, value: group.items.join("; ") })));
  }

  return pdf;
}
