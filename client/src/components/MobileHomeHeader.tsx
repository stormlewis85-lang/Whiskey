import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";

interface MobileHomeHeaderProps {
  hasNotifications?: boolean;
}

export function MobileHomeHeader({ hasNotifications }: MobileHomeHeaderProps) {
  return (
    <div className="flex justify-between items-center" style={{ padding: "8px 20px 16px" }}>
      {/* Logo + brand */}
      <Link href="/">
        <span className="flex items-center gap-2.5 cursor-pointer">
          <Logo size="nav" />
          <span
            className="font-display font-medium text-primary"
            style={{ fontSize: "1.1rem" }}
          >
            MyWhiskeyPedia
          </span>
        </span>
      </Link>

      {/* Action icons */}
      <div className="flex items-center gap-1">
        <button
          className="relative flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ width: "44px", height: "44px", opacity: 0.7 }}
        >
          <Bell className="w-[22px] h-[22px] text-foreground" />
          {hasNotifications && (
            <span
              className="absolute rounded-full"
              style={{
                width: "8px",
                height: "8px",
                top: "8px",
                right: "8px",
                background: "hsl(var(--destructive))",
                border: "2px solid hsl(var(--background))",
              }}
            />
          )}
        </button>
        <Link href="/search">
          <span
            className="flex items-center justify-center cursor-pointer"
            style={{ width: "44px", height: "44px", opacity: 0.7 }}
          >
            <Search className="w-[22px] h-[22px] text-foreground" />
          </span>
        </Link>
      </div>
    </div>
  );
}
