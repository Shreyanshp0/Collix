import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default PrivateRoute;
