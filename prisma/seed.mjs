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

// Re-running this script against a database that already has real users (e.g.
// production) must not silently reset their passwords back to the hardcoded
// defaults above. Password resets on conflict require an explicit opt-in.
const allowPasswordReset = process.env.SEED_ALLOW_PASSWORD_RESET === "true";

for (const user of users) {
  const passwordHash = await bcrypt.hash(user.password, 12);

  const { rows } = await client.query(
    `
      INSERT INTO users (id, name, username, "passwordHash", role, "createdAt")
      VALUES ($1, $2, $3, $4, $5::"UserRole", CURRENT_TIMESTAMP)
      ON CONFLICT (username)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "passwordHash" = CASE
          WHEN $6 THEN EXCLUDED."passwordHash"
          ELSE users."passwordHash"
        END
      RETURNING (xmax = 0) AS inserted
    `,
    [randomUUID(), user.name, user.username, passwordHash, user.role, allowPasswordReset],
  );

  if (!rows[0].inserted && !allowPasswordReset) {
    console.log(`${user.username}: existing password left unchanged (set SEED_ALLOW_PASSWORD_RESET=true to reset it).`);
  }
}

await client.end();
