import { useState } from "react";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
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
      <div className="flex items-center gap-2">
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

        <BrandLogo />
      </div>
    </div>
  );
}
