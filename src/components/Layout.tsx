import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { getGravatarUrl } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/signin');
    } catch (error) {
      toast.error('Error signing out');
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img 
                  src="/nebelu-logo.svg" 
                  alt="Nebelu Logo" 
                  className="h-8 w-auto"
                  onError={(e) => {
                    // Fallback if PNG fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = "/nebelu-logo.svg";
                  }}
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/dashboard'
                    ? 'text-primary bg-primary/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Post
              </Link>
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-8 rounded-full"
                  src={getGravatarUrl(user?.email || '')}
                  alt={user?.email || 'User avatar'}
                />
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
