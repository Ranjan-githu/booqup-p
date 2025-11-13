# Booqup - Universal Online Appointment Booking System

Booqup is a full-stack web application that enables users to book appointments online at various types of businesses including restaurants, beauty parlors, clinics, salons, mobile repair shops, coaching institutes, and more.

## Features

### For Customers
- Browse and search for shops by category and location
- View shop details, ratings, and reviews
- Book appointments with real-time availability
- Manage bookings (view, cancel)
- Get directions to shops via Google Maps
- Write reviews for completed appointments

### For Shop Owners
- Create and manage shop profile
- Add and manage services with pricing
- View and manage incoming bookings
- Set business hours and availability
- Track ratings and reviews

### For Administrators
- Approve or reject new shop registrations
- View platform analytics
- Manage users and shops
- Monitor bookings and reviews

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd booqup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. The database schema has been automatically created with the migration
3. Get your project URL and anon key from Project Settings > API

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 5. Database Setup

The database schema includes:
- **profiles**: Extended user information
- **categories**: Business categories (Restaurant, Salon, Clinic, etc.)
- **shops**: Business listings with location data
- **services**: Services offered by shops
- **bookings**: Appointment bookings
- **reviews**: Customer reviews and ratings
- **shop_availability**: Shop working hours

All tables have Row Level Security (RLS) enabled for data protection.

### 6. Create an Admin Account (Optional)

After signing up, you can manually update your user type to 'admin' in the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor > profiles
3. Find your profile and change `user_type` to 'admin'

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Guide

### For Customers

1. **Sign Up**: Create an account as a customer
2. **Browse Shops**: View available shops on the homepage
3. **Filter**: Use category filters to find specific types of businesses
4. **Search**: Use the search bar to find shops by name or location
5. **Book**: Click "Book Now" on any shop to see available services and time slots
6. **Manage**: View and cancel bookings from "My Bookings"
7. **Review**: Write reviews for completed appointments

### For Shop Owners

1. **Sign Up**: Create an account as a shop owner
2. **Create Shop**: Fill in your business details, location, and hours
3. **Add Services**: Add services with duration and pricing
4. **Wait for Approval**: Admin will review and approve your shop
5. **Manage Bookings**: View and manage incoming appointments
6. **Track Performance**: Monitor ratings and reviews

### For Administrators

1. **Access Admin Panel**: Navigate to Admin Dashboard
2. **Review Shops**: Approve or reject pending shop registrations
3. **Monitor Platform**: View statistics and analytics
4. **Manage Content**: Oversee all shops and bookings

## Database Schema

### Key Tables

- **profiles**: User profiles with role-based access (customer, shop_owner, admin)
- **shops**: Business listings with geolocation and status (pending, approved, rejected)
- **services**: Services with duration and pricing
- **bookings**: Appointments with date, time, and status tracking
- **reviews**: 5-star ratings with optional comments
- **categories**: Predefined business categories

### Security

- Row Level Security (RLS) policies ensure users can only access their own data
- Shop owners can only manage their own shops
- Customers can only view approved shops
- Admins have full access for moderation

## Key Features Implementation

### Real-time Availability
The booking system checks existing bookings and generates available time slots based on:
- Shop opening/closing hours
- Service duration
- Existing bookings

### Review System
- Customers can review shops after completing appointments
- Reviews automatically update shop average ratings
- Prevents duplicate reviews per booking

### Role-based Access
Three user types with different permissions:
- **Customer**: Book appointments, write reviews
- **Shop Owner**: Manage shop and services
- **Admin**: Approve shops, view analytics

### Booking Management
- Customers can cancel bookings before the appointment
- Shop owners can view all their bookings
- Status tracking: confirmed, cancelled, completed, no_show

## Future Enhancements

- Google Maps integration for interactive location display
- Payment integration (Stripe/Razorpay)
- Email/SMS notifications for booking confirmations
- Multi-day availability scheduling
- Advanced analytics dashboard
- Mobile app version
- AI-based recommendations

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking page components
│   ├── dashboard/      # User dashboard components
│   ├── home/           # Homepage components
│   ├── layout/         # Layout components (Header, etc.)
│   ├── reviews/        # Review system components
│   └── shop/           # Shop owner dashboard components
├── contexts/           # React contexts (Auth)
├── lib/                # Utilities (Supabase client)
├── App.tsx             # Main app component with routing
└── main.tsx            # App entry point
```

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub or contact support.
