# tidy-pleats-ops

Internal operations app for Tidy Pleats, a home-based saree pre-pleating service in Virudhunagar, Tamil Nadu.

The app currently contains Customer Contact Management and Order Management:

- Credential login for two seeded internal users.
- Add customer records with normalized referral tracking.
- Searchable customer list by name, phone number, or location.
- Customer profile view with notes and date added.
- Create single or multi-saree orders linked to existing customers.
- Track needed-by date, pickup/drop, saree pleat counts, damage notes, photos, price, discounts, advance paid, and balance due.
- Search and filter the order list, then open full order details.
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

Saree photos are uploaded to Vercel Blob through `BLOB_READ_WRITE_TOKEN`; only the Blob URL is saved in Postgres.

## Deployment

The intended deployment model is GitHub connected to Vercel, with automatic deployments on push. Set the same environment variables in Vercel before running migrations and using production.

Keep these names aligned:

- Local project folder: `tidy-pleats-ops`
- GitHub repository: `tidy-pleats-ops`
- Vercel project: `tidy-pleats-ops`

Do not rename the Vercel project after connecting it to the GitHub repository.
