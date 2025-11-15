# Quick Start Guide - Fix the Supabase Error

## You're Getting This Error Because:
Your `.env` file has placeholder values instead of real Supabase credentials.

## What You Need to Do:

### ✅ Step 1: Get Supabase Credentials (5 minutes)

1. **Go to Supabase**: Open https://supabase.com in your browser
2. **Sign Up/Login**: Create a free account or login if you have one
3. **Create New Project**:
   - Click "New Project"
   - Enter a project name (e.g., "booqup")
   - Enter a database password (save this somewhere!)
   - Choose a region close to you
   - Click "Create new project"
   - Wait 1-2 minutes for setup to complete

4. **Get Your Credentials**:
   - In your project dashboard, click the ⚙️ **Settings** icon (bottom left)
   - Click **API** in the settings menu
   - You'll see two important values:
     - **Project URL**: Copy this (looks like `https://xxxxxxxxxxxxx.supabase.co`)
     - **anon public**: Copy this key (long string starting with `eyJ...`)

### ✅ Step 2: Update Your .env File

1. **Open the .env file**:
   - Location: `booqup-p\.env`
   - Open it in any text editor (Notepad, VS Code, etc.)

2. **Replace the placeholder values**:
   
   **BEFORE** (what you have now):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   
   **AFTER** (what you need):
   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   ⚠️ **Important**: 
   - Replace with YOUR actual values from Supabase
   - NO quotes around values
   - NO spaces before/after the `=` sign
   - The URL must start with `https://`

3. **Save the file**

### ✅ Step 3: Set Up Database

1. **Go to SQL Editor** in Supabase dashboard
2. **Click "New Query"**
3. **Open** the file: `booqup-p\supabase\migrations\20251113130150_create_booqup_schema.sql`
4. **Copy ALL the content** from that file
5. **Paste it** into the SQL Editor
6. **Click "Run"** to execute the migration

### ✅ Step 4: Restart Your Dev Server

1. **Stop** your current dev server (press `Ctrl+C` in the terminal)
2. **Start it again**:
   ```bash
   cd booqup-p
   npm run dev
   ```

## That's It! 🎉

Your app should now work without errors.

## Need Help?

- Check the detailed guide: `SUPABASE_SETUP.md`
- Supabase Documentation: https://supabase.com/docs
- Make sure you copied the ENTIRE anon key (it's very long!)

