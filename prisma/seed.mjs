import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed tidy-pleats-ops.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

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

for (const user of users) {
  const passwordHash = await bcrypt.hash(user.password, 12);

  await prisma.user.upsert({
    where: { username: user.username },
    update: {
      name: user.name,
      role: user.role,
      passwordHash,
    },
    create: {
      name: user.name,
      username: user.username,
      role: user.role,
      passwordHash,
    },
  });
}

await prisma.$disconnect();
