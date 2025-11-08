"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FiExternalLink } from "react-icons/fi";
import ThemeSwitch from "./ThemeSwitch";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const { theme } = useTheme();
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
    setShowUserMenu(false);
    router.push("/");
  };

  const navigationLinks = [
    {
      href: "https://blog.ditectrev.com",
      title: "Blog",
      external: true,
    },
    {
      href: "https://shop.ditectrev.com",
      title: "Shop",
      external: true,
    },
    {
      href: "https://apps.apple.com/app/cloudmaster-swift/id6503601139",
      title: "iOS App",
      external: true,
    },
  ];

  const ExternalLinkIcon = () => (
    <FiExternalLink className="inline-block ml-1 w-3 h-3 external-link-icon" />
  );

  return (
    <header className="sticky top-0 z-40 bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-100/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left section - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center cursor-pointer"
            >
              <Image
                src={theme === "light" ? "/logoBlack.svg" : "/logoWhite.svg"}
                alt="Ditectrev Logo"
                className="h-8 w-auto"
                height={32}
                width={120}
              />
            </button>
          </div>

          {/* Right section - Navigation and Auth */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 text-sm font-medium flex items-center"
                  aria-label={`Visit ${link.title}${
                    link.external ? " (opens in new tab)" : ""
                  }`}
                >
                  {link.title}
                  {link.external && <ExternalLinkIcon />}
                </a>
              ))}
            </nav>

            {/* Authentication */}
            {isAuthenticated && user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800/60 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#3f51b5" }}
                  >
                    <span className="text-white text-xs font-medium">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-gray-500 dark:text-gray-400 text-sm">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center">
                        <div>Signed in as</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 mt-1 break-all">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-center px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth/callback")}
                className="btn-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Sign In
              </button>
            )}

            {/* Theme Switch - Rightmost position */}
            <ThemeSwitch />

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-gray-100/98 dark:bg-gray-900/98 backdrop-blur">
            <nav className="px-6 py-6 space-y-4 text-center">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 text-lg font-medium py-3"
                  aria-label={`Visit ${link.title}${
                    link.external ? " (opens in new tab)" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center justify-center">
                    {link.title}
                    {link.external && <ExternalLinkIcon />}
                  </span>
                </a>
              ))}

              {isAuthenticated && user && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col items-center space-y-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#3f51b5" }}
                    >
                      <span className="text-white text-sm font-medium">
                        {user.name
                          ? user.name.charAt(0).toUpperCase()
                          : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                        {user.name || user.email.split("@")[0]}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block mx-auto text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
