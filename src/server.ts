// import "./env"
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// console.log("SERVER LOADED — CLIENT:", process.env.GOOGLE_CLIENT_ID);

import apiRoutes from "./routes/api";
import syncRoutes from "./routes/sync";
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://db-synchro-fronted.vercel.app",
            "https://dbsynchro.sriyush.fun",
            process.env.FRONTEND_URL || ""
        ].filter(Boolean) as string[],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "provider-token"]
    })
);
// console.log("🔵 googleStrategy loaded — CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
app.use(express.json());


// app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/sync", syncRoutes);

app.get("/", (_req, res) => res.send("dbsynchro backend is up"));

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
