import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';

function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setLoading(false);
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
            Reset Password
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            {sent
              ? 'Check your email for the reset link'
              : "Enter your email and we'll send you a reset link"}
          </p>

          {/* Gold divider */}
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/40" />
            <div className="w-1 h-1 rounded-full bg-gold/60" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>

        {/* Card */}
        <div className="animate-fade-in-up opacity-0 stagger-2 rounded-xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <p className="text-foreground/80 text-sm text-center">
                We sent a reset link to <span className="text-gold">{email}</span>.
                Click the link in the email to set a new password.
              </p>
              <Button
                onClick={() => { setSent(false); setEmail(''); }}
                variant="outline"
                className="cursor-pointer border-white/[0.08] text-muted-foreground hover:text-gold hover:border-gold/30 transition-all duration-200 mt-2"
              >
                Send again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-foreground/80">
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/[0.04] border-white/[0.08] focus:border-gold/50 focus:ring-gold/20 transition-colors placeholder:text-muted-foreground/50"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-gold hover:bg-gold-light text-background font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,162,39,0.25)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <div className="animate-fade-in opacity-0 stagger-4 mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
