import React from "react";
import { cn } from "../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, style }) => (
  <div 
    onClick={onClick}
    style={style}
    className={cn("bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm", className)}
  >
    {children}
  </div>
);
