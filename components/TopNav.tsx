"use client";

import React, { useEffect, useState } from "react";
import GitHubButton from "react-github-btn";
import HomeButton from "./HomeButton";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

const TopNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <div className="h-16 mb-10 w-full px-3 border-b-[1px] border-slate-700 text-white flex justify-between items-center">
      <div className="flex items-center flex-col w-1/2">
        {pathname !== "/" && (
          <HomeButton
            handleReturnToMainPage={() => {
              router.push("/");
            }}
          />
        )}
      </div>
      <div className="flex items-center flex-col w-full">
        <Image
          src="/logo.svg"
          alt="Ditectrev Logo"
          className="max-w-[90%] max-h-[90%]"
          height={50}
          width={200}
        />
        <p className={`${windowWidth < 768 ? "text-sm" : "text-xl"}`}>
          🧪 Practice Exams Platform
        </p>
      </div>
      <div className="flex items-center pt-1 w-1/2">
        {/* Authentication Status */}
        {isAuthenticated && user && (
          <div className="relative mr-4">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm">
                {user.name || user.email.split("@")[0]}
              </span>
              <svg
                className="w-4 h-4"
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
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-600 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm text-slate-300 border-b border-slate-600 text-center">
                    <div>Signed in as</div>
                    <div className="font-medium text-white mt-1 break-all">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {windowWidth < 640 && (
          <div
            onClick={toggleMobileMenu}
            className="cursor-pointer mx-auto text-white"
          >
            ☰
          </div>
        )}
        {!isMobileMenuOpen && windowWidth >= 640 && (
          <div>
            <a
              href="https://apps.apple.com/app/cloudmaster-swift/id6503601139"
              className="mr-4 text-white"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our iOS App"
            >
              iOS App
            </a>
            <a
              href="https://shop.ditectrev.com"
              className="mr-4 text-white"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our Shop"
            >
              Shop
            </a>
            <GitHubButton
              href="https://github.com/Ditectrev/Practice-Exams-Platform"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
              aria-label="Star our platform on GitHub"
            >
              Star
            </GitHubButton>
          </div>
        )}
        {isMobileMenuOpen && windowWidth < 640 && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            {isAuthenticated && user && (
              <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg font-medium">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-sm mb-2">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
            <a
              href="https://apps.apple.com/app/cloudmaster-swift/id6503601139"
              className="mb-4 text-white text-xl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our iOS App"
            >
              iOS App
            </a>
            <a
              href="https://shop.ditectrev.com"
              className="mb-4 text-white text-xl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our Shop"
            >
              Shop
            </a>
            <GitHubButton
              href="https://github.com/Ditectrev/Practice-Exams-Platform"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
              aria-label="Star our platform on GitHub"
            >
              Star
            </GitHubButton>
            <button
              onClick={toggleMobileMenu}
              className="mt-4 text-white text-xl"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNav;
