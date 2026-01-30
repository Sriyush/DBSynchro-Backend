"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
class ConnectionManager {
    constructor() {
        this.pools = new Map();
        this.dbs = new Map();
    }
    async getConnection(userId, connectionString) {
        // If we already have a connection for this user, return it
        if (this.dbs.has(userId)) {
            return this.dbs.get(userId);
        }
        // Otherwise, create a new pool
        console.log(`🔌 Creating new DB connection for user ${userId}`);
        const pool = new pg_1.Pool({ connectionString });
        // Validate connection
        try {
            await pool.query('SELECT 1');
        }
        catch (e) {
            console.error(`❌ Failed to connect to custom DB for user ${userId}:`, e.message);
            throw new Error("Invalid connection string");
        }
        const db = (0, node_postgres_1.drizzle)(pool);
        this.pools.set(userId, pool);
        this.dbs.set(userId, db);
        return db;
    }
    async closeConnection(userId) {
        if (this.pools.has(userId)) {
            await this.pools.get(userId).end();
            this.pools.delete(userId);
            this.dbs.delete(userId);
            console.log(`🔌 Closed DB connection for user ${userId}`);
        }
    }
}
exports.connectionManager = new ConnectionManager();
