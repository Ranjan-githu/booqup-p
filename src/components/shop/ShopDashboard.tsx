import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, User } from 'lucide-react';
import { supabase, Shop, Service, Booking, Category } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ShopDashboardProps {
  onNavigate: (page: string) => void;
}

export function ShopDashboard({ onNavigate }: ShopDashboardProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings'>('overview');
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showShopForm, setShowShopForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
  });
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    category_id: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    opening_time: '09:00',
    closing_time: '18:00',
  });

  useEffect(() => {
    if (user && profile?.user_type === 'shop_owner') {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [categoriesResult, shopResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('shops').select('*, category:categories(*)').eq('owner_id', user.id).maybeSingle(),
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);

      if (shopResult.data) {
        setShop(shopResult.data);
        setShopForm({
          name: shopResult.data.name,
          description: shopResult.data.description || '',
          category_id: shopResult.data.category_id,
          address: shopResult.data.address,
          latitude: shopResult.data.latitude,
          longitude: shopResult.data.longitude,
          phone: shopResult.data.phone,
          email: shopResult.data.email || '',
          opening_time: shopResult.data.opening_time?.slice(0, 5) || '09:00',
          closing_time: shopResult.data.closing_time?.slice(0, 5) || '18:00',
        });

        const [servicesResult, bookingsResult] = await Promise.all([
          supabase.from('services').select('*').eq('shop_id', shopResult.data.id),
          supabase
            .from('bookings')
            .select('*, service:services(*)')
            .eq('shop_id', shopResult.data.id)
            .gte('booking_date', new Date().toISOString().split('T')[0])
            .order('booking_date')
            .order('start_time'),
        ]);

        if (servicesResult.data) setServices(servicesResult.data);
        if (bookingsResult.data) setBookings(bookingsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (shop) {
        const { error } = await supabase
          .from('shops')
          .update({
            ...shopForm,
            opening_time: `${shopForm.opening_time}:00`,
            closing_time: `${shopForm.closing_time}:00`,
          })
          .eq('id', shop.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('shops').insert({
          owner_id: user.id,
          ...shopForm,
          opening_time: `${shopForm.opening_time}:00`,
          closing_time: `${shopForm.closing_time}:00`,
          status: 'pending',
        });

        if (error) throw error;
      }

      setShowShopForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving shop:', error);
      alert('Failed to save shop. Please try again.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    try {
      if (serviceForm.id) {
        const { error } = await supabase
          .from('services')
          .update({
            name: serviceForm.name,
            description: serviceForm.description,
            duration_minutes: serviceForm.duration_minutes,
            price: serviceForm.price,
          })
          .eq('id', serviceForm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert({
          shop_id: shop.id,
          name: serviceForm.name,
          description: serviceForm.description,
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.price,
          is_active: true,
        });

        if (error) throw error;
      }

      setShowServiceForm(false);
      setServiceForm({ id: '', name: '', description: '', duration_minutes: 30, price: 0 });
      loadData();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (profile?.user_type !== 'shop_owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be a shop owner to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop && !showShopForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Shop</h2>
          <p className="text-gray-600 mb-8">
            Set up your shop profile to start receiving bookings from customers.
          </p>
          <button
            onClick={() => setShowShopForm(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (showShopForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {shop ? 'Edit Shop' : 'Create Shop'}
          </h2>

          <form onSubmit={handleShopSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                value={shopForm.category_id}
                onChange={(e) => setShopForm({ ...shopForm, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={shopForm.latitude}
                  onChange={(e) => setShopForm({ ...shopForm, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={shopForm.longitude}
                  onChange={(e) => setShopForm({ ...shopForm, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={shopForm.email}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  required
                  value={shopForm.opening_time}
                  onChange={(e) => setShopForm({ ...shopForm, opening_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  required
                  value={shopForm.closing_time}
                  onChange={(e) => setShopForm({ ...shopForm, closing_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                {shop ? 'Update Shop' : 'Create Shop'}
              </button>
              <button
                type="button"
                onClick={() => setShowShopForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Shop Dashboard</h1>
          <button
            onClick={() => setShowShopForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Edit2 size={18} />
            <span>Edit Shop</span>
          </button>
        </div>

        {shop?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Your shop is pending approval. You will be notified once an admin reviews your shop.
            </p>
          </div>
        )}

        {shop?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              Your shop has been rejected. Please contact support for more information.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{shop?.name}</h2>
          <p className="text-gray-600 mb-4">{shop?.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{services.length}</p>
              <p className="text-gray-600">Services</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
              <p className="text-gray-600">Upcoming Bookings</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{shop?.average_rating.toFixed(1) || 0}</p>
              <p className="text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <p className="text-gray-600">
                  Your shop is {shop?.status}. Keep your services updated and manage your bookings efficiently.
                </p>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Services</h3>
                  <button
                    onClick={() => {
                      setServiceForm({ id: '', name: '', description: '', duration_minutes: 30, price: 0 });
                      setShowServiceForm(true);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    <span>Add Service</span>
                  </button>
                </div>

                {showServiceForm && (
                  <form onSubmit={handleServiceSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={serviceForm.duration_minutes}
                          onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        {serviceForm.id ? 'Update' : 'Add'} Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowServiceForm(false);
                          setServiceForm({ id: '', name: '', description: '', duration_minutes: 30, price: 0 });
                        }}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {services.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No services added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {service.duration_minutes} min
                            </span>
                            <span className="font-semibold text-blue-600">${service.price}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setServiceForm({
                                id: service.id,
                                name: service.name,
                                description: service.description || '',
                                duration_minutes: service.duration_minutes,
                                price: service.price,
                              });
                              setShowServiceForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h3>
                {bookings.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No upcoming bookings.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.service?.name}</h4>
                            <p className="text-sm text-gray-600">Booking #{booking.id.slice(0, 8)}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                            {booking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </div>
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                            Note: {booking.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
