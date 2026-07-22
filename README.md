# tidy-pleats-ops

Internal operations app for Tidy Pleats, a home-based saree pre-pleating service in Virudhunagar, Tamil Nadu.

For full project handoff details, see [docs/KT.md](docs/KT.md).

The app currently contains Customer Contact Management and Order Management:

- Credential login for two seeded internal users.
- Add customer records with normalized referral tracking.
- Searchable customer list by name, phone number, or location.
- Customer profile view with notes and date added.
- Create single or multi-saree orders linked to existing customers.
- Track needed-by date, pickup/drop, saree pleat counts, damage notes, photos, price, discounts, payments, and balance due.
- Search and filter the order list, then open full order details.
- Track per-saree item status from Booked through Delivered, with status history and WhatsApp update links for Collected/Ready milestones.
- Record order payments with method, date, notes, and payment history.
- Dues ledger for unpaid balances with WhatsApp payment reminder links.
- Dashboard for daily operations: needs attention, active status overview, financial totals, and customer growth.
- Mobile-first PWA setup with manifest, icons, and service worker.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- Postgres
- Vercel hosting

## Environment Variables

Copy `.env.example` to `.env` for local development.

```bash
DATABASE_URL="postgresql://karthik@localhost:5432/tidy_pleats_ops?schema=public"
SESSION_COOKIE_NAME="tidy_pleats_ops_session"
BLOB_READ_WRITE_TOKEN="vercel-blob-read-write-token"
```

Optional seed overrides:

```bash
SEED_OWNER_PASSWORD="replace-with-a-strong-password"
SEED_SPOUSE_PASSWORD="replace-with-a-strong-password"
```

No real secrets should be committed.

## Local Development

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Then open `http://localhost:3000`.

Default seeded credentials, if seed override variables are not set:

- Username: `owner`, password: `ChangeMeOwner123!`
- Username: `spouse`, password: `ChangeMeSpouse123!`

Change these before using the app with real data.

## Prisma

Schema: `prisma/schema.prisma`

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npx prisma studio
```

The `Customer.referredByCustomerId` field is a self-referencing foreign key instead of free text. This prevents duplicate or typo-filled referral names and preserves accurate referral counts for later phases.

Orders use a single `orders` + `order_items` schema for both Single and Multi order flows. A Single order is one order item with `deliveryType` set to `ONE_TIME`, which keeps reports and later status workflows consistent. Needed-by, pickup/drop, and address are always stored on each `order_items` row; when the UI asks for common delivery details once, those values are copied into every item.

Payments are stored as transaction rows in `payments` instead of editable amount fields on `orders`. Balance due is always calculated from item prices minus discount minus the sum of recorded payments, which preserves payment history and supports partial payments. The migration `20260719162000_replace_advance_with_payments` backfills any legacy advance amount into `payments` before dropping the old order columns.

Saree photos are uploaded to Vercel Blob through `BLOB_READ_WRITE_TOKEN`; only the Blob URL is saved in Postgres.

Order item status follows this main sequence: Booked -> Collected -> In Progress -> Quality Check -> Ready -> Delivered. Cancelled is an exception status available from the manual status dropdown. Status is stored per item, not per order, and each change writes an `order_item_status_history` row with the user who made the change. Order-level status badges are derived from the current item statuses.

WhatsApp updates use plain `wa.me` links. They are intentionally shown only at Collected and Ready: one order-level button for one-time delivery once all items reach that milestone, or per-item buttons for multiple delivery.

## Deployment

The intended deployment model is GitHub connected to Vercel, with automatic deployments on push. Set the same environment variables in Vercel before running migrations and using production.

Keep these names aligned:

- Local project folder: `tidy-pleats-ops`
- GitHub repository: `tidy-pleats-ops`
- Vercel project: `tidy-pleats-ops`

Do not rename the Vercel project after connecting it to the GitHub repository.
