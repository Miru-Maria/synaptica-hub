interface PhoenixLogoProps {
  size?: number;
  className?: string;
  glowIntensity?: "low" | "medium" | "high";
}

export function PhoenixLogo({ size = 40, className = "", glowIntensity = "medium" }: PhoenixLogoProps) {
  const base = import.meta.env.BASE_URL;
  const uid = `pl-${size}`;

  const glowColor = {
    low: "rgba(0,200,160,0.35)",
    medium: "rgba(0,200,160,0.65)",
    high: "rgba(0,200,160,0.9)",
  }[glowIntensity];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Synaptica Phoenix Logo"
      style={{
        filter: `drop-shadow(0 0 ${Math.round(size * 0.18)}px ${glowColor}) drop-shadow(0 0 ${Math.round(size * 0.07)}px rgba(167,139,250,0.45))`,
        overflow: "visible",
      }}
    >
      <defs>
        {/* Gradient for the phoenix fill */}
        <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00c8a0" />
          <stop offset="50%" stopColor="#00ffd0" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>

        {/* High-contrast filter applied to the mask image so the
            phoenix silhouette becomes fully opaque white and the
            dark background becomes fully transparent black */}
        <filter id={`${uid}-contrast`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          {/* Desaturate */}
          <feColorMatrix type="saturate" values="0" result="gray" />
          {/* Aggressive contrast + brightness boost */}
          <feComponentTransfer in="gray" result="boosted">
            <feFuncR type="linear" slope="6" intercept="-1.5" />
            <feFuncG type="linear" slope="6" intercept="-1.5" />
            <feFuncB type="linear" slope="6" intercept="-1.5" />
          </feComponentTransfer>
          {/* Clamp to [0,1] via saturate matrix so values don't overflow */}
          <feColorMatrix in="boosted" type="saturate" values="0" />
        </filter>

        {/* SVG mask: white pixels allow gradient through, black pixels hide it */}
        <mask id={`${uid}-mask`} maskContentUnits="objectBoundingBox">
          <image
            href={`${base}phoenix-logo.png`}
            width="1"
            height="1"
            preserveAspectRatio="xMidYMid meet"
            filter={`url(#${uid}-contrast)`}
          />
        </mask>
      </defs>

      {/* Gradient rectangle revealed only where the phoenix silhouette is bright */}
      <rect
        width="100"
        height="100"
        fill={`url(#${uid}-grad)`}
        mask={`url(#${uid}-mask)`}
      />
    </svg>
  );
}
