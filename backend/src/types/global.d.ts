// Global type definitions

declare namespace PDFKit {
  interface PDFDocument {
    image(path: string, x: number, y: number, options?: any): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(): this;
    stroke(): this;
    lineTo(x: number, y: number): this;
    moveTo(x: number, y: number): this;
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    fillColor(color: string): this;
    moveDown(): this;
    on(event: string, callback: Function): this;
    end(): void;
  }
} 