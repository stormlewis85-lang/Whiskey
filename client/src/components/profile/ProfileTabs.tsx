interface ProfileTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex mx-5 mt-5 border-b border-white/[0.06]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 text-center relative bg-transparent border-none cursor-pointer font-medium uppercase transition-colors duration-200 py-3.5 min-h-[44px] text-xs tracking-[0.06em] ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab}
            {isActive && (
              <span className="absolute bottom-[-1px] left-[20%] right-[20%] h-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
