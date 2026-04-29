import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlencairnIconProps {
  className?: string;
  style?: CSSProperties;
}

export function GlencairnIcon({ className, style }: GlencairnIconProps) {
  return (
    <svg
      viewBox="58 36 84 114"
      fill="none"
      className={cn("text-muted-foreground/20", className)}
      style={style}
    >
      <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="3" fill="none" />
    </svg>
  );
}
