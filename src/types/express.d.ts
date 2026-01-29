import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      db?: NodePgDatabase<any>;
      user?: User | null;
      dbUser?: any; // To be refined with schema type if needed
      googleAccessToken?: string;
    }
  }
}
