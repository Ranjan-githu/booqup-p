import { createClient } from '@supabase/supabase-js';

// Get and trim environment variables
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing Supabase environment variables: ${missing.join(', ')}\n\n` +
    `Please create a .env file in the root directory with:\n` +
    `VITE_SUPABASE_URL=your_supabase_project_url\n` +
    `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n` +
    `Get these values from: Supabase Dashboard > Project Settings > API`
  );
}

// Check if values are still placeholders
if (supabaseUrl.includes('your_supabase') || supabaseUrl.includes('placeholder') || supabaseUrl === '') {
  throw new Error(
    `Invalid Supabase URL: The VITE_SUPABASE_URL in your .env file appears to be a placeholder.\n\n` +
    `Please replace it with your actual Supabase project URL.\n` +
    `Get your URL from: Supabase Dashboard > Project Settings > API\n` +
    `The URL should look like: https://xxxxxxxxxxxxx.supabase.co`
  );
}

if (supabaseAnonKey.includes('your_supabase') || supabaseAnonKey.includes('placeholder') || supabaseAnonKey === '') {
  throw new Error(
    `Invalid Supabase Anon Key: The VITE_SUPABASE_ANON_KEY in your .env file appears to be a placeholder.\n\n` +
    `Please replace it with your actual Supabase anon key.\n` +
    `Get your key from: Supabase Dashboard > Project Settings > API`
  );
}

// Validate URL format
try {
  const url = new URL(supabaseUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('URL must use HTTP or HTTPS protocol');
  }
} catch (error) {
  throw new Error(
    `Invalid Supabase URL format: "${supabaseUrl}" is not a valid HTTP/HTTPS URL.\n\n` +
    `Please check your .env file and ensure VITE_SUPABASE_URL is a valid URL.\n` +
    `Example: https://xxxxxxxxxxxxx.supabase.co\n\n` +
    `Get your URL from: Supabase Dashboard > Project Settings > API`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'customer' | 'shop_owner' | 'admin';
export type ShopStatus = 'pending' | 'approved' | 'rejected' | 'inactive';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  category_id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  average_rating: number;
  total_reviews: number;
  status: ShopStatus;
  images?: string[];
  membership_enabled?: boolean;
  membership_price?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  shop_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  service?: Service;
}

export interface Review {
  id: string;
  user_id: string;
  shop_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface ShopAvailability {
  id: string;
  shop_id: string;
  day_of_week: number;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  created_at: string;
  updated_at: string;
}

export type MembershipType = 'monthly' | 'quarterly' | 'yearly';
export type MembershipStatus = 'active' | 'expired' | 'cancelled';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  booking_id?: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
  booking?: Booking;
}

export interface Membership {
  id: string;
  user_id: string;
  shop_id: string;
  membership_type: MembershipType;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  amount: number;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  user?: Profile;
}
