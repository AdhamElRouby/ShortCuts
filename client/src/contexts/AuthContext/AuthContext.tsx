import {
  createContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/api/supabase';
import axiosInstance from '@/api/axios';

export interface UserProfile {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const { data } = await axiosInstance.get('/auth/me');
    return data;
  } catch {
    return null;
  }
}

async function createProfileFromMetadata(authUser: User): Promise<UserProfile | null> {
  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'User';

  try {
    const { data } = await axiosInstance.post('/auth/profile', { displayName });
    return data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);
  // Track user ID to avoid re-fetching profile on same user
  const currentUserId = useRef<string | null>(null);

  // Auth state listener — synchronous, no API calls
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || signingOut.current) {
          setUser(null);
          setProfile(null);
          currentUserId.current = null;
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile only when a NEW user signs in (different ID)
  useEffect(() => {
    if (!user || signingOut.current) return;
    if (user.id === currentUserId.current) return; // same user, skip

    currentUserId.current = user.id;

    const load = async () => {
      const existing = await fetchProfile();
      if (signingOut.current) return;

      if (existing) {
        setProfile(existing);
        return;
      }

      // Auto-create for OAuth / recovery users
      const created = await createProfileFromMetadata(user);
      if (!signingOut.current && created) {
        setProfile(created);
      }
    };

    load();
  }, [user]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');

    const { data: profileData } = await axiosInstance.post('/auth/profile', {
      displayName,
    });

    currentUserId.current = data.user.id;
    setUser(data.user);
    setProfile(profileData);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    setUser(data.user);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;
  };

  const signOut = async () => {
    signingOut.current = true;
    currentUserId.current = null;
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
    signingOut.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
