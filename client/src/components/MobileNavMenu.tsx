import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { GlencairnIcon } from "@/components/GlencairnIcon";
import ProfileSettingsModal from "@/components/modals/ProfileSettingsModal";
import {
  Home,
  BarChart3,
  TrendingUp,
  Users,
  UsersRound,
  Eye,
  Mic,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  CircleUser,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface MobileNavMenuProps {
  onClose: () => void;
}

export function MobileNavMenu({ onClose }: MobileNavMenuProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeLabel = !mounted ? "System" : theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
  const ThemeIcon = !mounted ? Monitor : theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const isActive = (path: string) => location === path;

  const navLinkClass = (path: string) =>
    `relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    }`;

  const navLinks = [
    { href: "/", label: "Collection", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/community", label: "Community", icon: Users },
    { href: "/clubs", label: "Clubs", icon: UsersRound },
    { href: "/flights", label: "Flights", icon: GlencairnIcon },
    { href: "/blind-tastings", label: "Blind Tastings", icon: Eye },
    { href: "/rick-house", label: "Rick House", icon: Mic },
    { href: "/drops", label: "Drops", icon: Bell },
  ];

  return (
    <>
      <div className="flex flex-col h-full pb-20">
        {/* User info */}
        <div className="flex items-center gap-3 pb-6 pt-2 border-b border-border">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <CircleUser className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {user?.displayName || user?.username}
            </p>
            <p className="text-sm text-muted-foreground">Welcome back</p>
          </div>
        </div>

        {/* Navigation — scrollable so footer stays pinned */}
        <nav className="flex flex-col gap-1 py-6 overflow-y-auto flex-1 min-h-0">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button onClick={onClose} className={navLinkClass(href)}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            </Link>
          ))}
        </nav>

        {/* Footer with profile, settings, theme, and logout */}
        <div className="mt-auto pt-6 border-t border-border space-y-1">
          {(user as any)?.profileSlug && (
            <Link href={`/u/${(user as any).profileSlug}`}>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={onClose}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onClose();
              setIsProfileSettingsOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={cycleTheme}
          >
            <ThemeIcon className="mr-2 h-4 w-4" />
            <span>Theme</span>
            <span className="ml-auto text-xs text-muted-foreground">{themeLabel}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onClose();
              logoutMutation.mutate();
            }}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            {logoutMutation.isPending && <span className="ml-2">...</span>}
          </Button>
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
    </>
  );
}
