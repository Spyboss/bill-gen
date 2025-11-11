# Multi‑Dealership Plan (Revised: Profile‑Based Branding, Separate Deployments)

## Executive Summary

- Keep each dealership as a separate deployment (frontend + backend), with its own MongoDB and secrets.
- Avoid schema changes to in‑use collections; add a single additive `branding` config per deployment.
- Make branding (logo, dealer name, address, contacts, primary color) configurable via the existing `/profile` UI, restricted to admin (role === 'admin').
- Modernize the PDF invoice look using current PDFKit services, mapping to existing `Bill` fields.
- Ensure other documents (Quotation, Inventory Report, emails) read the same branding config for consistency.
- Do not introduce new dependencies; admins paste Cloudinary image URLs directly, with instant small preview in the UI.
- Document all changes in `CHANGELOG.md` during implementation.

## Fact Check (Updated)

- Backend: Express + Mongoose with a single connection; no existing multi‑tenancy fields in models.
- PDF generation: implemented with PDFKit (`src/services/pdfService.ts`, `quotationPdfService.ts`, `inventoryPdfService.ts`); branding is hardcoded in code, not HTML templates.
- Frontend: `ProfilePage.jsx` exists with tabs (Profile, Security, Verification, Preferences, Activity). `BrandingManager.jsx` exists but is not routed and calls `/api/branding` endpoints that do not exist yet.
- Auth: `useAuth().isAdmin()` returns `user.role === 'admin'`. No “super_admin” role today; we will use the existing admin role only.
- Constraint guardrails: no route removals/renames, no breaking schema changes, no invention of new dependencies, keep MongoDB data compatible.

## Plan Overview

- Architecture: Separate deployment per dealer. Cloudflare Pages can host frontend; backend runs on a Node host. Each deployment sets `VITE_API_URL` to its backend.
// Branding storage: Add a `branding` collection (single document) in each dealer’s DB. Example fields:
  - `dealerName`, `addressLine1`, `addressLine2`, `phone`, `emailFrom`, `logoUrl` (Cloudinary), `primaryColor`.
  - Optional `footerNote`, `brandPartner` (e.g., “TMR Trading Lanka (Pvt) Ltd”).
  - Defaults: `dealerName` defaults to “TMR Trading Lanka (Pvt) Ltd” when branding is empty.
- Access control: Admin‑only endpoints using role check. No extra “super admin” gating required.
- UI placement: Add a “Branding” tab to the existing `/profile` page. Only visible when `isAdmin()`.
- Asset handling: Do not implement file uploads; accept Cloudinary URLs entered by admin (paste link). Show a small live image preview box immediately when a URL is pasted.

## Backend Additions (Additive, Minimal)

- Endpoints (admin‑guarded):
  - `GET /api/branding` → fetch current branding document.
  - `PUT /api/branding` → update fields (dealerName, address, phone, emailFrom, logoUrl, primaryColor, footerNote, brandPartner).
  - `GET /api/bills/preview` → generate a PDF bill preview using placeholder bill data + branding.
- Authorization: Reuse `authenticate` middleware and add a small guard `authorizeAdmin` that checks `user.role === 'admin'` and, if configured, `user.email === process.env.ADMIN_EMAIL`.
- PDFKit integration:
  - `pdfService.ts`: load branding and replace hardcoded header/footer text, colors, and logo.
  - `quotationPdfService.ts`, `inventoryPdfService.ts`: read branding for headers/footers and contact details.
  - Map to existing `Bill` fields: `billNumber`, `billDate`, `customerName`, `customerAddress`, `customerNIC`, `bikeModel`, `motorNumber`, `chassisNumber`, `bikePrice`, `downPayment`, `totalAmount`, `billType`.
  - Modern style: use `primaryColor` for accents, bold section headers, table with light backgrounds, signature + stamp area, and thank‑you footer (matching the ChatGPT‑generated sample look), all implemented with PDFKit.

## Frontend Integration (Existing `/profile`)

- Add a “Branding” tab to `ProfilePage.jsx` and render a simple form:
  - Dealer Name, Address lines, Phone, Email From.
  - Logo URL (Cloudinary link) with immediate small preview, Primary Color.
  - Optional Brand Partner, Footer Note.
  - “Generate PDF Preview” button calling `/api/bills/preview` and embedding the returned Blob in an `<iframe>`.
- Visibility: Show the tab only for `isAdmin()`; optionally also match `user.email` to `VITE_SUPER_ADMIN_EMAIL` if you want stricter client‑side gating (server still enforces admin).
- Replace displayed branding strings across other pages (headers, reports, Navbar title) with values from `/api/branding` once loaded, defaulting to “TMR Trading Lanka (Pvt) Ltd” if empty.
- Scope of string replacements: replace both “Gunawardhana” and “Gunawardana” variants everywhere (frontend UI and report headers) with dynamic `dealerName`.

## Other Documents & Emails

- Quotation PDFs: Update header to `dealerName` and `brandPartner`, contact lines from branding, and footer note.
- Inventory Report PDFs: Update company header to `dealerName` and apply `primaryColor` accents.
- Emails: Use `emailFrom` from branding when present; keep `RESEND_API_KEY` in secrets.
- No new fields like bank details or tax ID for now.

## Changes Minimization

- No schema changes to `Bill`, `Quotation`, `BikeInventory`, etc.; add one `branding` document per deployment.
- No new dependencies; Cloudinary URLs are just strings stored in branding.
- No route renames; endpoints are additive under `/api/branding` and `/api/bills/preview`.
- PDF generators continue to use PDFKit with updated text/logo/color pulled from branding.
 - No bankDetails or taxId introduced.

## Testing & Validation

- Unit: branding endpoint auth, payload validation, defaults when branding is absent.
- Integration: bill PDF with branding, quotation PDF with branding, inventory report with branding.
- UI: Branding tab visible only to admin; preview loads and displays.
- Security: Confirm `ADMIN_EMAIL` gating works when enabled; ensure non‑admins receive `403` on branding endpoints.

## Execution Checklist

- Backend
  - Add `branding` model and routes (`GET/PUT /api/branding`, `GET /api/bills/preview`).
  - Update `pdfService.ts`, `quotationPdfService.ts`, `inventoryPdfService.ts` to read branding.
  - Add `authorizeAdmin` middleware using role === 'admin'.
  - Rotate any committed secrets (e.g., `RESEND_API_KEY`) and move to deployment secrets.
  - Update `CHANGELOG.md` with all additive changes.
  - Add one‑time seed/guard to set `ADMIN_EMAIL` / `ADMIN_PASSWORD` as the initial admin.
- Frontend
  - Add “Branding” tab to `/profile` and simple form for URLs and text.
  - Call `/api/branding` and `/api/bills/preview` for save + preview.
  - Replace visible static “Gunawardhana/Gunawardana” branding with `dealerName` (default to “TMR Trading Lanka (Pvt) Ltd” if absent) across headers/reports/Navbars.
- Config
  - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the admin account in this deployment.
  - Set `VITE_API_URL` per deployment; add `VITE_SUPER_ADMIN_EMAIL` only for optional client‑side gating.

## Acceptance Criteria

- Admin can update logo URL, dealer name, address, phone, email from, and primary color via `/profile` → Branding tab.
- Bill, Quotation, Inventory report PDFs render with the modern style and reflect branding values.
- Other UIs no longer show “Gunawardhana/Gunawardana”; they use `dealerName` from branding or default to “TMR Trading Lanka (Pvt) Ltd”.
- No breaking changes to existing models or routes; only additive endpoints and config.
- All changes documented in `CHANGELOG.md`.

## Security & Operations

- Use admin‑only access to branding endpoints; optionally restrict to `ADMIN_EMAIL` for “super admin”.
- Keep secrets in the deployment platform; never commit real keys.
- Maintain CORS/CSRF allowlists per deployment.

## Notes on the Provided Python Sample

- We will reproduce the modern look with PDFKit (Node), not introduce ReportLab.
- Fields map to existing models (no new DB fields):
  - `invoice_no` → `billNumber`, `date_today` → `billDate`.
  - `customer_name`, `customer_address`, `customer_nic` → existing `Bill` fields.
  - `vehicle_model`, `motor_no`, `chassis_no` → `bikeModel`, `motorNumber`, `chassisNumber`.
  - `price`, `down_payment` → `bikePrice`, `downPayment`; totals use `totalAmount`.
  - `brand_partner` and footer contacts come from branding config. No bank details or tax IDs.

—

This revised plan removes the single multi‑tenant backend phase, centers on separate per‑dealer deployments, integrates branding into the existing `/profile` page for super admin, and modernizes PDFs using current PDFKit services with minimal, additive backend endpoints and no schema changes to in‑use collections.