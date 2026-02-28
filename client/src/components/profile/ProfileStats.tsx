interface Stat {
  value: number;
  label: string;
}

interface ProfileStatsProps {
  stats: Stat[];
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div
      className="flex justify-between mx-5"
      style={{
        padding: "20px",
        background: "hsl(var(--card))",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div
            className="font-display font-semibold text-primary"
            style={{ fontSize: "1.5rem" }}
          >
            {stat.value}
          </div>
          <div
            className="text-muted-foreground uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
