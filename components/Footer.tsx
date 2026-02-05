"use client";

import React from "react";
import {
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiLinkedin,
  SiMedium,
  SiPatreon,
  SiUdemy,
  SiX,
  SiYoutube,
} from "react-icons/si";
import GitHubButton from "react-github-btn";
import packageJson from "../package.json";
import ParticlesFooter from "./ParticlesFooter";
import { useTheme } from "../contexts/ThemeContext";
import "styles/footer.css";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const iconSize = 28;
  const { theme } = useTheme();

  const socialMediaLinks: Array<{ url: string; Icon: any; className: string }> =
    [
      {
        url: "https://discord.gg/RFjtXKfJy3",
        Icon: SiDiscord,
        className: "discord",
      },
      {
        url: "https://github.com/ditectrev",
        Icon: SiGithub,
        className: "github",
      },
      {
        url: "https://instagram.com/ditectrev",
        Icon: SiInstagram,
        className: "instagram",
      },
      {
        url: "https://linkedin.com/company/ditectrev",
        Icon: SiLinkedin,
        className: "linkedin",
      },
      {
        url: "https://medium.com/@ditectrev",
        Icon: SiMedium,
        className: "medium",
      },
      {
        url: "https://patreon.com/Ditectrev",
        Icon: SiPatreon,
        className: "patreon",
      },
      {
        url: "https://udemy.com/user/social-ditectrev",
        Icon: SiUdemy,
        className: "udemy",
      },
      { url: "https://x.com/ditectrev", Icon: SiX, className: "x" },
      {
        url: "https://youtube.com/@Ditectrev",
        Icon: SiYoutube,
        className: "youtube",
      },
    ];

  const gradientClass =
    theme === "dark"
      ? "bg-gradient-to-r from-gray-900 to-primary-500/70"
      : "bg-gradient-to-r from-white to-primary-800/100";

  return (
    <footer className={`relative ${gradientClass} overflow-hidden`}>
      <ParticlesFooter />
      <div className="relative z-10 mx-3 my-3 social-icons-container text-white">
        {socialMediaLinks.map((link, index) => {
          const IconComponent = link.Icon;
          return (
            <a
              key={index}
              className="px-2"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${link.url}`}
            >
              {/* @ts-ignore - react-icons types incompatible with React 18.3 strict types */}
              <IconComponent className={link.className} size={iconSize} />
            </a>
          );
        })}
      </div>

      {/* GitHub Star */}
      <div className="relative z-10 flex items-center justify-center mb-3">
        <GitHubButton
          href="https://github.com/Ditectrev/Practice-Exams-Platform"
          data-color-scheme="no-preference: dark; light: light; dark: dark;"
          data-icon="octicon-star"
          data-size="large"
          data-show-count="true"
          aria-label="Star Practice Tests Exams Platform on GitHub"
        >
          Star
        </GitHubButton>
      </div>

      {/* Version */}
      <p className="relative z-10 text-white text-xs flex justify-center mb-3">
        v{packageJson.version}
      </p>

      {/* Copyright */}
      <p className="relative z-10 text-white text-sm flex justify-center">
        &copy; {currentYear} Ditectrev and our contributors
      </p>
    </footer>
  );
};

export default Footer;
