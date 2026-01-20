import { ChevronDown, Moon, Sun, Settings, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/navigation/GlobalSearch";
import MobileSidebar from "./mobile-sidebar";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return savedTheme;
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      return "dark";
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const getInitials = (email?: string) => {
    return email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U';
  };

  const getUserName = (email?: string) => {
    return email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-full">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Menu Button - Only visible on mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <VisuallyHidden>
                <SheetHeader>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation menu for CyberDocGen application</SheetDescription>
                </SheetHeader>
              </VisuallyHidden>
              <MobileSidebar onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.38 2.21a.75.75 0 01.24 0l7 2.5a.75.75 0 01.5.7v11.84a.75.75 0 01-.5.7l-7 2.5a.75.75 0 01-.48 0l-7-2.5a.75.75 0 01-.5-.7V5.41a.75.75 0 01.5-.7l7-2.5zM10 3.73L4.25 5.75v8.5L10 16.27l5.75-2.02v-8.5L10 3.73z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">CyberDocGen</h1>
          </div>
        </div>

        {/* Search Bar - Hidden on small screens */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme} 
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {theme === "light" ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          {/* Notifications - Hidden on mobile */}
          <div className="hidden sm:block">
            <NotificationDropdown />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-1 sm:space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 sm:px-3 py-2 rounded-lg transition-colors">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {getInitials((user)?.email)}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-24 lg:max-w-none truncate">
                  {getUserName((user)?.email)}
                </span>
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuItem className="sm:hidden">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/user-profile')} data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}