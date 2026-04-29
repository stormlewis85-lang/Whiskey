import { cn } from "@/lib/utils";

interface GlencairnIconProps {
  className?: string;
}

export function GlencairnIcon({ className }: GlencairnIconProps) {
  return (
    <svg
      viewBox="0 0 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-muted-foreground/20", className)}
    >
      {/* Bowl */}
      <path
        d="M10 8 C10 8, 8 40, 20 56 C24 61, 28 63, 32 64 C36 63, 40 61, 44 56 C56 40, 54 8, 54 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim */}
      <path
        d="M6 8 L58 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Stem */}
      <path
        d="M32 64 L32 78"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Base */}
      <path
        d="M20 78 C20 78, 26 82, 32 82 C38 82, 44 78, 44 78"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Base bottom */}
      <path
        d="M18 82 L46 82"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
