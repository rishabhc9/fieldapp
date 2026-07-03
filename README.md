# Field Visit Log — Setup & Deploy Guide

A Next.js web app for logging field visits, backed by Supabase (free tier).
Deploys to Vercel (free tier). No server to maintain.

---

## What you'll need (all free)

| Service | Purpose | Sign-up |
|---------|---------|---------|
| [Supabase](https://supabase.com) | PostgreSQL database + file storage | supabase.com |
| [Vercel](https://vercel.com) | Hosting | vercel.com |
| [GitHub](https://github.com) | Connects Vercel to your code | github.com |

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **Start for free** → sign up.
2. Click **New project** → give it any name (e.g. `fieldapp`) → choose a strong
   DB password → pick the region closest to India (e.g. `ap-south-1 Mumbai`) → **Create project**.
3. Wait ~2 min for it to spin up.

### 1a — Run the database schema

1. In your Supabase project sidebar, click **SQL Editor**.
2. Paste the entire contents of `supabase/schema.sql` (in this repo).
3. Click **Run**. You should see "Success. No rows returned."

### 1b — Create the photo storage bucket

1. Sidebar → **Storage** → **New bucket**.
2. Name it exactly: `visit-photos` (lowercase, hyphen).
3. Leave it **Private** (the app signs URLs server-side).
4. Click **Save**.

### 1c — Copy your API keys

1. Sidebar → **Project Settings** → **API**.
2. Note these three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click reveal) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Seed the doctor names

You need Node.js installed locally for this one-time step.

```bash
# In the project root:
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

npm install
npm run seed:doctors -- --file="path/to/your-doctors.xlsx" --column="name"
```

Replace `name` with the actual column header in your sheet if it differs.
The script will print progress and confirm how many rows were inserted.

---

## Step 3 — Push code to GitHub

```bash
git init
git add .
git commit -m "init"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/fieldapp.git
git push -u origin main
```

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import** your
   GitHub repo.
2. Framework preset will auto-detect **Next.js**. Leave defaults.
3. Click **Environment Variables** and add these six:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key (secret) |
| `ADMIN_PASSWORD` | a strong password of your choice |
| `ADMIN_SESSION_SECRET` | a random 32+ character string (run `openssl rand -base64 32` in your terminal to generate one) |

4. Click **Deploy**. In ~60 seconds your app is live.

---

## URLs after deploy

| URL | Who uses it |
|-----|-------------|
| `https://your-app.vercel.app/` | Field staff — submit a visit |
| `https://your-app.vercel.app/admin` | Admin — view all submissions |
| `https://your-app.vercel.app/admin/login` | Admin login page |

---

## Local development

```bash
cp .env.example .env.local  # fill in all values
npm install
npm run dev
# Open http://localhost:3000
```

---

## Adding more doctor names later

Just re-run the seed script with the updated Excel file:

```bash
npm run seed:doctors -- --file="updated-doctors.xlsx"
```

It clears the old data and re-inserts from scratch. Takes about 30 seconds for 14k rows.

---

## Supabase free tier limits

| Resource | Free allowance |
|----------|---------------|
| Database rows | 500 MB (≈ millions of rows) |
| Storage | 1 GB |
| API calls | 50,000 / month |
| Bandwidth | 5 GB / month |

These limits are very generous for a field team form.

---

## Security notes

- The admin password is stored only as an env var — never in the code or database.
- Admin sessions are signed HMAC cookies (12-hour expiry). There is no "remember me."
- The `SUPABASE_SERVICE_ROLE_KEY` is only ever used in server-side API routes.
  It is never sent to the browser.
- Row Level Security (RLS) is enabled on all tables. No table can be accessed
  directly via the Supabase client-side SDK.
- Photo uploads are stored privately; the admin page generates short-lived
  signed URLs (1-hour expiry) for viewing.
