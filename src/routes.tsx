import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Home } from './pages/Home';
import { NewPost } from './pages/NewPost';
import { PostView } from './pages/PostView';
import { EditPost } from './pages/EditPost';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/home"
        element={user ? <Home /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/signin"
        element={<SignIn />}
      />
      <Route
        path="/signup"
        element={<SignUp />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/new"
        element={user ? <NewPost /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/posts/:id"
        element={user ? <PostView /> : <Navigate to="/signin" replace />}
      />
      <Route
        path="/posts/:id/edit"
        element={user ? <EditPost /> : <Navigate to="/signin" replace />}
      />
    </Routes>
  );
}
