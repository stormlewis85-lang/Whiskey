import { Home, Search, Bell, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch unread notification count for badge
  const unreadQuery = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/unread-count");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadQuery.data?.count || 0;

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/profile") return location.startsWith("/u/") || location === "/profile";
    return location.startsWith(path);
  };

  const profileHref = (user as any).profileSlug
    ? `/u/${(user as any).profileSlug}`
    : "/profile";

  const rickActive = isActive("/rick-house");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom"
      style={{
        minHeight: "84px",
        background: "linear-gradient(to top, hsl(var(--background)) 70%, transparent)",
      }}
    >
      <div className="flex justify-around items-start w-full h-full pt-3">
        {/* Home */}
        <TabItem href="/" icon={Home} label="Home" active={isActive("/")} />

        {/* Search */}
        <TabItem href="/search" icon={Search} label="Search" active={isActive("/search")} />

        {/* Center Rick House FAB */}
        <Link href="/rick-house">
          <button
            className="rick-fab flex flex-col items-center justify-center rounded-full bg-primary cursor-pointer border-none"
            style={{
              width: "58px",
              height: "58px",
              marginTop: "-22px",
            }}
            aria-label="Rick House — AI Tasting Guide"
          >
            <svg
              width="24"
              height="24"
              viewBox="58 36 84 114"
              fill="none"
              className="text-primary-foreground"
              style={{ marginBottom: "1px" }}
            >
              {/* Exact Glencairn glass from Logo component */}
              <ellipse cx="100" cy="46" rx="14" ry="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <path d="M86 46 C86 46 83 58 81 66 C76 76 68 88 68 102 C68 118 82 130 100 130 C118 130 132 118 132 102 C132 88 124 76 119 66 C117 58 114 46 114 46" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
              {/* Whiskey fill */}
              <path d="M72 100 Q100 106 128 100 C129 104 130 108 130 110 C130 116 118 127 100 127 C82 127 70 116 70 110 C70 108 71 104 72 100 Z" fill="currentColor" opacity="0.2" />
              <path d="M72 100 Q100 106 128 100" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4" />
              {/* Stem */}
              <line x1="100" y1="130" x2="100" y2="140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Base */}
              <ellipse cx="100" cy="142" rx="18" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
              {/* 4-point sparkle accent near rim */}
              <path d="M122 40L124 34L126 40L132 42L126 44L124 50L122 44L116 42Z" fill="currentColor" />
            </svg>
            <span
              className="text-primary-foreground font-semibold"
              style={{ fontSize: "0.5rem", letterSpacing: "0.06em" }}
            >
              RICK
            </span>
          </button>
        </Link>

        {/* Drops */}
        <TabItem
          href="/drops"
          icon={Bell}
          label="Drops"
          active={isActive("/drops")}
          badge={unreadCount}
        />

        {/* Profile */}
        <TabItem href={profileHref} icon={User} label="Profile" active={isActive("/profile")} />
      </div>
    </nav>
  );
}

function TabItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <button
        className="relative flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer transition-opacity duration-200"
        style={{ opacity: active ? 1 : 0.4, minHeight: "44px", minWidth: "44px", padding: "4px 8px" }}
      >
        <div className="relative">
          <Icon className={`w-6 h-6 ${active ? "text-primary" : "text-foreground"}`} />
          {badge !== undefined && badge > 0 && (
            <span
              className="absolute flex items-center justify-center font-bold text-white"
              style={{
                top: "-6px",
                right: "-8px",
                minWidth: "16px",
                height: "16px",
                borderRadius: "8px",
                background: "hsl(var(--primary))",
                fontSize: "0.55rem",
                padding: "0 3px",
              }}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        <span
          className={`font-medium ${active ? "text-primary" : "text-foreground"}`}
          style={{ fontSize: "0.6rem", letterSpacing: "0.02em" }}
        >
          {label}
        </span>
      </button>
    </Link>
  );
}
