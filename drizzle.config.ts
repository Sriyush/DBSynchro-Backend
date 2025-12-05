import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // driver: "pglite",
  dbCredentials: {
    //@ts-ignore
    url: process.env.DATABASE_URL! as string,
  },
});
