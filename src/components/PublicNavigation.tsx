"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PublicNavigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/tournament", label: "Tournament" },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
            pathname === item.href
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default PublicNavigation;
