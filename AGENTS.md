# tidy-pleats-ops Agent Notes

This is an internal-only Next.js App Router project for Tidy Pleats customer, order, and payment management.

- Customers, Orders, and Payments are implemented and in production. See `docs/KT.md` for full scope.
- Do not add Inventory or Offers until those phases are requested.
- Prisma 7 generates the client into `src/generated/prisma`; this folder is ignored and recreated by `npm install` or `npm run prisma:generate`.
- The customer referred-by field must stay a foreign key to `customers.id`, not free text.
- Read `README.md` before changing setup, env vars, migrations, or deployment behavior.
