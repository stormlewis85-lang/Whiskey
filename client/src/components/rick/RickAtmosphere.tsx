import { getRickGreeting } from "@/lib/rick-suggestions";

interface RickAtmosphereProps {
  userName: string | null;
  sessionCount: number;
  lastSessionToday: boolean;
}

export function RickAtmosphere({ userName, sessionCount, lastSessionToday }: RickAtmosphereProps) {
  const greeting = getRickGreeting(userName, sessionCount, lastSessionToday);

  return (
    <section className="relative overflow-hidden pt-12 pb-10 px-5">
      {/* Ambient radial glow — boosted visibility */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rick-atmosphere-glow w-[360px] h-[360px] rounded-full" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Glencairn glass — brand mark */}
        <svg
          width="52"
          height="52"
          viewBox="58 36 84 114"
          fill="none"
          className="text-primary mb-7 opacity-80"
        >
          <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
          <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="currentColor" opacity="0.15" />
          <path d="M72 100 Q100 106 128 100" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.3" />
          <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>

        {/* Greeting — Rick's voice */}
        <p className="font-display text-lg text-foreground/80 max-w-[280px] leading-relaxed whitespace-pre-line">
          {greeting}
        </p>
      </div>
    </section>
  );
}
