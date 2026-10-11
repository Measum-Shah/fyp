import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please add it to your .env file.\n" +
    "   Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
  );
}

import { Pool } from 'pg';

// Use pg adapter for direct PostgreSQL connection (no ORM overhead)
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["error"],
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log(" PostgreSQL connected via Prisma (pg adapter)");
    console.log(` Database: ${connectionString.split("@")[1]}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    console.error(
      "   Check your DATABASE_URL in .env and make sure PostgreSQL is running."
    );
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log("PostgreSQL disconnected");
};