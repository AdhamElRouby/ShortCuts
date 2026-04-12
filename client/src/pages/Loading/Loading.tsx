function Loading() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold/[0.04] blur-[100px] animate-pulse-gold" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo with ring spinner */}
        <div className="relative animate-fade-in opacity-0">
          {/* Spinning ring */}
          <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-gold/60 animate-spin-slow" />
          <div
            className="absolute -inset-4 rounded-full border-2 border-transparent border-b-gold/30 animate-spin-slow"
            style={{ animationDirection: "reverse", animationDuration: "4s" }}
          />

          {/* Logo */}
          <img
            src="/logo/short-cuts-logo-no-bg.png"
            alt="ShortCuts"
            className="w-16 h-16"
          />
        </div>

        {/* Loading bar */}
        <div className="animate-fade-in opacity-0 stagger-2 w-48">
          <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full animate-shimmer"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #c9a227 50%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Text */}
        <p className="animate-fade-in opacity-0 stagger-3 text-muted-foreground text-sm tracking-widest uppercase">
          Loading
        </p>
      </div>
    </div>
  );
}

export default Loading;
