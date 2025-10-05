"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { FiExternalLink } from "react-icons/fi";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth() || {};
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-700">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left section - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center cursor-pointer"
            >
              <Image
                src="/logo.svg"
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
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center"
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
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors duration-200"
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
                  <span className="hidden sm:block text-slate-300 text-sm">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <svg
                    className="w-4 h-4 text-slate-400"
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
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-slate-400 border-b border-slate-700 text-center">
                        <div>Signed in as</div>
                        <div className="font-medium text-white mt-1 break-all">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors duration-200"
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

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-slate-400 hover:text-white"
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
          <div className="md:hidden border-t border-slate-700 bg-slate-900/98 backdrop-blur">
            <nav className="px-6 py-6 space-y-4 text-center">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="block text-slate-300 hover:text-white transition-colors duration-200 text-lg font-medium py-3"
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
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center space-x-3 mb-4">
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
                    <div>
                      <div className="text-white text-sm font-medium">
                        {user.name || user.email.split("@")[0]}
                      </div>
                      <div className="text-slate-400 text-xs">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
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
