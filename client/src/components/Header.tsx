import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CircleUser, LogOut, BarChart3, Home, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            isActive('/') 
              ? 'text-amber-800 bg-amber-50' 
              : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Collection</span>
        </button>
      </Link>
      <Link href="/dashboard">
        <button
          onClick={() => setIsSheetOpen(false)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
            isActive('/dashboard') 
              ? 'text-amber-800 bg-amber-50' 
              : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
      </Link>
    </>
  );

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
              Whiskey Collection
            </span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        {user && !isMobile && (
          <div className="flex-1 flex justify-center">
            <nav className="flex space-x-6">
              <NavLinks />
            </nav>
          </div>
        )}

        {/* User menu for desktop */}
        {user && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 flex items-center space-x-2">
                <CircleUser className="h-5 w-5" />
                <span>{user.displayName || user.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                {logoutMutation.isPending && <span className="ml-2">...</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Mobile Menu */}
        {user && isMobile && (
          <div className="flex items-center space-x-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] sm:w-[360px]">
                <div className="px-2 py-6">
                  <div className="flex items-center mb-8">
                    <CircleUser className="h-8 w-8 text-amber-700 mr-2" />
                    <div>
                      <p className="font-medium">{user.displayName || user.username}</p>
                      <p className="text-sm text-muted-foreground">Welcome back!</p>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col space-y-4">
                    <NavLinks />
                  </nav>
                  
                  <div className="mt-auto pt-8 border-t mt-8">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
          </div>
        )}
      </div>
    </header>
  );
}