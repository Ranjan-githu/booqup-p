import { useState, useEffect } from 'react';
import { Check, X, TrendingUp, Store, Users, Calendar } from 'lucide-react';
import { supabase, Shop, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AdminPanelProps {
  onNavigate: (page: string) => void;
}

interface Stats {
  totalShops: number;
  pendingShops: number;
  totalUsers: number;
  totalBookings: number;
}

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'stats'>('pending');
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalShops: 0,
    pendingShops: 0,
    totalUsers: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadData();
    }
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsResult, usersResult, bookingsResult] = await Promise.all([
        supabase
          .from('shops')
          .select('*, category:categories(*), owner:profiles!shops_owner_id_fkey(*)')
          .eq('status', activeTab === 'pending' ? 'pending' : 'approved')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
      ]);

      if (shopsResult.data) setShops(shopsResult.data);

      const { data: allShops } = await supabase.from('shops').select('id, status');
      const totalShops = allShops?.length || 0;
      const pendingShops = allShops?.filter(s => s.status === 'pending').length || 0;

      setStats({
        totalShops,
        pendingShops,
        totalUsers: usersResult.count || 0,
        totalBookings: bookingsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    setProcessingId(shopId);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'approved' })
        .eq('id', shopId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error approving shop:', error);
      alert('Failed to approve shop. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shopId: string) => {
    if (!confirm('Are you sure you want to reject this shop?')) return;

    setProcessingId(shopId);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'rejected' })
        .eq('id', shopId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error rejecting shop:', error);
      alert('Failed to reject shop. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be an administrator to access this page.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Shops</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalShops}</p>
              </div>
              <Store className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingShops}</p>
              </div>
              <TrendingUp className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Shops ({stats.pendingShops})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Approved Shops
              </button>
            </nav>
          </div>

          <div className="p-6">
            {shops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-600">
                  {activeTab === 'pending'
                    ? 'No shops pending approval'
                    : 'No approved shops yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{shop.name}</h3>
                        <p className="text-sm text-gray-600">
                          {shop.category?.name} • {shop.address}
                        </p>
                      </div>
                      {activeTab === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(shop.id)}
                            disabled={processingId === shop.id}
                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Check size={18} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(shop.id)}
                            disabled={processingId === shop.id}
                            className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            <X size={18} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Phone:</span> {shop.phone}
                        </p>
                        {shop.email && (
                          <p className="text-gray-600">
                            <span className="font-medium">Email:</span> {shop.email}
                          </p>
                        )}
                      </div>
                      <div>
                        {shop.opening_time && shop.closing_time && (
                          <p className="text-gray-600">
                            <span className="font-medium">Hours:</span> {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                          </p>
                        )}
                        <p className="text-gray-600">
                          <span className="font-medium">Rating:</span> {shop.average_rating.toFixed(1)} ({shop.total_reviews} reviews)
                        </p>
                      </div>
                    </div>

                    {shop.description && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700">{shop.description}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(shop.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
