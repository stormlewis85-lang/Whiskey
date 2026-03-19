import { BottomNav } from "@/components/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <>
      <div className="pb-[100px] md:pb-0">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
