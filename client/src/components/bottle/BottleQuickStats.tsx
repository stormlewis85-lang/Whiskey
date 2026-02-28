interface Stat {
  value: string;
  label: string;
}

interface BottleQuickStatsProps {
  stats: Stat[];
}

export function BottleQuickStats({ stats }: BottleQuickStatsProps) {
  return (
    <div
      className="flex justify-around mx-5"
      style={{
        padding: "20px",
        background: "hsl(var(--card))",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="font-semibold text-foreground" style={{ fontSize: "1rem" }}>
            {stat.value}
          </div>
          <div
            className="text-muted-foreground uppercase"
            style={{ fontSize: "0.6rem", letterSpacing: "0.05em", marginTop: "2px" }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
