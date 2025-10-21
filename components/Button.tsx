import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const button = cva("button", {
  variants: {
    intent: {
      primary: ["btn-primary", "focus:ring-primary-800"],
      secondary: [
        "bg-primary-500/20",
        "border-primary-500",
        "hover:bg-primary-500/30",
        "hover:border-primary-600",
        "focus:ring-primary-800",
        "text-primary-700 dark:text-primary-300",
        "sm:mr-2",
      ],
    },
    size: {
      large: ["font-large"],
      medium: ["font-medium", "py-2.5", "px-5", "sm:text-sm", "text-xs"],
      small: ["font-small", "py-2", "px-2"],
    },
    variant: {
      filled: [],
      outlined: ["bg-transparent", "hover:bg-opacity-10"],
    },
    compoundVariants: {
      intent: ["primary", "secondary"],
      size: "medium",
    },
    defaultVariants: {
      intent: "primary",
      size: "medium",
      variant: "filled",
    },
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button: React.FC<ButtonProps> = ({
  intent,
  size,
  variant,
  className,
  ...props
}) => (
  <button
    className={`${button({
      intent,
      size,
      variant,
    })} text-white rounded-lg focus:outline-none focus:ring-1 border mb-2 sm:mb-0 disabled:cursor-not-allowed disabled:opacity-50 ${
      className || ""
    }`}
    {...props}
  />
);
