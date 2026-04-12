import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      {/* Film strip decorations — left */}
      <div className="absolute left-4 md:left-12 top-0 bottom-0 w-8 opacity-[0.04] pointer-events-none">
        <div className="animate-film-scroll h-[200%] flex flex-col gap-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-full aspect-[4/3] rounded-sm border border-gold/30" />
          ))}
        </div>
      </div>

      {/* Film strip decorations — right */}
      <div className="absolute right-4 md:right-12 top-0 bottom-0 w-8 opacity-[0.04] pointer-events-none">
        <div
          className="animate-film-scroll h-[200%] flex flex-col gap-3"
          style={{ animationDirection: "reverse" }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-full aspect-[4/3] rounded-sm border border-gold/30" />
          ))}
        </div>
      </div>

      {/* Radial gold glow behind the content */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[0.03] blur-[120px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Logo */}
        <div className="animate-fade-in opacity-0 mb-6">
          <img
            src="/logo/short-cuts-logo-no-bg.png"
            alt="ShortCuts"
            className="w-20 h-20 animate-float"
          />
        </div>

        {/* 404 number */}
        <h1
          className="animate-fade-in opacity-0 stagger-1 text-[8rem] md:text-[10rem] font-bold leading-none tracking-tighter"
          style={{
            background: "linear-gradient(180deg, #e6b84f 0%, #c9a227 40%, #a68521 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        {/* Decorative divider */}
        <div className="animate-fade-in opacity-0 stagger-2 flex items-center gap-3 my-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/50" />
        </div>

        {/* Message */}
        <p className="animate-fade-in opacity-0 stagger-3 text-xl md:text-2xl font-medium text-foreground/90 mb-2">
          Scene not found
        </p>
        <p className="animate-fade-in opacity-0 stagger-4 text-muted-foreground text-sm md:text-base mb-10 max-w-xs">
          This scene didn't make the final cut. Let's get you back to the show.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in-up opacity-0 stagger-5">
          <Button
            onClick={() => navigate("/")}
            className="cursor-pointer bg-gold hover:bg-gold-light text-background font-semibold px-8 py-3 text-base rounded-lg transition-all duration-300 hover:shadow-[0_0_24px_rgba(201,162,39,0.3)] hover:scale-105 active:scale-95"
          >
            Back to Home
          </Button>
        </div>

        {/* Bottom subtle line */}
        <div className="animate-fade-in opacity-0 stagger-5 mt-16 text-muted-foreground/40 text-xs tracking-widest uppercase">
          ShortCuts
        </div>
      </div>
    </div>
  );
}

export default NotFound;
