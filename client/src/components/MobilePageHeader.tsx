import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNavMenu } from "@/components/MobileNavMenu";

interface MobilePageHeaderProps {
  rightAction?: React.ReactNode;
}

export function MobilePageHeader({ rightAction }: MobilePageHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
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
            <MobileNavMenu onClose={() => setIsSheetOpen(false)} />
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
  );
}
