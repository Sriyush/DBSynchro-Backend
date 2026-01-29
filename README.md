# 🦇 DBSynchro Backend

**Your Database & Google Sheets, Finally in Sync.**

DBSynchro is a powerful backend service designed to bridge the gap between static databases and dynamic spreadsheets. It allows users to connect their own Postgres database and sync data seamlessly with Google Sheets in real-time.

---

## 🚀 Features

*   **Custom Database Support:** Users can bring their own Postgres connection string. We manage the connection pool dynamically.
*   **Two-Way Sync (Partial):**
    *   **Sheet -> DB:** Create tables directly from Google Sheets.
    *   **DB -> Sheet:** Edits made in the dashboard (Rows/Columns) are pushed back to the Sheet immediately.
*   **Secure Auth:** Powered by Supabase Auth + Google OAuth (hybrid token system).
*   **Smart Matching:** "Loose Match" logic ensures updates find the right row even if data drifts slightly.

## 🛠️ Tech Stack

*   **Runtime:** Node.js + Express
*   **Language:** TypeScript
*   **Database:** Postgres
*   **ORM:** Drizzle ORM (The best ORM, period).
*   **Authentication:** Supabase + Google OAuth2.

## ⚡ Getting Started

1.  **Clone & Install**
    ```bash
    git clone https://github.com/Sriyush/DBSynchro-Backend.git
    cd DBSynchro-Backend
    pnpm install
    ```

2.  **Environment Variables**
    Create a `.env` file:
    ```env
    DATABASE_URL=postgresql://...
    SUPABASE_URL=https://...
    SUPABASE_SERVICE_ROLE_KEY=...
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    FRONTEND_URL=http://localhost:5173
    ```

3.  **Run Migrations**
    ```bash
    pnpm migrate:push
    ```

4.  **Start Dev Server**
    ```bash
    pnpm dev
    ```

## 🔮 Future Roadmap

*   [ ] **Encryption:** Encrypt user connection strings at rest (AES-256).
*   [ ] **Background Sync:** Cron jobs to poll sheets for changes when offline.
*   [ ] **Type Safety:** Auto-detect column types (Number/Date) instead of default `text`.

---

*Built with 🖤 by Sriyush & Clanker.*
