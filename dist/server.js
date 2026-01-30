"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import "./env"
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// console.log("SERVER LOADED — CLIENT:", process.env.GOOGLE_CLIENT_ID);
const api_1 = __importDefault(require("./routes/api"));
const sync_1 = __importDefault(require("./routes/sync"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4000;
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://db-synchro-fronted.vercel.app",
        process.env.FRONTEND_URL || ""
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "provider-token"]
}));
// console.log("🔵 googleStrategy loaded — CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
app.use(express_1.default.json());
// app.use("/auth", authRoutes);
app.use("/api", api_1.default);
app.use("/sync", sync_1.default);
app.get("/", (_req, res) => res.send("dbsynchro backend is up"));
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
