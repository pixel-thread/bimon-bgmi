"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { FiLogIn, FiSun, FiMoon } from "react-icons/fi";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function DesktopNavigation() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isSignedIn: isAuthorized } = useAuth();
  const onToggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/tournament", label: "Tournament" },
    { href: "/settings", label: "Settings" },
    { href: "/guides", label: "Guides" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="hidden md:flex items-center space-x-4">
      {/* Main Navigation Links */}
      <nav className="flex items-center space-x-1">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNavigation(item.href)}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* User Actions */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          aria-label={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            <FiSun className="h-4 w-4" />
          ) : (
            <FiMoon className="h-4 w-4" />
          )}
        </button>

        {/* Profile Button - Only show if authenticated */}
        {isAuthorized && <UserButton />}

        {/* Login/Logout Button */}
        {!isAuthorized && (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            aria-label="Login"
          >
            <FiLogIn className="h-4 w-4" />
            <span className="hidden lg:inline">Login</span>
          </button>
        )}
      </div>
    </div>
  );
}
