import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Clock } from 'lucide-react';
import { supabase, Shop, Category } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';

interface HomePageProps {
  onNavigate: (page: string, data?: { shopId: string }) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterShops();
  }, [selectedCategory, searchQuery, shops]);

  const loadData = async () => {
    try {
      const [categoriesResult, shopsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('shops')
          .select('*, category:categories(*)')
          .eq('status', 'approved')
          .order('average_rating', { ascending: false }),
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (shopsResult.data) setShops(shopsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((shop) => shop.category_id === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(query) ||
          shop.description?.toLowerCase().includes(query) ||
          shop.address.toLowerCase().includes(query)
      );
    }

    setFilteredShops(filtered);
  };

  const handleBookNow = (shopId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onNavigate('booking', { shopId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book Your Appointment in Seconds
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Find and book services at restaurants, salons, clinics, and more
            </p>

            <div className="bg-white rounded-lg p-2 flex items-center max-w-2xl">
              <Search className="text-gray-400 ml-2" size={20} />
              <input
                type="text"
                placeholder="Search for shops, services, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredShops.length} {filteredShops.length === 1 ? 'Shop' : 'Shops'} Available
            </h2>
          </div>

          {filteredShops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg">
              <MapPin className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
              <p className="text-gray-600">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">
                      {shop.name.charAt(0)}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{shop.name}</h3>
                      {shop.total_reviews > 0 && (
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded">
                          <Star className="text-yellow-500 fill-current" size={16} />
                          <span className="font-semibold text-gray-900">
                            {shop.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {shop.description || 'No description available'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span className="line-clamp-1">{shop.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span>{shop.phone}</span>
                      </div>
                      {shop.opening_time && shop.closing_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          <span>
                            {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookNow(shop.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
