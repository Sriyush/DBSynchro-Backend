import { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { db } from "../lib/db";
import { users } from "../models/schema";
import { eq } from "drizzle-orm";

export async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  const providerToken = req.headers["provider-token"] as string;
  if (!token) return res.status(401).json({ error: "No token provided" });
  if (!providerToken)
    return res.status(401).json({ error: "Missing Google provider token" });
  console.log("", providerToken);
  // 1. Verify JWT via Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const supabaseUser = data.user;
  req.user = supabaseUser;
  req.googleAccessToken = providerToken;
  // console.log("Google Access Token in auth middleware:", req.googleAccessToken);
  const tokenInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${req.googleAccessToken}`)
  .then(r => r.json());

console.log("Token Scopes:", tokenInfo.scope);
  const fullName = supabaseUser.user_metadata.full_name || null;
  const avatar = supabaseUser.user_metadata.avatar_url || null;

  
  // 2. Check if user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, supabaseUser.id));

  if (existing.length === 0) {
    // 3. Create new DB user
    const [created] = await db
      .insert(users)
      .values({
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        name: fullName,
        avatar: avatar,
      })
      .returning();

    req.dbUser = created;
  } else {
    const dbUser = existing[0];
    req.dbUser = dbUser;

    // 4. Sync name/avatar if changed
    if (
      dbUser.email !== supabaseUser.email ||
      dbUser.name !== fullName ||
      dbUser.avatar !== avatar
    ) {
      await db
        .update(users)
        .set({
          email: supabaseUser.email!,
          name: fullName,
          avatar: avatar,
        })
        .where(eq(users.id, dbUser.id));
    }
  }

  next();
}
