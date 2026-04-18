import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TAGS = [
  "Web App", "Mobile App", "AI / ML", "Dev Tool", "SaaS",
  "Open Source", "API", "CLI", "Design", "Analytics",
  "Productivity", "E-commerce", "Education", "Game", "Finance",
];

for (const name of TAGS) {
  await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
}

console.log("Tags seeded:", TAGS.length);
await prisma.$disconnect();
