import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CircleUser, LogOut, BarChart3, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

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

        {/* Navigation */}
        {user && (
          <div className="flex-1 flex justify-center">
            <nav className="flex space-x-6">
              <Link href="/">
                <a className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-amber-800 bg-amber-50' 
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
                }`}>
                  <Home className="h-4 w-4" />
                  <span>Collection</span>
                </a>
              </Link>
              <Link href="/dashboard">
                <a className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-amber-800 bg-amber-50' 
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </a>
              </Link>
            </nav>
          </div>
        )}

        {/* User menu */}
        {user && (
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
      </div>
    </header>
  );
}