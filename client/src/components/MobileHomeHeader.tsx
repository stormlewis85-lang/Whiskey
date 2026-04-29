import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNavMenu } from "@/components/MobileNavMenu";

export function MobileHomeHeader() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div
      className="flex justify-between items-center"
      style={{ padding: "8px 20px 16px" }}
    >
      {/* Hamburger + Logo */}
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
            <span className="font-display font-medium text-lg text-primary">
              MyWhiskeyPedia
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
