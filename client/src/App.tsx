import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home/Home";
import Login from "@/pages/Login/Login";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword/ResetPassword";
import NotFound from "@/pages/NotFound/NotFound";
import Loading from "@/pages/Loading/Loading";
<<<<<<< Updated upstream
import WatchPage from '@/pages/Watch/Watch'; 
=======
import WatchPage from '@/pages/Watch/Watch';
import Profile from '@/pages/Profile/Profile';
import Channels from '@/pages/Channels/Channels';
>>>>>>> Stashed changes
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        }
      />
      <Route path="/video/:videoId" element={<WatchPage />} />
<<<<<<< Updated upstream
=======
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/channels" element={<Channels />} />
>>>>>>> Stashed changes
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
