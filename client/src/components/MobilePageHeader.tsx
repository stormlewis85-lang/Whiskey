import { useState } from "react";
import { Logo } from "@/components/Logo";
import {
  Menu,
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
} from "lucide-react";
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileSettingsModal from "@/components/modals/ProfileSettingsModal";

interface MobilePageHeaderProps {
  rightAction?: React.ReactNode;
}

export function MobilePageHeader({ rightAction }: MobilePageHeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navLinkClass = (path: string) =>
    `relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-primary bg-accent"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    }`;

  return (
    <>
      <div className="flex items-center justify-between px-5 py-2">
        {/* Hamburger + Title */}
        <div className="flex items-center gap-1">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col h-full">
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

                {/* Navigation */}
                <nav className="flex flex-col gap-1 py-6">
                  <Link href="/">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/")}>
                      <Home className="h-4 w-4" />
                      <span>Collection</span>
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/dashboard")}>
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                  <Link href="/analytics">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/analytics")}>
                      <TrendingUp className="h-4 w-4" />
                      <span>Analytics</span>
                    </button>
                  </Link>
                  <Link href="/community">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/community")}>
                      <Users className="h-4 w-4" />
                      <span>Community</span>
                    </button>
                  </Link>
                  <Link href="/clubs">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/clubs")}>
                      <UsersRound className="h-4 w-4" />
                      <span>Clubs</span>
                    </button>
                  </Link>
                  <Link href="/flights">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/flights")}>
                      <GlencairnIcon className="h-4 w-4" />
                      <span>Flights</span>
                    </button>
                  </Link>
                  <Link href="/blind-tastings">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/blind-tastings")}>
                      <Eye className="h-4 w-4" />
                      <span>Blind Tastings</span>
                    </button>
                  </Link>
                  <Link href="/rick-house">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/rick-house")}>
                      <Mic className="h-4 w-4" />
                      <span>Rick House</span>
                    </button>
                  </Link>
                  <Link href="/drops">
                    <button onClick={() => setIsSheetOpen(false)} className={navLinkClass("/drops")}>
                      <Bell className="h-4 w-4" />
                      <span>Drops</span>
                    </button>
                  </Link>
                </nav>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-border space-y-1">
                  {(user as any)?.profileSlug && (
                    <Link href={`/u/${(user as any).profileSlug}`}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setIsSheetOpen(false)}
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
                      setIsSheetOpen(false);
                      setIsProfileSettingsOpen(true);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsSheetOpen(false);
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
            </SheetContent>
          </Sheet>

          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <Logo size="nav" />
              <span className="font-display font-medium text-lg text-primary">MyWhiskeyPedia</span>
            </span>
          </Link>
        </div>

        {/* Optional right action */}
        {rightAction && (
          <div className="flex items-center gap-2">{rightAction}</div>
        )}
      </div>

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
    </>
  );
}
