import { Home, Search, Bell, User, MessageSquare } from "lucide-react";
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
            <MessageSquare
              className="w-6 h-6 text-primary-foreground"
              style={{ marginBottom: "1px" }}
            />
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
