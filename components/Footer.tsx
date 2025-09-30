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
import "styles/footer.css";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const iconSize = 28;

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

  return (
    <footer>
      <div className="mx-3 my-3 social-icons-container text-white">
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

      {/* GitHub Star and Version */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
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
        <span className="text-slate-400 text-xs">v{packageJson.version}</span>
      </div>

      <p className="text-white text-sm flex justify-center">
        &copy; {currentYear} Ditectrev
      </p>
    </footer>
  );
};

export default Footer;
