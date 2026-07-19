import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required to use the database.");
    }

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  return prisma;
}
