# Supabase Setup Guide

## Quick Steps to Get Your Supabase Credentials

### Step 1: Create or Access Your Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project" (if you don't have one) or select an existing project

### Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the left sidebar
2. Select **API** from the settings menu
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

### Step 3: Update Your .env File

1. Open the `.env` file in the `booqup-p` directory
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important**: 
- Remove any quotes around the values
- Don't include spaces before or after the `=` sign
- Make sure the URL starts with `https://`
- The anon key is a very long string

### Step 4: Set Up Your Database

If this is a new Supabase project, you need to run the database migration:

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20251113130150_create_booqup_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### Step 5: Restart Your Development Server

After updating the `.env` file:

1. Stop your current dev server (if running) with `Ctrl+C`
2. Restart it with:
   ```bash
   npm run dev
   ```

## Example .env File

Here's what your `.env` file should look like (with actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example-signature-key-here

# Google Maps API (Optional - for map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Troubleshooting

### Error: "Invalid Supabase URL"
- Make sure the URL starts with `https://`
- Check that there are no extra spaces or quotes
- Verify you copied the entire URL from Supabase dashboard

### Error: "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
- Ensure your URL is complete (should end with `.supabase.co`)
- Check for typos in the URL
- Make sure you didn't include any placeholder text

### Still Having Issues?
1. Double-check your credentials in Supabase Dashboard > Settings > API
2. Make sure you saved the `.env` file
3. Restart your dev server completely
4. Clear your browser cache

