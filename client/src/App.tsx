import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home/Home';
import Login from '@/pages/Login/Login';
import ForgotPassword from '@/pages/ForgotPassword/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword/ResetPassword';
import NotFound from '@/pages/NotFound/NotFound';
import Loading from '@/pages/Loading/Loading';
import WatchPage from '@/pages/Watch/Watch';
import Profile from '@/pages/Profile/Profile';
import Channels from '@/pages/Channels/Channels';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/video/:videoId" element={<WatchPage />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/channels" element={<Channels />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
