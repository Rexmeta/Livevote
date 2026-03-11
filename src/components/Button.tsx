import React from "react";
import { cn } from "../lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  className, 
  variant = "primary", 
  disabled, 
  type = "button",
  size = "md"
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
    ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};
