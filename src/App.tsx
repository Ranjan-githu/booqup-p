import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { HomePage } from './components/home/HomePage';
import { BookingPage } from './components/booking/BookingPage';
import { MyBookings } from './components/dashboard/MyBookings';
import { ShopDashboard } from './components/shop/ShopDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { ReviewForm } from './components/reviews/ReviewForm';

type Page = 'home' | 'booking' | 'my-bookings' | 'shop-dashboard' | 'admin' | 'review';

interface NavigationData {
  shopId?: string;
  bookingId?: string;
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const { loading } = useAuth();

  useEffect(() => {
    const title = document.querySelector('title');
    if (title) {
      switch (currentPage) {
        case 'home':
          title.textContent = 'Booqup - Book Appointments Online';
          break;
        case 'booking':
          title.textContent = 'Book Appointment - Booqup';
          break;
        case 'my-bookings':
          title.textContent = 'My Bookings - Booqup';
          break;
        case 'shop-dashboard':
          title.textContent = 'Shop Dashboard - Booqup';
          break;
        case 'admin':
          title.textContent = 'Admin Panel - Booqup';
          break;
        case 'review':
          title.textContent = 'Write Review - Booqup';
          break;
      }
    }
  }, [currentPage]);

  const handleNavigate = (page: string, data?: NavigationData) => {
    setCurrentPage(page as Page);
    if (data) {
      setNavigationData(data);
    }
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}

      {currentPage === 'booking' && navigationData.shopId && (
        <BookingPage shopId={navigationData.shopId} onNavigate={handleNavigate} />
      )}

      {currentPage === 'my-bookings' && <MyBookings onNavigate={handleNavigate} />}

      {currentPage === 'shop-dashboard' && <ShopDashboard onNavigate={handleNavigate} />}

      {currentPage === 'admin' && <AdminPanel onNavigate={handleNavigate} />}

      {currentPage === 'review' && navigationData.shopId && navigationData.bookingId && (
        <ReviewForm
          shopId={navigationData.shopId}
          bookingId={navigationData.bookingId}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
