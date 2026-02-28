import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "rgba(212,164,76,0.08)",
        }}
      >
        <Icon className="w-6 h-6 text-primary" style={{ opacity: 0.6 }} />
      </div>
      <h3
        className="font-display font-medium text-foreground mb-2"
        style={{ fontSize: "1.1rem" }}
      >
        {title}
      </h3>
      <p
        className="text-muted-foreground"
        style={{ fontSize: "0.8rem", lineHeight: 1.6, maxWidth: "260px" }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-primary font-medium bg-transparent border-none cursor-pointer uppercase"
          style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
