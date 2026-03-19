interface Stat {
  value: number;
  label: string;
}

interface ProfileStatsProps {
  stats: Stat[];
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="flex justify-between mx-5 p-5 bg-card rounded-2xl border border-white/[0.04]">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="font-display font-semibold text-primary text-2xl">
            {stat.value}
          </div>
          <div className="text-muted-foreground uppercase text-[0.65rem] tracking-[0.08em]">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
