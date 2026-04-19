import { useLocation } from "wouter";
import { BottomNav } from "@/components/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
}

const HIDDEN_NAV_ROUTES = ["/rick-house"];

export function MobileShell({ children }: MobileShellProps) {
  const [location] = useLocation();
  const hideNav = HIDDEN_NAV_ROUTES.includes(location);

  return (
    <>
      <div className={hideNav ? "" : "pb-[100px] md:pb-0"}>
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </>
  );
}
