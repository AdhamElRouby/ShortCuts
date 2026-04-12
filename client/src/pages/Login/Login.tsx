import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Password visibility
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);

    try {
      await signIn(signInEmail, signInPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setSignInError(message);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (signUpPassword !== signUpConfirm) {
      setSignUpError('Passwords do not match');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters');
      return;
    }

    setSignUpLoading(true);

    try {
      await signUp(signUpEmail, signUpPassword, signUpName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setSignUpError(message);
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo + Title */}
        <div className="animate-fade-in opacity-0 flex flex-col items-center mb-8">
          <img
            src="/logo/short-cuts-logo-no-bg.png"
            alt="ShortCuts"
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Short<span className="text-gold">Cuts</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your gateway to short cinema
          </p>

          {/* Gold divider */}
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/40" />
            <div className="w-1 h-1 rounded-full bg-gold/60" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>

        {/* Auth Card */}
        <div className="animate-fade-in-up opacity-0 stagger-2 rounded-xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/[0.04] mb-6">
              <TabsTrigger
                value="signin"
                className="cursor-pointer data-[state=active]:bg-gold/15 data-[state=active]:text-gold transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="cursor-pointer data-[state=active]:bg-gold/15 data-[state=active]:text-gold transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-foreground/80">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-foreground/80">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-gold/70 transition-colors cursor-pointer"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {signInError && (
                  <p className="text-sm text-destructive">{signInError}</p>
                )}

                <Button
                  type="submit"
                  disabled={signInLoading}
                  className="cursor-pointer w-full bg-gold hover:bg-gold-light text-background font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,162,39,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {signInLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <p className="text-center text-sm mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-muted-foreground/60 hover:text-gold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </p>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-foreground/80">
                    Display Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground/80">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground/80">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-gold/70 transition-colors cursor-pointer"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-foreground/80">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showSignUpConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signUpConfirm}
                      onChange={(e) => setSignUpConfirm(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-gold/70 transition-colors cursor-pointer"
                    >
                      {showSignUpConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {signUpError && (
                  <p className="text-sm text-destructive">{signUpError}</p>
                )}

                <Button
                  type="submit"
                  disabled={signUpLoading}
                  className="cursor-pointer w-full bg-gold hover:bg-gold-light text-background font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,162,39,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {signUpLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-muted-foreground/40 text-xs uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            onClick={async () => {
              setGoogleError('');
              setGoogleLoading(true);
              try {
                await signInWithGoogle();
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Google sign in failed';
                setGoogleError(message);
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading}
            variant="outline"
            className="cursor-pointer w-full border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-gold/20 text-foreground/80 font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          {googleError && (
            <p className="text-sm text-destructive text-center mt-2">{googleError}</p>
          )}
        </div>

        {/* Bottom branding */}
        <p className="animate-fade-in opacity-0 stagger-4 text-center text-muted-foreground/30 text-xs tracking-widest uppercase mt-8">
          ShortCuts
        </p>
      </div>
    </div>
  );
}

export default Login;
