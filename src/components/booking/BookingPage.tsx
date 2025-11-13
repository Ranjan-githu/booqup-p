import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { supabase, Shop, Service, Booking } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BookingPageProps {
  shopId: string;
  onNavigate: (page: string) => void;
}

export function BookingPage({ shopId, onNavigate }: BookingPageProps) {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      generateTimeSlots();
    }
  }, [selectedService, selectedDate]);

  const loadShopData = async () => {
    try {
      const [shopResult, servicesResult] = await Promise.all([
        supabase.from('shops').select('*, category:categories(*)').eq('id', shopId).single(),
        supabase.from('services').select('*').eq('shop_id', shopId).eq('is_active', true),
      ]);

      if (shopResult.data) setShop(shopResult.data);
      if (servicesResult.data) setServices(servicesResult.data);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async () => {
    if (!shop || !selectedService || !selectedDate) return;

    const openingTime = shop.opening_time || '09:00:00';
    const closingTime = shop.closing_time || '18:00:00';

    const openHour = parseInt(openingTime.split(':')[0]);
    const closeHour = parseInt(closingTime.split(':')[0]);
    const duration = selectedService.duration_minutes;

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('shop_id', shopId)
      .eq('booking_date', selectedDate)
      .in('status', ['confirmed']);

    const bookedSlots = new Set(
      existingBookings?.map((b: Booking) => b.start_time.slice(0, 5)) || []
    );

    const slots: string[] = [];
    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + duration;
        const endHour = hour + Math.floor(endMinute / 60);
        const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;

        if (endHour < closeHour || (endHour === closeHour && endMinute % 60 === 0)) {
          if (!bookedSlots.has(time)) {
            slots.push(time);
          }
        }
      }
    }

    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!user || !selectedService || !selectedDate || !selectedTime) return;

    setBooking(true);
    try {
      const duration = selectedService.duration_minutes;
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endMinutes = minutes + duration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const endTime = `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}:00`;

      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        shop_id: shopId,
        service_id: selectedService.id,
        booking_date: selectedDate,
        start_time: `${selectedTime}:00`,
        end_time: endTime,
        status: 'confirmed',
        notes: notes || null,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onNavigate('my-bookings');
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop not found</h2>
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-600 hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your appointment has been successfully booked. Redirecting to your bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to shops
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{shop.name}</h1>
          <div className="space-y-2 text-gray-600">
            <div className="flex items-center">
              <MapPin size={18} className="mr-2 text-gray-400" />
              <span>{shop.address}</span>
            </div>
            {shop.opening_time && shop.closing_time && (
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-gray-400" />
                <span>
                  {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Service</h2>
          {services.length === 0 ? (
            <p className="text-gray-600">No services available at this time.</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedService?.id === service.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-blue-600 font-semibold">
                        <DollarSign size={16} />
                        {service.price}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{service.duration_minutes} min</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedService && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date & Time</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                min={getMinDate()}
                max={getMaxDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {selectedDate && availableSlots.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 rounded-lg font-medium transition-colors ${
                        selectedTime === slot
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && availableSlots.length === 0 && (
              <p className="text-gray-600 mb-4">No available slots for this date.</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requests or notes..."
              />
            </div>

            <button
              onClick={handleBooking}
              disabled={!selectedService || !selectedDate || !selectedTime || booking}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
