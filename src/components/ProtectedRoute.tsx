import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'operator')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-500 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // If user is not allowed, redirect to 'Unauthorized' or login to avoid infinite loops
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'operator') return <Navigate to="/pos" replace />;
    
    // In case of completely unknown role, force logout or show error
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4 text-center">
         <div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600">Akun Anda ({profile.role}) tidak memiliki akses ke halaman ini.</p>
            <button onClick={() => { localStorage.removeItem('pos_user'); window.location.href='/login'; }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Logout</button>
         </div>
      </div>
    );
  }

  return <Outlet />;
}
