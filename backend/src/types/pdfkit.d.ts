// Type definitions for PDFKit methods that are missing from the @types/pdfkit package
declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);

    // Properties
    y: number;
    page: { height: number; width: number };

    // Core methods used in our PDF generation
    image(path: string, x: number, y: number, options?: any): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(): this;
    stroke(): this;
    fillAndStroke(fillColor?: string, strokeColor?: string): this;
    lineTo(x: number, y: number): this;
    moveTo(x: number, y: number): this;

    // Text methods
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    fillColor(color: string): this;
    moveDown(lines?: number): this;

    // Document events
    on(event: string, callback: Function): this;
    end(): void;
  }

  export default PDFDocument;
}