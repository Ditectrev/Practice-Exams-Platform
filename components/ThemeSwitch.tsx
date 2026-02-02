"use client";

import { useTheme } from "@azure-fundamentals/contexts/ThemeContext";
import "@theme-toggles/react/css/Lightbulb.css";
import { Lightbulb } from "@theme-toggles/react";
import { useRef, useEffect } from "react";

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // Reset hover state after theme change
    setTimeout(() => {
      if (containerRef.current) {
        const lightbulb = containerRef.current.querySelector("svg");
        if (lightbulb) {
          lightbulb.style.color = theme === "light" ? "#9ca3af" : "#6b7280";
        }
      }
    }, 50);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const lightbulb = e.currentTarget.querySelector("svg");
    if (lightbulb) {
      lightbulb.style.color = theme === "dark" ? "#f3f4f6" : "#111827";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const lightbulb = e.currentTarget.querySelector("svg");
    if (lightbulb) {
      lightbulb.style.color = theme === "dark" ? "#9ca3af" : "#6b7280";
    }
  };

  // Reset color when theme changes
  useEffect(() => {
    if (containerRef.current) {
      const lightbulb = containerRef.current.querySelector("svg");
      if (lightbulb) {
        lightbulb.style.color = theme === "dark" ? "#9ca3af" : "#6b7280";
      }
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* @ts-ignore - @theme-toggles/react types incompatible with React 18.3 strict types */}
      <Lightbulb
        toggle={handleToggle}
        toggled={theme === "dark"}
        duration={750}
        style={{
          fontSize: "36px",
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          transition: "color 0.2s ease-in-out",
        }}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        title="Toggle theme"
      />
    </div>
  );
}
