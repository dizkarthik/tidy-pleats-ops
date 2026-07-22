# Tidy Pleats Ops - KT Document

Last updated: 2026-07-22

This document is the knowledge-transfer guide for `tidy-pleats-ops`, the internal operations app for Tidy Pleats, a home-based saree pre-pleating service in Virudhunagar, Tamil Nadu.

The app is internal-only. Customers do not log in. The intended users are the owner and spouse.

## 1. Project Identity

- Project name: `tidy-pleats-ops`
- Local folder: `tidy-pleats-ops`
- GitHub repo: `dizkarthik/tidy-pleats-ops`
- Vercel project: `tidy-pleats-ops`
- Production URL: `https://tidy-pleats-ops.vercel.app`

Keep the project, repo, and Vercel names aligned. Renaming the Vercel project after GitHub connection can break the deployment link.

## 2. Tech Stack

- Framework: Next.js App Router
- UI: React, TypeScript, Tailwind CSS
- Database: Postgres
- ORM: Prisma 7
- Auth: custom credential login with session cookies
- Hosting: Vercel with GitHub auto-deploy
- File storage: Vercel Blob for saree photos
- Export: ExcelJS for customer Excel export
- Validation: Zod
- Icons: Lucide React

## 3. Current Scope

Implemented modules:

- Login and session auth for two internal users.
- Customer management:
  - Add customer
  - Edit customer
  - Customer list
  - Customer profile tabs: Details, Order History, Payment
  - Customer Excel export
  - Referral tracking through linked customer records
  - Size field: S, M, L, XL, XXL
- Order management:
  - Single and Multi order creation
  - Multiple saree items per order
  - Per-item delivery date, pickup/drop, notes, damage details, photo URL, price
  - Status workflow and status history
  - WhatsApp status updates
  - Mobile order filters and quick status chips
- Payments:
  - Payment transaction ledger
  - Payment recording on order detail
  - Payment history
  - Dues ledger with WhatsApp payment reminders
- Dashboard:
  - Needs Attention
  - Status Overview
  - Financial
  - Customers & Growth
- Mobile-first layout with PWA manifest and service worker.

Not implemented yet:

- Inventory
- Offers
- Full payment settlement workflow beyond recording transactions
- Customer-facing login or portal
- Notifications beyond manual WhatsApp links

## 4. How To Run Locally

From project root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Then open:

```text
http://localhost:3000
```

Default seed credentials, if seed override env vars are not set:

```text
owner / ChangeMeOwner123!
spouse / ChangeMeSpouse123!
```

Change these before using real data.

## 5. Environment Variables

Required:

```bash
DATABASE_URL="postgresql://..."
SESSION_COOKIE_NAME="tidy_pleats_ops_session"
BLOB_READ_WRITE_TOKEN="..."
```

Optional seed overrides:

```bash
SEED_OWNER_PASSWORD="..."
SEED_SPOUSE_PASSWORD="..."
```

Rules:

- Do not commit real secrets.
- `.env.example` is committed as the template.
- Vercel must have the same production env vars configured.
- `BLOB_READ_WRITE_TOKEN` is required for saree photo upload.
- `SESSION_COOKIE_NAME` has a code fallback, but setting it explicitly keeps environments clear.

### Production verification on 2026-07-22

Live Vercel production env vars were checked with `vercel env ls production`.

Present:

- `DATABASE_URL`
- `DATABASE_POSTGRES_URL`
- `DATABASE_PRISMA_DATABASE_URL`

Missing:

- `SESSION_COOKIE_NAME`
- `BLOB_READ_WRITE_TOKEN`
- `SEED_OWNER_PASSWORD`
- `SEED_SPOUSE_PASSWORD`

Impact:

- Login still works because `SESSION_COOKIE_NAME` falls back to `tidy_pleats_ops_session`.
- Saree photo uploads will fail in production until `BLOB_READ_WRITE_TOKEN` is added.
- The production `owner` and `spouse` users still matched the default seed passwords at verification time. Rotate both passwords immediately from `/account/password`.

Local production env file:

- `.env.production.local` exists on the original development machine.
- It is gitignored and was not handed off through GitHub.
- A new maintainer should recreate it from Vercel when needed:

```bash
npx --yes vercel env pull .env.production.local --environment=production
```

## 6. Important Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npx prisma studio
```

Production migration command pattern:

```bash
set -a; source .env.production.local; set +a; npx prisma migrate deploy
```

Use this only when the production database URL is available locally and you intend to apply migrations to production.

## 7. Project Structure

Key directories:

```text
src/app                 Next.js App Router pages and route handlers
src/components          Shared client/server UI components
src/lib                 Business logic, auth, actions, helpers
prisma                  Prisma schema, migrations, seed
public                  PWA manifest, icons, service worker
docs                    Handoff and KT docs
```

Important files:

```text
prisma/schema.prisma
prisma/seed.mjs
prisma.config.ts
src/lib/prisma.ts
src/lib/auth.ts
src/lib/actions.ts
src/lib/order-actions.ts
src/lib/status-actions.ts
src/lib/payment-actions.ts
src/lib/orders.ts
src/lib/order-status.ts
src/components/app-header.tsx
src/components/bottom-nav.tsx
src/components/order-form.tsx
src/components/customer-form.tsx
src/components/order-filter-controls.tsx
```

## 8. Data Model

### User

Stores the two internal users.

Important fields:

- `username`
- `passwordHash`
- `role`: OWNER or SPOUSE
- `sessions`
- `statusChanges`
- `paymentsRecorded`

### Session

Custom session storage.

- Raw session token is stored only in the browser cookie.
- `tokenHash` is stored in DB.
- Sessions expire after 30 days.

### Customer

Stores customer master data:

- name
- phone number, unique
- location
- address
- birthday date
- size
- referral kind
- referral source
- referred-by customer link
- notes
- date added

Referral design:

- Existing-customer referrals use `referredByCustomerId`.
- This is intentionally a foreign key, not free text, so referral counts remain accurate.

### Order

Represents one customer order.

Important fields:

- `customerId`
- `orderDate`
- `orderType`: SINGLE or MULTI
- `deliveryType`: ONE_TIME or MULTIPLE
- `discountValue`
- `discountType`
- `items`
- `payments`

Design note:

- Single and Multi orders share one schema.
- Single orders have one item and use `ONE_TIME` delivery.
- Delivery details are stored per item, even when the form collects common delivery once.

### OrderItem

Represents a saree inside an order.

Important fields:

- `sareeNumber`
- `palluPleats`
- `centerPleats`
- `photoUrl`
- `sareeNotes`
- `damageNoticed`
- `damageNotes`
- `informedToCustomer`
- `price`
- `neededBy`
- `pickupDrop`
- `address`
- `status`
- `statusUpdatedAt`
- `statusHistory`

### OrderItemStatusHistory

Append-only status audit history.

- Stores item status changes.
- Stores user who made the change.
- Used for traceability.

### Payment

Payment transaction ledger.

Important fields:

- `orderId`
- `amount`
- `method`: CASH or UPI
- `paymentDate`
- `recordedById`
- `notes`

Design note:

- Payment amounts are not stored on orders.
- Balance due is computed from order item totals, discount, and payment sum.
- Legacy `advancePaid` and `advancePaymentMethod` were migrated into `payments`.

## 9. Migrations

Current migrations:

```text
20260719000000_init
20260719131500_add_customer_size
20260719152000_add_order_management
20260719155000_add_order_item_status
20260719162000_replace_advance_with_payments
```

Important migration:

`20260719162000_replace_advance_with_payments`

- Creates `payments`.
- Backfills old advance paid values into payment records.
- Drops old order advance columns.
- Confirmed applied to the production DB via `_prisma_migrations` on 2026-07-22.
- Production `finished_at`: `2026-07-19 16:19:33.729159+00`.

Do not reintroduce editable payment fields on `orders`. Use `payments`.

## 10. Authentication

Auth files:

```text
src/lib/auth.ts
src/lib/actions.ts
src/app/login/page.tsx
src/app/account/password/page.tsx
src/components/change-password-form.tsx
```

How it works:

1. User submits username/password.
2. `loginAction` calls `signIn`.
3. `signIn` validates bcrypt password hash.
4. A random session token is generated.
5. Hash of token is stored in `sessions`.
6. Raw token is stored in an HTTP-only cookie.
7. `requireUser()` protects server pages and route handlers.

Password change:

- Route: `/account/password`
- Requires current password.
- New password must be at least 8 characters.
- Updates `users.passwordHash`.

Logout:

- Deletes current session hash.
- Clears session cookie.
- Redirects to `/login`.

## 11. Navigation And Layout

Top bar:

- Standard mode:
  - Left: hamburger menu
  - Center: Tidy Pleats Ops
  - Right: search icon
- Detail mode:
  - Left: back button
  - Center: detail title with ellipsis
  - Right: edit icon

Hamburger menu:

- Change Password
- Logout

Bottom nav order:

1. Dashboard
2. Customers
3. Plus action
4. Orders
5. Payments

Plus action opens:

- Add Customer
- New Order

## 12. Route Map

### Public

```text
/login
```

### Authenticated pages

```text
/
/dashboard
/customers
/customers/new
/customers/[id]
/customers/[id]/edit
/orders
/orders/new
/orders/[id]
/payments
/account/password
/menu5
```

`/` redirects into the authenticated app flow.

### API routes

```text
POST /api/customers/quick
POST /api/orders/photo-upload
GET  /customers/export
```

API behavior:

- All route handlers require authenticated user.
- Quick customer create is used from order creation when needed.
- Photo upload stores files in Vercel Blob and returns a public URL.
- Customer export generates `tidy-pleats-customers.xlsx`.

## 13. Customer Workflows

### Customer list

Route:

```text
/customers
```

Features:

- Total customer count tag next to title.
- Search by customer name behavior in `CustomerList`.
- Export button downloads Excel.
- Add button opens new customer form.

### Add customer

Route:

```text
/customers/new
```

Fields:

- Customer name
- Phone number
- Location
- Address
- Birthday date
- Size
- Referral type
- Referral source or existing referred-by customer
- Notes

Referral flow:

- User first chooses Social Media or Existing Customer.
- Existing Customer uses searchable selection, not free text.

### Customer profile

Route:

```text
/customers/[id]
```

Top bar:

- Back button
- Customer name
- Edit button

Tabs:

- Details
- Order History
- Payment

Details tab:

- Phone
- Location
- Address
- Birthday
- Size
- Referral type/source
- Notes
- Date added

Order History tab:

- All orders for the customer.
- Sorted recent to old.
- Shows order count.
- Each row opens order detail.

Payment tab:

- Total payment received from this customer.
- Payment history by order.

## 14. Order Workflows

### Orders list

Route:

```text
/orders
```

Filters:

- Search customer
- Bottom sheet filter:
  - Order type
  - Status
  - Tracking segment
  - Date range
- Quick chips:
  - All
  - Ready
  - Delivered
  - In Progress
  - Cancelled

Order card layout:

- Left:
  - Customer name
  - Saree count and delivery mode
  - Delivery date
- Right:
  - Status badge
  - Due countdown, for example:
    - Due Today
    - Due In 3 days
    - Overdue by 2 days

Order id is intentionally hidden from the list card body for easier scanning.

### New order

Route:

```text
/orders/new
```

Implemented in:

```text
src/components/order-form.tsx
src/lib/order-actions.ts
```

Flow:

1. Select/search existing customer.
2. Choose Single or Multi order.
3. Enter order date.
4. Enter delivery details.
5. Enter saree details.
6. Optional saree photo upload.
7. Enter price and discount.
8. Submit creates order and item status history.

Defaults:

- Pallu pleats: 5
- Center pleats: 5

Order creation:

- Validated with Zod.
- Customer must exist.
- Items are created with `BOOKED` status.
- Initial status history row is created.

### Order detail

Route:

```text
/orders/[id]
```

Features:

- Order summary
- Customer link
- Total/discount/paid/due summary
- Bulk status advance when all items share same status
- Item-level status update
- Status history
- WhatsApp update links
- Payment recording form
- Payment history

Status model:

- Status is per saree item, not per order.
- Order-level badge is derived from item statuses.

## 15. Status Workflow

Defined in:

```text
src/lib/order-status.ts
src/lib/status-actions.ts
```

Main sequence:

```text
BOOKED -> COLLECTED -> IN_PROGRESS -> QUALITY_CHECK -> READY -> DELIVERED
```

Exception:

```text
CANCELLED
```

Rules:

- Main action advances through sequence only.
- Manual dropdown can set any valid status, including CANCELLED.
- Every change writes `order_item_status_history`.

Dashboard logic:

- Overdue excludes READY, DELIVERED, CANCELLED.
- Due today excludes DELIVERED, CANCELLED.
- Ready counts READY items.
- Status overview shows active statuses only:
  - Booked
  - Collected
  - In Progress
  - Quality Check

## 16. Payments And Dues

### Record payment

Location:

```text
/orders/[id]
```

Implemented in:

```text
src/components/payment-form.tsx
src/lib/payment-actions.ts
```

Fields:

- Amount
- Method: Cash or UPI
- Payment date
- Notes

Behavior:

- Creates a `payments` row.
- Revalidates orders, order detail, payments, and dashboard.

### Dues ledger

Route:

```text
/payments
```

Features:

- Shows orders with positive balance due.
- Excludes fully cancelled orders.
- Running total.
- Sort by:
  - Largest due
  - Oldest order
- WhatsApp reminder link per due order.

Balance due calculation:

```text
sum(item.price) - discount - sum(payments.amount)
```

Helpers:

```text
src/lib/orders.ts
calculateOrderTotals()
calculateBalanceDue()
calculateDiscountAmount()
```

## 17. Dashboard

Route:

```text
/dashboard
```

Sections:

1. Needs Attention
   - Overdue
   - Due Today
   - Ready for Pickup/Delivery
2. Status Overview
   - Booked
   - Collected
   - In Progress
   - Quality Check
3. Financial
   - Pending Dues
   - Today's Collections
   - This Week's Revenue
4. Customers & Growth
   - New Customers This Week
   - Upcoming Birthdays
   - Top Referrer This Month

Mobile dashboard cards use two columns.

## 18. WhatsApp Links

Defined in:

```text
src/lib/order-status.ts
```

Helper:

```text
getWhatsAppHref()
```

Behavior:

- Normalizes 10-digit Indian phone numbers by prefixing `91`.
- Opens `wa.me` URL.
- No WhatsApp Business API is used.
- The owner manually reviews and sends messages.

Used for:

- Collected/Ready order updates.
- Per-item updates for multi-delivery orders.
- Payment reminders in dues ledger.

## 19. Photo Upload

Route:

```text
POST /api/orders/photo-upload
```

Storage:

- Vercel Blob

Behavior:

- Requires login.
- Requires `BLOB_READ_WRITE_TOKEN`.
- Accepts uploaded file from form data.
- Stores under `orders/{uuid}.jpg` or `.png`.
- Saves only the Blob URL in Postgres through order form data.

## 20. PWA

Files:

```text
public/manifest.webmanifest
public/sw.js
public/icons/icon.svg
public/icons/apple-touch-icon.svg
src/components/service-worker-registration.tsx
```

Behavior:

- App can be added to phone home screen.
- Service worker registration runs in production only.

## 21. Deployment

Deployment model:

- GitHub connected to Vercel.
- Push to `main` triggers production deployment.

Typical release flow:

```bash
npm run build
git add ...
git commit -m "Clear message"
git push
npx --yes vercel ls tidy-pleats-ops
npx --yes vercel inspect <deployment-url>
```

Migrations:

- Local development uses `npm run prisma:migrate`.
- Production uses `npx prisma migrate deploy` with production env loaded.
- Apply production migrations before deploying app code that requires new schema when possible.

## 22. Important Implementation Notes

- The generated Prisma client is configured to output into `src/generated/prisma`.
- `src/lib/prisma.ts` requires `DATABASE_URL` and creates the Prisma client with `@prisma/adapter-pg`.
- Most pages are dynamic and protected with `requireUser()`.
- Server actions return action state for client forms or redirect after success.
- Avoid free-text referred-by names. Use linked customer records.
- Avoid putting payment totals back on `orders`. Payments are transaction rows.
- Keep status per order item. Multi-saree orders can have different item statuses.
- Order delivery information lives on order items, not only on orders.
- For UI icons, continue using Lucide React.
- The UI is mobile-first; check narrow screens before pushing layout changes.

## 23. Known Risks And Gaps

- No automated test suite is currently present.
- No role-based authorization beyond requiring a logged-in user.
- Password policy is minimum 8 characters only.
- No delete/archive flows for customers or orders.
- No edit flow for orders yet.
- No payment edit/delete flow yet.
- No audit log for payment edits because payment edits do not exist.
- `AdvancePaymentMethod` enum name remains from earlier phase, but currently represents payment method CASH/UPI.
- `/menu5` is a placeholder.
- `/menu5` has no known business workflow and no bottom-nav entry. It is safe to delete unless a future Settings/Reports page is intentionally assigned to it.

## 24. Recommended Next Steps

Priority improvements:

1. Add order edit flow.
2. Add payment correction workflow with audit trail.
3. Add basic automated tests for calculations and server actions.
4. Add dashboard and list empty/loading states where needed.
5. Decide whether `AdvancePaymentMethod` should be renamed to `PaymentMethod` in a future migration.
6. Add admin-only guard if owner/spouse permissions diverge.
7. Add richer customer search across phone/location in global search.

## 25. Handoff Checklist

Before making changes:

1. Pull latest `main`.
2. Run `npm install` if dependencies changed.
3. Confirm `.env` has `DATABASE_URL`.
4. Run `npm run prisma:generate`.
5. Run `npm run build` after changes.
6. If schema changed, create and apply Prisma migration.
7. Push to GitHub and verify Vercel production deployment.

When debugging production:

1. Confirm latest Vercel deployment is Ready.
2. Check Vercel env vars.
3. Check Prisma migration status against production DB.
4. Verify route is authenticated and session cookie exists.
5. Inspect server action console logs for caught failures.
