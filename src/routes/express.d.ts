import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DBUser } from "./db";

declare global {
  namespace Express {
    interface Request {
      user?: SupabaseUser | null;
      dbUser?: DBUser | null;
      googleAccessToken?: string;
    }
  }
}

export {};
