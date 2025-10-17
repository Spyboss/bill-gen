# Date Handling Audit for the Billing Workflow

## 1. Bill Lifecycle Map (Creation → Persistence → Presentation)
| Stage | Layer | Current Implementation | Notes |
| --- | --- | --- | --- |
| Bill creation form | Frontend (legacy) | `BillForm` populates preview payloads with `new Date().toISOString()` when preparing PDF previews and submissions. | Implicitly uses the browser timezone at generation time, which can differ from the backend/server timezone and omit the intended bill date when the user expects a pure date without time.【F:frontend/src/pages/BillForm.jsx†L172-L246】 |
| Bill generator wizard | Frontend (primary) | `BillGenerator` converts Ant Design picker values with `.toISOString()` or falls back to `new Date().toISOString()` for `billDate` and `estimatedDeliveryDate`. | Sends full timestamp values even when only a date is chosen, coupling browser timezone offsets to persisted data.【F:frontend/src/components/BillGenerator.jsx†L190-L257】 |
| Bill editing | Frontend | `BillEdit` serialises edited dates with `.toISOString()` (or `new Date().toISOString()` as a fallback). | Editing without picking a date resets to "now" in the browser timezone, potentially mutating historical data.【F:frontend/src/pages/BillEdit.jsx†L141-L170】 |
| API payload handling | Backend controller | `createBill` passes request body directly into the Mongoose model and sets inventory `dateSold` with `new Date()` when marking bikes as sold. | Trusts client-provided timestamps and generates server dates in Node's local timezone (whatever the container/environment default is).【F:backend/src/controllers/billController.ts†L117-L200】 |
| Schema defaults | Database layer | `BillSchema` defines `billDate` with `default: Date.now`. | Default executes in server timezone and persists Date objects (Mongo stores UTC internally but creation uses system clock).【F:backend/src/models/Bill.ts†L69-L138】 |
| PDF generation | Backend service | `formatDate` converts stored dates to strings using UTC getters; PDF header consumes `bill.billDate`. | Mixing UTC conversion in PDF while other responses rely on local parsing can surface discrepancies if storage is not normalised to UTC.【F:backend/src/services/pdfService.ts†L100-L141】 |
| API responses | Backend | `Bill` model’s JSON transform keeps `billNumber`/`bill_number` in sync; timestamps return as ISO strings. | No explicit timezone conversion; relies on MongoDB default ISO-8601 UTC serialisation. |
| Bill list/detail views | Frontend | `BillList` and `BillView` format dates by creating `new Date(dateString)` and using UTC accessors. | Works for ISO UTC strings but silently fails for malformed data; no fallback for locale-only strings.【F:frontend/src/pages/BillList.jsx†L120-L170】【F:frontend/src/pages/BillView.jsx†L45-L85】 |

## 2. Collision Points & Potential Bug Scenarios

### 2.1 Browser vs. Server Timezone Mismatches
* **Scenario:** User selects 2024-06-01 in Sri Lanka (+05:30). `.toISOString()` converts to `2024-05-31T18:30:00.000Z`. Backend stores this UTC value. When using `getUTCDate()`, UI shows 31/05/2024 instead of 01/06/2024.
* **Scenario:** Operators relying on printed PDFs (UTC formatted) see a different date than the UI list (local `new Date()`), causing billing disputes.
* **Risk Points:** All `.toISOString()` fallbacks and server-side `new Date()` defaults.【F:frontend/src/components/BillGenerator.jsx†L190-L250】【F:backend/src/controllers/billController.ts†L117-L200】

### 2.2 Missing User Input Defaults
* **Scenario:** In edit flows, omitting the date field reverts to `new Date().toISOString()`, overwriting historical bill dates without operator awareness.
* **Scenario:** Creating a bill without selecting a date auto-assigns the current timestamp instead of prompting for confirmation, leading to incorrect billing periods.
* **Risk Points:** `BillEdit` and `BillGenerator` fallback logic.【F:frontend/src/pages/BillEdit.jsx†L141-L170】【F:frontend/src/components/BillGenerator.jsx†L190-L257】

### 2.3 Mixed Date Libraries & Parsing
* **Scenario:** Some screens rely on Moment.js (`QuotationList`/`QuotationView`) while others use native `Date` or `date-fns`. Differences in DST handling or parsing ambiguous strings (`2024-03-10`) can yield inconsistent displays.
* **Risk Points:** `BillList`, `BillView`, `InventoryList`, and PDF generator each implement bespoke formatting logic.【F:frontend/src/pages/BillList.jsx†L120-L170】【F:frontend/src/pages/BillView.jsx†L45-L85】【F:frontend/src/pages/Inventory/InventoryList.jsx†L6-L158】【F:backend/src/services/pdfService.ts†L100-L141】

### 2.4 Server Clock & UTC Drift
* **Scenario:** Container/server is configured to a non-UTC timezone. `Date.now`/`new Date()` defaults shift relative to UTC, and daylight-saving adjustments can backdate or future-date bills generated around DST boundaries.
* **Risk Points:** `BillSchema` default `Date.now`, inventory `dateSold`, status updates, audit logs.【F:backend/src/models/Bill.ts†L69-L138】【F:backend/src/controllers/billController.ts†L117-L200】

### 2.5 Client-Supplied Dates Without Validation
* **Scenario:** Malformed or locale-specific date strings (`01/02/2024`) slip through; backend `new Bill(req.body)` attempts to coerce them, leading to `Invalid Date` or misinterpreted formats.
* **Scenario:** Attackers craft timezone-specific payloads to create negative or far-future dates, impacting reporting and analytics.
* **Risk Points:** Absence of server-side parsing/validation before persistence.【F:backend/src/controllers/billController.ts†L117-L149】

## 3. Recommended Fixes & Implementation Patterns

### 3.1 Normalise to Zoned Date-Time Objects on the Frontend
* Use a dedicated library (e.g., Luxon) to capture the user’s intended calendar date and explicitly convert to UTC midnight before transmission.
```javascript
import { DateTime } from 'luxon';

const serializeBillDate = (pickerValue) => {
  if (!pickerValue) return null;
  return DateTime.fromJSDate(pickerValue.toDate(), { zone: userTimeZone })
    .startOf('day')
    .toUTC()
    .toISO();
};
```
* Retain the original timezone alongside the UTC instant when business rules depend on local context (e.g., `billDateLocalZone`).
* Enforce confirmation if the user leaves the date blank instead of silently defaulting to now.

### 3.2 Harden API Contracts & Validation
* Define the API payload explicitly in OpenAPI/TypeScript: bill creation accepts `billDateUtc` (ISO 8601 UTC) and optional `billDateLocal` (IANA zone + offset).
```ts
// DTO example
const billSchema = z.object({
  billDateUtc: z.string().datetime({ offset: true }),
  billDateLocal: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), zone: z.string() }).optional(),
  estimatedDeliveryDateUtc: z.string().datetime({ offset: true }).nullable(),
  // ...other fields
});
```
* Reject ambiguous formats server-side using `zod`/`class-validator`, logging and returning descriptive errors.

### 3.3 Centralise Backend Date Parsing
* Wrap all incoming timestamps with a utility that enforces UTC and clamps to valid ranges:
```ts
import { DateTime } from 'luxon';

export function parseUtcInstant(value: unknown, field: string): Date {
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be an ISO-8601 string`, 400);
  }
  const dt = DateTime.fromISO(value, { zone: 'utc' });
  if (!dt.isValid) {
    throw new AppError(`${field} is invalid: ${dt.invalidExplanation}`, 400);
  }
  return dt.toJSDate();
}
```
* Apply in controllers before constructing Mongoose models; derive `bill.billDate = parseUtcInstant(req.body.billDateUtc, 'billDate')`.

### 3.4 Store Canonical UTC Instants with Explicit Schema Fields
* Update Mongoose schema to include both UTC instant and optional local metadata:
```ts
const BillSchema = new Schema({
  billDateUtc: { type: Date, required: true },
  billDateLocal: {
    date: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    zone: { type: String }
  },
  // ...
}, { timestamps: true });
```
* Ensure indexes cover `billDateUtc` for reporting; migrate existing `billDate` values via a script (see §4).

### 3.5 Consistent Rendering Layer
* Encapsulate formatting into a shared helper that receives UTC instants and desired display zone (user preference or org default):
```ts
import { DateTime } from 'luxon';

export const formatBillDate = (isoString, zone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
  const dt = DateTime.fromISO(isoString, { zone: 'utc' });
  return dt.setZone(zone).toFormat('dd/MM/yyyy');
};
```
* Replace bespoke `new Date()` and `moment()` usages with this helper to avoid drift.

### 3.6 Logging & Observability
* Inject structured logs whenever date transformations occur (capture original value, parsed instant, zone).
* Emit metrics for rejected date payloads to monitor recurring issues.

## 4. Migration Strategy for Existing Data
1. **Schema migration:** add `billDateUtc` (Date), `billDateLocal` (embedded doc), keep legacy `billDate` temporarily.
2. **Backfill script:**
   ```ts
   const cursor = Bill.find({ billDateUtc: { $exists: false }, billDate: { $exists: true } }).cursor();
   for await (const bill of cursor) {
     const utc = DateTime.fromJSDate(bill.billDate, { zone: 'utc' });
     bill.billDateUtc = utc.toJSDate();
     bill.billDateLocal = { date: utc.setZone('Asia/Colombo').toFormat('yyyy-MM-dd'), zone: 'Asia/Colombo' };
     await bill.save();
   }
   ```
3. **Code updates:** switch reads to `billDateUtc`; deprecate `billDate` once rollout completes.
4. **Data validation:** run reports comparing old/new values to detect anomalies.

## 5. Testing & Quality Gates
* **Unit tests:** cover DST transitions (e.g., `2024-03-10T07:00:00Z` vs `2024-03-10T08:00:00Z`), leap years, and timezone changes using Luxon’s zone support.
* **Integration tests:** simulate browser submissions across multiple IANA zones to ensure consistent persistence.
* **Regression harness:** snapshot PDF outputs and UI renders for canonical scenarios before/after fixes.
* **Linting/CI:** enforce ISO strings in fixtures and forbid raw `new Date()` in business logic via ESLint custom rule.

## 6. Operational Safeguards
* Configure Node.js and the database container to run on UTC and document the requirement in deployment scripts.
* Add health checks that verify timezone assumptions (log `process.env.TZ`, `Intl.DateTimeFormat().resolvedOptions().timeZone`).
* Provide administrative UI controls to set organisational default display timezone.

## 7. Summary of Key Fixes
* Normalise all stored timestamps to UTC instants and persist the originating timezone when relevant.
* Replace ad-hoc date handling with shared utilities and Luxon (or date-fns-tz/Day.js) across frontend and backend layers.
* Enforce strict input validation, logging, and testing for edge cases (DST, leap years, ambiguous strings).
* Plan a structured migration to introduce explicit UTC/local schema fields without data loss.
