import { jsPDF } from "jspdf";

/**
 * Thin layout layer over jsPDF: a cursor that flows text down the page and
 * breaks pages automatically. Used server-side for the COOL packet downloads
 * and client-side for the Translation Studio export.
 */

const PAGE_MARGIN = 54;
const BRAND_RGB: [number, number, number] = [37, 99, 235];
const MUTED_RGB: [number, number, number] = [100, 116, 139];
const TEXT_RGB: [number, number, number] = [15, 23, 42];

export class PdfBuilder {
  readonly doc: jsPDF;
  private y = PAGE_MARGIN;
  private readonly width: number;
  private readonly height: number;

  constructor(private readonly footerText: string) {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.width = this.doc.internal.pageSize.getWidth();
    this.height = this.doc.internal.pageSize.getHeight();
  }

  private get contentWidth(): number {
    return this.width - PAGE_MARGIN * 2;
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed > this.height - PAGE_MARGIN - 24) {
      this.doc.addPage();
      this.y = PAGE_MARGIN;
    }
  }

  header(title: string, subtitle: string): this {
    this.doc.setFillColor(...BRAND_RGB);
    this.doc.rect(0, 0, this.width, 6, "F");
    this.doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...BRAND_RGB);
    this.doc.text("MILTOPMP ENTERPRISE", PAGE_MARGIN, this.y);
    this.y += 22;
    this.doc.setFontSize(20).setTextColor(...TEXT_RGB);
    for (const line of this.doc.splitTextToSize(title, this.contentWidth) as string[]) {
      this.doc.text(line, PAGE_MARGIN, this.y);
      this.y += 24;
    }
    this.doc
      .setFont("helvetica", "normal")
      .setFontSize(10)
      .setTextColor(...MUTED_RGB);
    this.paragraphLines(subtitle, 10, MUTED_RGB);
    this.y += 8;
    return this;
  }

  section(title: string): this {
    this.ensureSpace(40);
    this.y += 10;
    this.doc
      .setFont("helvetica", "bold")
      .setFontSize(12)
      .setTextColor(...TEXT_RGB);
    this.doc.text(title.toUpperCase(), PAGE_MARGIN, this.y);
    this.y += 6;
    this.doc.setDrawColor(226, 232, 240).setLineWidth(1);
    this.doc.line(PAGE_MARGIN, this.y, this.width - PAGE_MARGIN, this.y);
    this.y += 16;
    return this;
  }

  paragraph(text: string): this {
    this.doc.setFont("helvetica", "normal");
    this.paragraphLines(text, 10.5, TEXT_RGB);
    this.y += 6;
    return this;
  }

  private paragraphLines(text: string, size: number, color: [number, number, number]): void {
    this.doc.setFontSize(size).setTextColor(...color);
    const lineHeight = size * 1.45;
    for (const line of this.doc.splitTextToSize(text, this.contentWidth) as string[]) {
      this.ensureSpace(lineHeight);
      this.doc.text(line, PAGE_MARGIN, this.y);
      this.y += lineHeight;
    }
  }

  field(label: string, value: string | undefined): this {
    this.ensureSpace(22);
    this.doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...MUTED_RGB);
    this.doc.text(label.toUpperCase(), PAGE_MARGIN, this.y);
    this.doc
      .setFont("helvetica", "normal")
      .setFontSize(10.5)
      .setTextColor(...TEXT_RGB);
    const display = value && value.trim() ? value : "______________________________";
    this.doc.text(display, PAGE_MARGIN + 170, this.y);
    this.y += 20;
    return this;
  }

  /** Bold line with an optional muted suffix, used for numbered steps. */
  heading(text: string, suffix?: string): this {
    this.ensureSpace(36);
    this.y += 4;
    this.doc
      .setFont("helvetica", "bold")
      .setFontSize(11)
      .setTextColor(...TEXT_RGB);
    this.doc.text(text, PAGE_MARGIN, this.y);
    if (suffix) {
      const offset = this.doc.getTextWidth(text) + 8;
      this.doc
        .setFont("helvetica", "normal")
        .setFontSize(9)
        .setTextColor(...MUTED_RGB);
      if (offset + this.doc.getTextWidth(suffix) <= this.contentWidth) {
        this.doc.text(suffix, PAGE_MARGIN + offset, this.y);
      } else {
        this.y += 13;
        this.doc.text(suffix, PAGE_MARGIN, this.y);
      }
    }
    this.y += 16;
    return this;
  }

  /** A small caps label followed by wrapped body text, for long values. */
  labeled(label: string, text: string): this {
    this.ensureSpace(34);
    this.doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...MUTED_RGB);
    this.doc.text(label.toUpperCase(), PAGE_MARGIN, this.y);
    this.y += 14;
    return this.paragraph(text);
  }

  checklist(items: readonly string[]): this {
    this.doc
      .setFont("helvetica", "normal")
      .setFontSize(10.5)
      .setTextColor(...TEXT_RGB);
    for (const item of items) {
      const lines = this.doc.splitTextToSize(item, this.contentWidth - 22) as string[];
      this.ensureSpace(lines.length * 15 + 6);
      this.doc.setDrawColor(148, 163, 184).setLineWidth(0.8);
      this.doc.rect(PAGE_MARGIN, this.y - 9, 10, 10);
      for (const line of lines) {
        this.doc.text(line, PAGE_MARGIN + 20, this.y);
        this.y += 15;
      }
      this.y += 5;
    }
    return this;
  }

  bullets(items: readonly string[]): this {
    this.doc
      .setFont("helvetica", "normal")
      .setFontSize(10.5)
      .setTextColor(...TEXT_RGB);
    for (const item of items) {
      const lines = this.doc.splitTextToSize(item, this.contentWidth - 16) as string[];
      this.ensureSpace(lines.length * 15 + 4);
      this.doc.text("•", PAGE_MARGIN + 2, this.y);
      for (const line of lines) {
        this.doc.text(line, PAGE_MARGIN + 16, this.y);
        this.y += 15;
      }
      this.y += 3;
    }
    return this;
  }

  private stampFooters(): void {
    const pages = this.doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      this.doc.setPage(page);
      this.doc
        .setFont("helvetica", "normal")
        .setFontSize(7.5)
        .setTextColor(...MUTED_RGB);
      const lines = this.doc.splitTextToSize(this.footerText, this.contentWidth - 60) as string[];
      this.doc.text(lines, PAGE_MARGIN, this.height - 36);
      this.doc.text(`${page} / ${pages}`, this.width - PAGE_MARGIN, this.height - 36, { align: "right" });
    }
  }

  toArrayBuffer(): ArrayBuffer {
    this.stampFooters();
    return this.doc.output("arraybuffer");
  }

  save(filename: string): void {
    this.stampFooters();
    this.doc.save(filename);
  }
}
