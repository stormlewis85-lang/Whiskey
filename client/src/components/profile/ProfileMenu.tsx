import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart3,
  Wine,
  EyeOff,
  MessageSquare,
  Users,
  Settings,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronRight,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";

interface ProfileMenuProps {
  onOpenSettings: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  rightElement,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  rightElement?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer transition-colors active:bg-accent/50"
      style={{ padding: "0 16px", minHeight: "48px" }}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0",
          variant === "destructive" ? "text-destructive" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "flex-1 text-left font-medium",
          variant === "destructive" ? "text-destructive" : "text-foreground"
        )}
        style={{ fontSize: "0.85rem" }}
      >
        {label}
      </span>
      {rightElement}
    </button>
  );
}

export function ProfileMenu({ onOpenSettings }: ProfileMenuProps) {
  const [, navigate] = useLocation();
  const { logoutMutation } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeLabel = !mounted ? "System" : theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
  const ThemeIcon = !mounted ? Monitor : theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const chevron = <ChevronRight className="w-4 h-4 text-muted-foreground/50" />;

  return (
    <>
      <div className="mx-5 mt-6 mb-24">
        <div
          className="text-muted-foreground uppercase font-medium mb-2 px-1"
          style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
        >
          Menu
        </div>

        <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50">
          <MenuItem
            icon={BarChart3}
            label="Dashboard"
            onClick={() => navigate("/dashboard")}
            rightElement={chevron}
          />
          <MenuItem
            icon={Wine}
            label="Flights"
            onClick={() => navigate("/flights")}
            rightElement={chevron}
          />
          <MenuItem
            icon={EyeOff}
            label="Blind Tastings"
            onClick={() => navigate("/blind-tastings")}
            rightElement={chevron}
          />
          <MenuItem
            icon={MessageSquare}
            label="Rick House"
            onClick={() => navigate("/rick-house")}
            rightElement={chevron}
          />
          <MenuItem
            icon={Users}
            label="Tasting Clubs"
            onClick={() => navigate("/clubs")}
            rightElement={chevron}
          />
          <MenuItem
            icon={Trophy}
            label="Challenges"
            onClick={() => navigate("/challenges")}
            rightElement={chevron}
          />
          <MenuItem
            icon={TrendingUp}
            label="Progress"
            onClick={() => navigate("/progress")}
            rightElement={chevron}
          />
          <MenuItem
            icon={Zap}
            label="Palate Exercises"
            onClick={() => navigate("/exercises")}
            rightElement={chevron}
          />
          <MenuItem
            icon={Settings}
            label="Settings"
            onClick={onOpenSettings}
            rightElement={chevron}
          />
          <MenuItem
            icon={ThemeIcon}
            label="Theme"
            onClick={cycleTheme}
            rightElement={
              <button
                onClick={(e) => { e.stopPropagation(); cycleTheme(); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/50 border-none cursor-pointer"
                style={{ fontSize: "0.75rem" }}
              >
                <ThemeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">{themeLabel}</span>
              </button>
            }
          />
          <MenuItem
            icon={LogOut}
            label="Log Out"
            onClick={() => setIsLogoutDialogOpen(true)}
            variant="destructive"
          />
        </div>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Log out?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
