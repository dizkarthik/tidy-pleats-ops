import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed tidy-pleats-ops.");
}

const client = new pg.Client({ connectionString: databaseUrl });

const users = [
  {
    name: "Tidy Pleats Owner",
    username: "owner",
    role: "OWNER",
    password: process.env.SEED_OWNER_PASSWORD ?? "ChangeMeOwner123!",
  },
  {
    name: "Tidy Pleats Spouse",
    username: "spouse",
    role: "SPOUSE",
    password: process.env.SEED_SPOUSE_PASSWORD ?? "ChangeMeSpouse123!",
  },
];

await client.connect();

for (const user of users) {
  const passwordHash = await bcrypt.hash(user.password, 12);

  await client.query(
    `
      INSERT INTO users (id, name, username, "passwordHash", role, "createdAt")
      VALUES ($1, $2, $3, $4, $5::"UserRole", CURRENT_TIMESTAMP)
      ON CONFLICT (username)
      DO UPDATE SET
        name = EXCLUDED.name,
        "passwordHash" = EXCLUDED."passwordHash",
        role = EXCLUDED.role
    `,
    [randomUUID(), user.name, user.username, passwordHash, user.role],
  );
}

await client.end();
