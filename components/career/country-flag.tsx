import Image from "next/image";
import { cn } from "@/lib/utils";

const FLAG_CODES: Record<string, string> = {
  argentina: "ar",
  brasil: "br",
  espana: "es",
  inglaterra: "gb-eng",
  italia: "it",
};

interface CountryFlagProps {
  nationality: string;
  width?: number;
  className?: string;
}

export function CountryFlag({
  nationality,
  width = 24,
  className,
}: CountryFlagProps) {
  const code = FLAG_CODES[nationality];
  if (!code) return null;

  const height = Math.round((width * 3) / 4);

  return (
    <Image
      src={`https://flagcdn.com/w80/${code}.png`}
      alt={nationality}
      width={width}
      height={height}
      className={cn("shrink-0 object-cover", className)}
    />
  );
}
