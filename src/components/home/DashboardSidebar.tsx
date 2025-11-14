import { X, Calendar, MessageSquare, CreditCard, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Booking, Message, Membership } from '../../lib/supabase';
import { useEffect, useState } from 'react';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, data?: any) => void;
}

export function DashboardSidebar({ isOpen, onClose, onNavigate }: DashboardSidebarProps) {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    unreadMessages: 0,
    activeMemberships: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
      loadStats();
      const subscription = supabase
        .channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, loadStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, loadStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `user_id=eq.${user.id}` }, loadStats)
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isOpen]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [bookingsResult, messagesResult, membershipsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('booking_date', today),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ]);

      setStats({
        upcomingBookings: bookingsResult.count || 0,
        unreadMessages: messagesResult.count || 0,
        activeMemberships: membershipsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    onNavigate('home');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-primary-50 to-white shadow-2xl z-50 animate-slide-down overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 mb-6 shadow-md border-2 border-primary-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-primary-400 rounded-full flex items-center justify-center">
                <User className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{profile?.full_name}</h3>
                <p className="text-sm text-gray-600 capitalize">{profile?.user_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  onNavigate('my-bookings');
                  onClose();
                }}
                className="w-full bg-white hover:bg-primary-50 rounded-lg p-4 shadow-md transition-all duration-200 hover:scale-105 border-2 border-primary-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                      <Calendar className="text-primary-700" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Bookings</p>
                      <p className="text-sm text-gray-600">Manage appointments</p>
                    </div>
                  </div>
                  {stats.upcomingBookings > 0 && (
                    <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {stats.upcomingBookings}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('messages');
                  onClose();
                }}
                className="w-full bg-white hover:bg-primary-50 rounded-lg p-4 shadow-md transition-all duration-200 hover:scale-105 border-2 border-primary-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                      <MessageSquare className="text-primary-700" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Messages</p>
                      <p className="text-sm text-gray-600">View notifications</p>
                    </div>
                  </div>
                  {stats.unreadMessages > 0 && (
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                      {stats.unreadMessages}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('memberships');
                  onClose();
                }}
                className="w-full bg-white hover:bg-primary-50 rounded-lg p-4 shadow-md transition-all duration-200 hover:scale-105 border-2 border-primary-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                      <CreditCard className="text-primary-700" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Memberships</p>
                      <p className="text-sm text-gray-600">Active subscriptions</p>
                    </div>
                  </div>
                  {stats.activeMemberships > 0 && (
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {stats.activeMemberships}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white rounded-lg p-4 shadow-md transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <LogOut size={20} />
            <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
