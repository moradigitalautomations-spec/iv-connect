# IV Connect — Setup Guide
## Sri Manakula Vinayagar Engineering College · CSE Department

---

## 🚀 Quick Start (5 steps)

### Step 1 — Install dependencies
```bash
cd iv-connect
npm install
```

### Step 2 — Create Supabase project
1. Go to https://supabase.com and sign up (free)
2. Click "New Project" → name it `iv-connect`
3. Copy your **Project URL** and **anon public key** from Settings → API

### Step 3 — Setup environment
```bash
cp .env.example .env
# Edit .env and paste your Supabase URL and anon key
```

### Step 4 — Create database tables
1. In Supabase → go to SQL Editor
2. Copy ALL the SQL comments from `src/lib/supabase.js`
3. Remove the `//` from each line and run in SQL editor
4. Also run this to set admin password:
```sql
INSERT INTO app_config (key, value) VALUES ('admin_admin', 'your-password-here');
```

### Step 5 — Run the app
```bash
npm run dev
# Opens at http://localhost:5173
```

---

## 📱 How to use

| Role | URL | Login |
|------|-----|-------|
| Students | `/` | Register Number + Date of Birth |
| Admin (you) | `/admin/login` | Username: `admin` · Password: set in Step 4 |
| Staff | `/staff/login` | Email + Password (set in Admin → Staff tab) |

---

## 🔄 Stage switching
Go to Admin Dashboard → click the stage button at the top to switch stages.
Students see the new stage **instantly** — no refresh needed.

| Stage | When to activate |
|-------|-----------------|
| 1 — Brainstorm | Right now — share link with students |
| 2 — Registration | After HOD confirms destination |
| 3 — Trip Plan | After you fill the itinerary & allocations |
| 4 — Live Hub | On trip day morning |
| 5 — Feedback | Evening of Day 3 / after return |

---

## 📤 Deploy to Vercel (free)
```bash
npm install -g vercel
vercel
# Follow prompts — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as env vars
```
Share the Vercel URL with all 250 students via WhatsApp. Done!

---

## 📊 Supabase Storage Setup
For payment proof uploads and photo drops:
1. Supabase → Storage → Create bucket named `iv-connect`
2. Set bucket to Public
3. Done — uploads work automatically

---

## 🏗️ Project Structure
```
src/
├── context/AppContext.jsx     ← Global state, auth, stage switching
├── lib/supabase.js            ← Supabase client + SQL schema
├── pages/
│   ├── student/
│   │   ├── StudentLogin.jsx
│   │   ├── StudentDashboard.jsx
│   │   └── stages/
│   │       ├── Stage1Brainstorm.jsx
│   │       ├── Stage2Registration.jsx
│   │       ├── Stage3TripPlan.jsx
│   │       ├── Stage4LiveHub.jsx
│   │       └── Stage5Feedback.jsx
│   ├── admin/
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   └── staff/
│       ├── StaffLogin.jsx
│       └── StaffDashboard.jsx
└── App.jsx                    ← Routing + role guards
```

---

## 💰 Pre-order items (edit prices in Stage2Registration.jsx)
- Group T-shirt → mandatory (bundled in trip fee)
- Snack & drinks bag → mandatory (bundled)
- Trip photo album → optional ₹60
- ID lanyard → optional ₹40
- Kerala souvenir pack → optional ₹120

---

Built with React + Vite + Supabase + Tailwind CSS
