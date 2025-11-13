/*
  # Booqup Database Schema - Complete Booking System
  
  ## Overview
  This migration creates a comprehensive booking system for Booqup, supporting multiple business types
  (restaurants, salons, clinics, etc.) with appointment scheduling, real-time availability, and reviews.
  
  ## Tables Created
  
  ### 1. profiles
  Extended user profile information linked to Supabase auth.users
  - id (uuid, FK to auth.users)
  - full_name (text)
  - phone (text)
  - avatar_url (text)
  - user_type (enum: 'customer', 'shop_owner', 'admin')
  - created_at, updated_at (timestamptz)
  
  ### 2. categories
  Business categories (Restaurant, Salon, Clinic, etc.)
  - id (uuid, PK)
  - name (text, unique)
  - description (text)
  - icon (text)
  - created_at (timestamptz)
  
  ### 3. shops
  Business/shop information with location data
  - id (uuid, PK)
  - owner_id (uuid, FK to profiles)
  - category_id (uuid, FK to categories)
  - name, description (text)
  - address (text)
  - latitude, longitude (numeric) - for Google Maps integration
  - phone, email (text)
  - opening_time, closing_time (time)
  - average_rating (numeric)
  - total_reviews (integer)
  - status (enum: 'pending', 'approved', 'rejected', 'inactive')
  - images (text array)
  - created_at, updated_at (timestamptz)
  
  ### 4. services
  Services offered by each shop with pricing
  - id (uuid, PK)
  - shop_id (uuid, FK to shops)
  - name, description (text)
  - duration_minutes (integer)
  - price (numeric)
  - is_active (boolean)
  - created_at, updated_at (timestamptz)
  
  ### 5. bookings
  Appointment bookings with status tracking
  - id (uuid, PK)
  - user_id (uuid, FK to profiles)
  - shop_id (uuid, FK to shops)
  - service_id (uuid, FK to services)
  - booking_date (date)
  - start_time, end_time (time)
  - status (enum: 'confirmed', 'cancelled', 'completed', 'no_show')
  - notes (text)
  - cancellation_reason (text)
  - created_at, updated_at (timestamptz)
  
  ### 6. reviews
  Customer reviews and ratings for shops
  - id (uuid, PK)
  - user_id (uuid, FK to profiles)
  - shop_id (uuid, FK to shops)
  - booking_id (uuid, FK to bookings)
  - rating (integer, 1-5)
  - comment (text)
  - created_at, updated_at (timestamptz)
  
  ### 7. shop_availability
  Shop working hours and special schedules
  - id (uuid, PK)
  - shop_id (uuid, FK to shops)
  - day_of_week (integer, 0-6)
  - is_open (boolean)
  - opening_time, closing_time (time)
  - created_at, updated_at (timestamptz)
  
  ## Security
  Row Level Security (RLS) enabled on all tables with appropriate policies for:
  - Customers: can view approved shops, create bookings, submit reviews
  - Shop Owners: can manage their own shops, services, and view their bookings
  - Admins: can manage all data and approve/reject shops
  
  ## Indexes
  Created indexes for:
  - Shop location queries (latitude, longitude)
  - Booking date and time lookups
  - User and shop relationships
  - Category filtering
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('customer', 'shop_owner', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shop_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  user_type user_type DEFAULT 'customer' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- 3. SHOPS TABLE
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  phone text NOT NULL,
  email text,
  opening_time time,
  closing_time time,
  average_rating numeric(2, 1) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  status shop_status DEFAULT 'pending' NOT NULL,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved shops"
  ON shops FOR SELECT
  TO authenticated
  USING (status = 'approved' OR owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Shop owners can create shops"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'shop_owner'
    )
  );

CREATE POLICY "Shop owners can update own shops"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update any shop"
  ON shops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- 4. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  price numeric(10, 2) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_shop ON services(shop_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can manage own services"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status booking_status DEFAULT 'confirmed' NOT NULL,
  notes text,
  cancellation_reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_shop ON bookings(shop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view their shop bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop owners can update their shop bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. SHOP_AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS shop_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean DEFAULT true NOT NULL,
  opening_time time NOT NULL,
  closing_time time NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(shop_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_availability_shop ON shop_availability(shop_id);

ALTER TABLE shop_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop availability"
  ON shop_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shop owners can manage own availability"
  ON shop_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = shop_availability.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
  ('Restaurant', 'Food and dining services', 'utensils'),
  ('Beauty Salon', 'Hair, makeup, and beauty services', 'scissors'),
  ('Clinic', 'Medical and healthcare services', 'heart-pulse'),
  ('Spa', 'Wellness and relaxation services', 'sparkles'),
  ('Gym', 'Fitness and workout facilities', 'dumbbell'),
  ('Coaching', 'Education and training institutes', 'book-open'),
  ('Mobile Repair', 'Phone and device repair services', 'smartphone'),
  ('Car Service', 'Automotive maintenance and repair', 'car'),
  ('Pet Care', 'Veterinary and grooming services', 'dog')
ON CONFLICT (name) DO NOTHING;

-- Function to update shop ratings
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shops SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE shop_id = NEW.shop_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE shop_id = NEW.shop_id
    )
  WHERE id = NEW.shop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_shop_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_shops_updated_at
BEFORE UPDATE ON shops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_availability_updated_at
BEFORE UPDATE ON shop_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
