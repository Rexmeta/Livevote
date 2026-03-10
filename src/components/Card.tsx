import React from "react";
import { cn } from "../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => (
  <div 
    onClick={onClick}
    className={cn("bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm", className)}
  >
    {children}
  </div>
);
