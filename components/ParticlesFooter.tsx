"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

declare global {
  interface Window {
    particlesJS: any;
  }
}

export default function ParticlesFooter() {
  const particlesRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const loadParticles = async () => {
      // Load particles.js script
      if (!window.particlesJS) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
        script.onload = () => {
          initializeParticles();
        };
        document.head.appendChild(script);
      } else {
        initializeParticles();
      }
    };

    const initializeParticles = () => {
      if (particlesRef.current && window.particlesJS) {
        window.particlesJS("particles-footer", {
          particles: {
            number: {
              value: 70,
              density: {
                enable: true,
                value_area: 1400,
              },
            },
            color: {
              value: "#3f51b5",
            },
            shape: {
              type: "polygon",
              stroke: {
                width: 1,
                color: "#3f51b5",
              },
              polygon: {
                nb_sides: 6,
              },
            },
            opacity: {
              value: 1,
              random: true,
              anim: {
                enable: true,
                speed: 0.8,
                opacity_min: 0.25,
                sync: true,
              },
            },
            size: {
              value: 2,
              random: true,
              anim: {
                enable: true,
                speed: 10,
                size_min: 1.25,
                sync: true,
              },
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#3f51b5",
              opacity: 1,
              width: 1,
            },
            move: {
              enable: true,
              speed: 8,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: true,
              attract: {
                enable: true,
                rotateX: 2000,
                rotateY: 2000,
              },
            },
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: true,
                mode: "grab",
              },
              onclick: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 200,
                line_linked: {
                  opacity: 3,
                },
              },
              repulse: {
                distance: 250,
                duration: 2,
              },
            },
          },
          retina_detect: true,
        });
      }
    };

    loadParticles();

    // Cleanup
    return () => {
      if (particlesRef.current) {
        particlesRef.current.innerHTML = "";
      }
    };
  }, [theme]);

  return (
    <div
      ref={particlesRef}
      id="particles-footer"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}
