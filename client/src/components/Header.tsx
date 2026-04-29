import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CircleUser, LogOut, BarChart3, TrendingUp, Home, Menu, Users, UsersRound, Eye, Mic, Bell, Settings, UserCircle, Sun, Moon, Monitor } from "lucide-react";
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import ProfileSettingsModal from "@/components/modals/ProfileSettingsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeLabel = !mounted ? "System" : theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
  const ThemeIcon = !mounted ? Monitor : theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  // Navigation links that can be used in both desktop and mobile views
  const NavLinks = () => (
    <>
      <Link href="/">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Collection</span>
        </button>
      </Link>
      <Link href="/dashboard">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/dashboard')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
      </Link>
      <Link href="/analytics">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/analytics')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Analytics</span>
        </button>
      </Link>
      <Link href="/community">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/community')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Community</span>
        </button>
      </Link>
      <Link href="/clubs">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/clubs')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <UsersRound className="h-4 w-4" />
          <span>Clubs</span>
        </button>
      </Link>
      <Link href="/flights">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/flights')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <GlencairnIcon className="h-4 w-4" />
          <span>Flights</span>
        </button>
      </Link>
      <Link href="/blind-tastings">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/blind-tastings')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Blind Tastings</span>
        </button>
      </Link>
      <Link href="/rick-house">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/rick-house')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Mic className="h-4 w-4" />
          <span>Rick House</span>
        </button>
      </Link>
      <Link href="/drops">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/drops')
              ? 'text-primary bg-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Drops</span>
        </button>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {user && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col h-full pb-20">
                  {/* User info */}
                  <div className="flex items-center gap-3 pb-6 pt-2 border-b border-border">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <CircleUser className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">Welcome back</p>
                    </div>
                  </div>

                  {/* Navigation — scrollable so footer stays pinned */}
                  <nav className="flex flex-col gap-1 py-6 overflow-y-auto flex-1 min-h-0">
                    <NavLinks />
                  </nav>

                  {/* Footer with settings and logout */}
                  <div className="mt-auto pt-6 border-t border-border space-y-1">
                    {(user as any).profileSlug && (
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
                        setIsSheetOpen(false);
                        handleLogout();
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
          )}

          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer">
              <Logo size="nav" />
              <span className="font-display font-medium text-lg text-primary">
                MyWhiskeyPedia
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        )}

        {/* Right side: Theme toggle and user menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User menu for desktop */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden md:flex h-9 gap-2 px-2 text-muted-foreground hover:text-foreground"
                >
                  <CircleUser className="h-5 w-5" />
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {user.displayName || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.displayName || user.username}</p>
                    <p className="text-xs text-muted-foreground">Manage your account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(user as any).profileSlug && (
                  <Link href={`/u/${(user as any).profileSlug}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem
                  onClick={() => setIsProfileSettingsOpen(true)}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                  {logoutMutation.isPending && <span className="ml-2">...</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
    </header>
  );
}
