// PDFKit declarations
declare namespace PDFKit {
  interface PDFDocument {
    fontSize(size: number): PDFDocument;
    font(font: string): PDFDocument;
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    fillColor(color: string): PDFDocument;
    moveDown(): PDFDocument;
    on(event: string, callback: Function): PDFDocument;
    end(): void;
    lineWidth(width: number): PDFDocument;
    moveTo(x: number, y: number): PDFDocument;
    lineTo(x: number, y: number): PDFDocument;
    stroke(): PDFDocument;
    strokeColor(color: string): PDFDocument;
  }
}

// Override the Error constructor to include captureStackTrace
interface ErrorConstructor {
  captureStackTrace(targetObject: Object, constructorOpt?: Function): void;
}

// Module shims for ESM .js extension imports used in TypeScript sources
// These provide type awareness to the TS language server without changing runtime behavior.
declare module './verify-rate-limit.middleware.js' {
  import { RequestHandler } from 'express';
  export const verifyRateLimit: RequestHandler;
}

declare module '../models/EmailVerificationStatus.js' {
  import type { Model } from 'mongoose';
  export interface IEmailVerificationStatus {
    user: string;
    verified: boolean;
    verifiedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }
  const EmailVerificationStatus: Model<IEmailVerificationStatus>;
  export default EmailVerificationStatus;
}

// Verification enforcement middleware shim for ESM .js import path
declare module './verification-enforce.middleware.js' {
  import { RequestHandler } from 'express';
  export const enforceVerification: RequestHandler;
}

// Optional dependency: Resend email provider. In dev we may not install it; this
// shim ensures the TS server does not error on dynamic import usage.
declare module 'resend';