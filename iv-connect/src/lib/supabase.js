import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
// Get them from: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─────────────────────────────────────────────
// SUPABASE TABLE SETUP (run these SQL commands
// in your Supabase SQL editor to create tables)
// ─────────────────────────────────────────────
//
// 1. APP CONFIG (stage controller)
// CREATE TABLE app_config (
//   key TEXT PRIMARY KEY,
//   value TEXT,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
// INSERT INTO app_config (key, value) VALUES ('active_stage', '1');
// INSERT INTO app_config (key, value) VALUES ('destination', 'TBD');
// INSERT INTO app_config (key, value) VALUES ('trip_fee', '1200');
// INSERT INTO app_config (key, value) VALUES ('upi_id', 'yourname@upi');
// INSERT INTO app_config (key, value) VALUES ('upi_qr_url', '');
//
// 2. STUDENTS MASTER (uploaded by admin via CSV)
// CREATE TABLE students_master (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT UNIQUE NOT NULL,
//   enrollment_number TEXT,
//   full_name TEXT NOT NULL,
//   section TEXT NOT NULL CHECK (section IN ('A','B','C','D','E')),
//   date_of_birth DATE NOT NULL,
//   bus_number INTEGER,
//   room_number TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// 3. STAFF ACCOUNTS
// CREATE TABLE staff_accounts (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   name TEXT NOT NULL,
//   email TEXT UNIQUE NOT NULL,
//   password_hash TEXT NOT NULL,
//   role TEXT NOT NULL CHECK (role IN ('hod','adviser','bus_coordinator')),
//   assigned_section TEXT CHECK (assigned_section IN ('A','B','C','D','E')),
//   assigned_bus INTEGER,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// 4. STAGE 1 — BRAINSTORM
// CREATE TABLE stage1_responses (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT UNIQUE NOT NULL,
//   section TEXT NOT NULL,
//   destination_vote TEXT NOT NULL,
//   trip_type TEXT,
//   duration TEXT,
//   budget_range TEXT,
//   suggestion TEXT,
//   submitted_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// 5. STAGE 2 — REGISTRATION & ORDERS
// CREATE TABLE stage2_registrations (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT UNIQUE NOT NULL,
//   section TEXT NOT NULL,
//   attendance TEXT NOT NULL CHECK (attendance IN ('coming','not_coming','maybe')),
//   food_preference TEXT NOT NULL CHECK (food_preference IN ('veg','non_veg')),
//   emergency_contact TEXT NOT NULL,
//   tshirt_size TEXT NOT NULL CHECK (tshirt_size IN ('S','M','L','XL','XXL')),
//   snack_bag BOOLEAN DEFAULT TRUE,
//   photo_album BOOLEAN DEFAULT FALSE,
//   id_lanyard BOOLEAN DEFAULT FALSE,
//   kerala_souvenir BOOLEAN DEFAULT FALSE,
//   payment_mode TEXT CHECK (payment_mode IN ('upi','cash')),
//   payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','verified','rejected')),
//   payment_proof_url TEXT,
//   total_amount INTEGER DEFAULT 0,
//   submitted_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// 6. STAGE 3 — TRIP PLAN (admin fills this)
// CREATE TABLE trip_itinerary (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   day_number INTEGER NOT NULL,
//   time_slot TEXT NOT NULL,
//   activity TEXT NOT NULL,
//   location TEXT,
//   notes TEXT
// );
//
// 7. STAGE 4 — LIVE HUB
// CREATE TABLE announcements (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   message TEXT NOT NULL,
//   priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal','urgent','sos')),
//   created_by TEXT NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE TABLE live_locations (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT UNIQUE NOT NULL,
//   section TEXT NOT NULL,
//   bus_number INTEGER,
//   latitude DECIMAL(10,8),
//   longitude DECIMAL(11,8),
//   is_sharing BOOLEAN DEFAULT FALSE,
//   sos_active BOOLEAN DEFAULT FALSE,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE TABLE quiz_questions (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   question TEXT NOT NULL,
//   options JSONB NOT NULL,
//   correct_answer INTEGER NOT NULL,
//   is_active BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE TABLE quiz_answers (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   question_id UUID REFERENCES quiz_questions(id),
//   register_number TEXT NOT NULL,
//   answer INTEGER NOT NULL,
//   is_correct BOOLEAN,
//   answered_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE TABLE trip_photos (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT NOT NULL,
//   section TEXT NOT NULL,
//   photo_url TEXT NOT NULL,
//   caption TEXT,
//   likes INTEGER DEFAULT 0,
//   uploaded_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// 8. STAGE 5 — FEEDBACK
// CREATE TABLE stage5_feedback (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   register_number TEXT UNIQUE NOT NULL,
//   section TEXT NOT NULL,
//   overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
//   industry_rating INTEGER CHECK (industry_rating BETWEEN 1 AND 5),
//   food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
//   travel_rating INTEGER CHECK (travel_rating BETWEEN 1 AND 5),
//   organizer_rating INTEGER CHECK (organizer_rating BETWEEN 1 AND 5),
//   best_moment TEXT,
//   suggestions TEXT,
//   would_recommend BOOLEAN,
//   submitted_at TIMESTAMPTZ DEFAULT NOW()
// );
