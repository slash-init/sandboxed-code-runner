import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password@host")) {
      throw new Error("DATABASE_URL is not configured. Please set it in your .env file.");
    }
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrisma;
