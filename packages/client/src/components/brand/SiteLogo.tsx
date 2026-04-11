type SiteLogoProps = {
  /** Navbar: compact. Hero / auth: larger mark */
  variant?: "navbar" | "hero" | "auth";
  showWordmark?: boolean;
  className?: string;
};

const imgClasses: Record<NonNullable<SiteLogoProps["variant"]>, string> = {
  navbar:
    "h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl ring-1 ring-white/15 bg-surface-2/50 shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-105",
  hero: "h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-2xl ring-1 ring-white/15 bg-surface-2/60 shadow-xl",
  auth: "h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl ring-1 ring-white/15 bg-surface-2/60 shadow-xl shadow-black/40",
};

const wordmarkClasses: Record<NonNullable<SiteLogoProps["variant"]>, string> = {
  navbar: "font-display font-bold text-xl tracking-tight",
  hero: "font-display font-extrabold text-2xl sm:text-3xl tracking-tight",
  auth: "font-display font-bold text-2xl tracking-tight",
};

export function SiteLogo({ variant = "navbar", showWordmark = true, className = "" }: SiteLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/pp1.png" alt="PartyHub" className={imgClasses[variant]} />
      {showWordmark && (
        <span className={wordmarkClasses[variant]}>
          Party<span className="text-gradient">Hub</span>
        </span>
      )}
    </span>
  );
}
