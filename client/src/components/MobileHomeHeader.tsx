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
      <div className="flex items-center gap-4">
        <div className="relative" style={{ opacity: 0.7 }}>
          <Bell className="w-[22px] h-[22px] text-foreground" />
          {hasNotifications && (
            <span
              className="absolute bg-primary rounded-full"
              style={{
                width: "7px",
                height: "7px",
                top: "0px",
                right: "0px",
              }}
            />
          )}
        </div>
        <Link href="/search">
          <Search className="w-[22px] h-[22px] text-foreground" style={{ opacity: 0.7 }} />
        </Link>
      </div>
    </div>
  );
}
