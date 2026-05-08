import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar/Navbar';

function PaymentSuccess() {
  const [params] = useSearchParams();
  const amount = params.get('amount');
  const creator = params.get('creator');

  const formattedAmount =
    amount && !isNaN(parseFloat(amount))
      ? parseFloat(amount).toFixed(2)
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <Navbar />

      <main className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 pt-32 pb-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/30 shadow-[0_0_40px_rgba(201,162,39,0.18)]">
          <CheckCircle2 className="h-10 w-10 text-gold" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Thank you!
        </h1>

        <p className="mt-3 text-muted-foreground">
          Your donation was successful.
        </p>

        <div className="mt-8 w-full rounded-xl border border-white/[0.06] bg-card/40 p-6 text-left space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold/75">
            Payment details
          </p>
          {formattedAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-semibold text-gold tabular-nums">
                ${formattedAmount} USD
              </span>
            </div>
          )}
          {creator && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Creator</span>
              <span className="font-semibold text-foreground">{creator}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Completed
            </span>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground/70">
          A receipt has been sent to your email by Stripe.
        </p>

        <Button
          asChild
          className="mt-8 bg-gold font-semibold text-background shadow-[0_0_20px_rgba(201,162,39,0.2)] hover:bg-gold-light"
        >
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </main>
    </div>
  );
}

export default PaymentSuccess;
