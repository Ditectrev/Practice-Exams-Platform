"use client";

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

  const socialMediaLinks = [
    {
      url: "https://discord.gg/RFjtXKfJy3",
      icon: <SiDiscord className="discord" size={iconSize} />,
    },
    {
      url: "https://github.com/ditectrev",
      icon: <SiGithub className="github" size={iconSize} />,
    },
    {
      url: "https://instagram.com/ditectrev",
      icon: <SiInstagram className="instagram" size={iconSize} />,
    },
    {
      url: "https://linkedin.com/company/ditectrev",
      icon: <SiLinkedin className="linkedin" size={iconSize} />,
    },
    {
      url: "https://medium.com/@ditectrev",
      icon: <SiMedium className="medium" size={iconSize} />,
    },
    {
      url: "https://patreon.com/Ditectrev",
      icon: <SiPatreon className="patreon" size={iconSize} />,
    },
    {
      url: "https://udemy.com/user/social-ditectrev",
      icon: <SiUdemy className="udemy" size={iconSize} />,
    },
    {
      url: "https://x.com/ditectrev",
      icon: <SiX className="x" size={iconSize} />,
    },
    {
      url: "https://youtube.com/@Ditectrev",
      icon: <SiYoutube className="youtube" size={iconSize} />,
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
        {socialMediaLinks.map((link, index) => (
          <a
            key={index}
            className="px-2"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${link.url}`}
          >
            {link.icon}
          </a>
        ))}
      </div>

      {/* GitHub Star */}
      <div className="relative z-10 flex items-center justify-center mb-3">
        <GitHubButton
          href="https://github.com/Ditectrev/Practice-Exams-Platform"
          data-color-scheme="no-preference: dark; light: light; dark: dark;"
          data-icon="octicon-star"
          data-size="large"
          data-show-count="true"
          aria-label="Star Practice Exams Platform on GitHub"
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
        &copy; {currentYear} Ditectrev
      </p>
    </footer>
  );
};

export default Footer;
