import { cn } from "@/lib/utils";

interface JerseyPreviewProps {
  jerseyName: string;
  squadNumber: number | string;
  crestUrl?: string | null;
  className?: string;
}

export function JerseyPreview({
  jerseyName,
  squadNumber,
  crestUrl,
  className,
}: JerseyPreviewProps) {
  const displayName = (jerseyName || "").toUpperCase().slice(0, 12);
  const displayNumber = String(squadNumber || "").slice(0, 2);

  return (
    <div className={cn("w-full flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 120 140"
        width="128"
        height="150"
        role="img"
        aria-label={`Camiseta de ${displayName || "jugador"}, dorsal ${displayNumber}`}
      >
        {/* Sleeves */}
        <path
          d="M22 24 L2 30 Q0 32 0 36 L0 58 Q0 62 4 61 L22 54 Z"
          fill="var(--primary)"
        />
        <path
          d="M98 24 L118 30 Q120 32 120 36 L120 58 Q120 62 116 61 L98 54 Z"
          fill="var(--primary)"
        />

        {/* Torso */}
        <path
          d="M40 18 Q60 26 80 18 L98 24 L98 128 Q60 134 22 128 L22 24 Z"
          fill="var(--primary)"
        />

        {/* Collar */}
        <path
          d="M46 19 Q60 30 74 19 L69 15 Q60 20 51 15 Z"
          fill="var(--background)"
        />

        {/* Crest */}
        {crestUrl && (
          <image
            href={crestUrl}
            x="30"
            y="34"
            width="16"
            height="16"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        <text
          x="60"
          y="92"
          textAnchor="middle"
          fontSize="34"
          fontWeight={700}
          fill="var(--primary-foreground)"
          className="font-heading"
        >
          {displayNumber}
        </text>

        {displayName && (
          <text
            x="60"
            y="114"
            textAnchor="middle"
            fontSize="9"
            fontWeight={600}
            letterSpacing="1"
            fill="var(--primary-foreground)"
            className="font-heading"
          >
            {displayName}
          </text>
        )}
      </svg>
    </div>
  );
}
