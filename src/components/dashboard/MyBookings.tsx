import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, XCircle, CheckCircle, Star } from 'lucide-react';
import { supabase, Booking } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MyBookingsProps {
  onNavigate: (page: string, data?: { shopId: string; bookingId: string }) => void;
}

export function MyBookings({ onNavigate }: MyBookingsProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, filter]);

  const loadBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select('*, shop:shops(*, category:categories(*)), service:services(*)')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (filter === 'upcoming') {
        query = query.in('status', ['confirmed']).gte('booking_date', new Date().toISOString().split('T')[0]);
      } else if (filter === 'past') {
        query = query.in('status', ['completed']).lt('booking_date', new Date().toISOString().split('T')[0]);
      } else if (filter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by customer',
        })
        .eq('id', bookingId);

      if (error) throw error;

      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'completed':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'cancelled'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'upcoming'
                ? "You don't have any upcoming bookings."
                : filter === 'past'
                ? "You don't have any past bookings."
                : "You don't have any cancelled bookings."}
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{booking.shop?.name}</h3>
                    <p className="text-gray-600">{booking.service?.name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={18} className="mr-2 text-gray-400" />
                    <span>{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={18} className="mr-2 text-gray-400" />
                    <span>
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="mr-2 text-gray-400" />
                    <span className="truncate">{booking.shop?.address}</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  </div>
                )}

                {booking.cancellation_reason && (
                  <div className="mb-4 p-3 bg-red-50 rounded">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Cancellation reason:</span>{' '}
                      {booking.cancellation_reason}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      <span>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}</span>
                    </button>
                  )}

                  {booking.status === 'completed' && (
                    <button
                      onClick={() =>
                        onNavigate('review', { shopId: booking.shop_id, bookingId: booking.id })
                      }
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Star size={18} />
                      <span>Write Review</span>
                    </button>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.shop?.latitude},${booking.shop?.longitude}`, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <MapPin size={18} />
                      <span>Get Directions</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
