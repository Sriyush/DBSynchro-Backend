import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

class ConnectionManager {
  private pools: Map<string, Pool> = new Map();
  private dbs: Map<string, NodePgDatabase<any>> = new Map();

  constructor() {}

  async getConnection(userId: string, connectionString: string): Promise<NodePgDatabase<any>> {
    // If we already have a connection for this user, return it
    if (this.dbs.has(userId)) {
      return this.dbs.get(userId)!;
    }

    // Otherwise, create a new pool
    console.log(`🔌 Creating new DB connection for user ${userId}`);
    const pool = new Pool({ connectionString });
    
    // Validate connection
    try {
        await pool.query('SELECT 1');
    } catch (e: any) {
        console.error(`❌ Failed to connect to custom DB for user ${userId}:`, e.message);
        throw new Error("Invalid connection string");
    }

    const db = drizzle(pool);

    this.pools.set(userId, pool);
    this.dbs.set(userId, db);
    return db;
  }

  async closeConnection(userId: string) {
    if (this.pools.has(userId)) {
        await this.pools.get(userId)!.end();
        this.pools.delete(userId);
        this.dbs.delete(userId);
        console.log(`🔌 Closed DB connection for user ${userId}`);
    }
  }
}

export const connectionManager = new ConnectionManager();
