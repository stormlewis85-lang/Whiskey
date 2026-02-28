interface ProfileTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div
      className="flex mx-5 mt-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 text-center relative bg-transparent border-none cursor-pointer font-medium uppercase transition-colors duration-200 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
            style={{
              padding: "14px 0",
              minHeight: "44px",
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
            }}
          >
            {tab}
            {isActive && (
              <span
                className="absolute bg-primary"
                style={{
                  bottom: "-1px",
                  left: "20%",
                  right: "20%",
                  height: "2px",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
