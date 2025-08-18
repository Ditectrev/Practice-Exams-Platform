import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const button = cva("button", {
  variants: {
    intent: {
      primary: [
        "bg-blue-600/50",
        "border-blue-600",
        "hover:bg-blue-600/60",
        "focus:ring-blue-800",
        "border-blue-600",
      ],
      secondary: [
        "bg-emerald-600/50",
        "border-emerald-600",
        "hover:bg-emerald-600/60",
        "focus:ring-green-800",
        "border-emerald-600",
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
  ...props
}) => (
  <button
    className={`${button({
      intent,
      size,
      variant,
    })} text-white rounded-lg focus:outline-none focus:ring-1 border mb-2 sm:mb-0`}
    {...props}
  />
);
