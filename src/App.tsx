import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { AuthProvider } from './contexts/auth';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;