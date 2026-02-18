interface LogoProps {
  size: "full" | "nav" | "small" | "favicon";
  className?: string;
}

const sizeDefaults: Record<LogoProps["size"], number> = {
  full: 280,
  nav: 30,
  small: 32,
  favicon: 20,
};

export function Logo({ size, className }: LogoProps) {
  const defaultPx = sizeDefaults[size];

  const svgProps = {
    viewBox: "0 0 200 200",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    width: defaultPx,
    height: defaultPx,
    className,
  };

  if (size === "full") {
    return (
      <svg {...svgProps}>
        <circle cx="100" cy="100" r="96" stroke="#D4A44C" strokeWidth="2.5"/>
        {/* Book */}
        <path d="M30 62 L30 148 Q65 156 100 148 L100 62 Q65 58 30 62 Z" fill="#D4A44C" opacity="0.06" stroke="#D4A44C" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M170 62 L170 148 Q135 156 100 148 L100 62 Q135 58 170 62 Z" fill="#D4A44C" opacity="0.06" stroke="#D4A44C" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M30 148 Q30 158 34 162 Q65 170 100 162 Q135 170 166 162 Q170 158 170 148" stroke="#D4A44C" strokeWidth="2" fill="#D4A44C" opacity="0.04" strokeLinejoin="round"/>
        <path d="M32 150 Q65 158 100 150 Q135 158 168 150" stroke="#D4A44C" strokeWidth="1" fill="none" opacity="0.2"/>
        <path d="M33 154 Q65 162 100 154 Q135 162 167 154" stroke="#D4A44C" strokeWidth="0.8" fill="none" opacity="0.15"/>
        {/* Text lines LEFT */}
        <line x1="38" y1="72" x2="90" y2="68" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="37" y1="80" x2="91" y2="76" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="36" y1="88" x2="92" y2="84" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="35" y1="96" x2="92" y2="92" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="34" y1="104" x2="80" y2="101" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="34" y1="112" x2="78" y2="109" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="33" y1="120" x2="76" y2="117" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="33" y1="128" x2="74" y2="126" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="32" y1="136" x2="72" y2="134" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="32" y1="144" x2="70" y2="142" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        {/* Text lines RIGHT */}
        <line x1="162" y1="72" x2="110" y2="68" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="163" y1="80" x2="109" y2="76" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="164" y1="88" x2="108" y2="84" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="165" y1="96" x2="108" y2="92" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="166" y1="104" x2="120" y2="101" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="166" y1="112" x2="122" y2="109" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="167" y1="120" x2="124" y2="117" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="167" y1="128" x2="126" y2="126" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="168" y1="136" x2="128" y2="134" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        <line x1="168" y1="144" x2="130" y2="142" stroke="#D4A44C" strokeWidth="0.9" opacity="0.2" strokeLinecap="round"/>
        {/* Glass (masked) */}
        <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="#D4A44C" strokeWidth="2" fill="none"/>
        <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" fill="#0A0A0A" opacity="0.95"/>
        <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="#D4A44C" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
        <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="#D4A44C" opacity="0.16"/>
        <path d="M72 100 Q100 106 128 100" stroke="#D4A44C" strokeWidth="1.2" fill="none" opacity="0.35"/>
        <rect x="97" y="130" width="6" height="10" fill="#0A0A0A" opacity="0.95"/>
        <line x1="100" y1="130" x2="100" y2="140" stroke="#D4A44C" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="100" cy="142" rx="18" ry="4" fill="#0A0A0A" opacity="0.95"/>
        <ellipse cx="100" cy="142" rx="18" ry="4" stroke="#D4A44C" strokeWidth="2" fill="none"/>
      </svg>
    );
  }

  if (size === "nav") {
    return (
      <svg {...svgProps}>
        <circle cx="100" cy="100" r="96" stroke="#D4A44C" strokeWidth="4"/>
        <path d="M30 62 L30 148 Q65 156 100 148 L100 62 Q65 58 30 62 Z" fill="#D4A44C" opacity="0.1" stroke="#D4A44C" strokeWidth="3"/>
        <path d="M170 62 L170 148 Q135 156 100 148 L100 62 Q135 58 170 62 Z" fill="#D4A44C" opacity="0.1" stroke="#D4A44C" strokeWidth="3"/>
        <path d="M30 148 Q30 158 34 162 Q65 170 100 162 Q135 170 166 162 Q170 158 170 148" stroke="#D4A44C" strokeWidth="2.5" fill="#D4A44C" opacity="0.06"/>
        <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="#D4A44C" strokeWidth="3" fill="none"/>
        <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="#D4A44C" strokeWidth="4" fill="none"/>
        <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="#D4A44C" opacity="0.2"/>
        <line x1="100" y1="130" x2="100" y2="140" stroke="#D4A44C" strokeWidth="3.5"/>
        <ellipse cx="100" cy="142" rx="18" ry="4" stroke="#D4A44C" strokeWidth="3" fill="none"/>
      </svg>
    );
  }

  if (size === "small") {
    return (
      <svg {...svgProps}>
        <circle cx="100" cy="100" r="94" stroke="#D4A44C" strokeWidth="6"/>
        <path d="M28 60 L28 150 Q65 158 100 150 L100 60 Q65 56 28 60 Z" fill="#D4A44C" opacity="0.12" stroke="#D4A44C" strokeWidth="5"/>
        <path d="M172 60 L172 150 Q135 158 100 150 L100 60 Q135 56 172 60 Z" fill="#D4A44C" opacity="0.12" stroke="#D4A44C" strokeWidth="5"/>
        <path d="M28 150 Q28 160 34 164 Q65 172 100 164 Q135 172 166 164 Q172 160 172 150" stroke="#D4A44C" strokeWidth="4" fill="#D4A44C" opacity="0.08"/>
        <path d="M86 46 C86 46 82 60 78 70 C72 80 66 90 66 104 C66 120 80 132 100 132 C120 132 134 120 134 104 C134 90 128 80 122 70 C118 60 114 46 114 46" stroke="#D4A44C" strokeWidth="6" fill="none"/>
        <ellipse cx="100" cy="46" rx="14" ry="4" stroke="#D4A44C" strokeWidth="5" fill="none"/>
        <path d="M72 102 Q100 108 128 102 C129 106 130 110 130 112 C130 118 118 129 100 129 C82 129 70 118 70 112 C70 110 71 106 72 102 Z" fill="#D4A44C" opacity="0.22"/>
      </svg>
    );
  }

  // favicon
  return (
    <svg {...svgProps}>
      <circle cx="100" cy="100" r="92" stroke="#D4A44C" strokeWidth="9"/>
      <path d="M26 58 L26 152 Q65 160 100 152 L100 58 Q65 54 26 58 Z" fill="#D4A44C" opacity="0.18" stroke="#D4A44C" strokeWidth="7"/>
      <path d="M174 58 L174 152 Q135 160 100 152 L100 58 Q135 54 174 58 Z" fill="#D4A44C" opacity="0.18" stroke="#D4A44C" strokeWidth="7"/>
      <path d="M86 48 C86 48 80 64 76 74 C70 84 64 94 64 106 C64 122 80 134 100 134 C120 134 136 122 136 106 C136 94 130 84 124 74 C120 64 114 48 114 48" stroke="#D4A44C" strokeWidth="9" fill="none"/>
    </svg>
  );
}
