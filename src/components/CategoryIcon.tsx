"use client";

import React from "react";

export interface CategoryIconProps {
  color?: string;
  icon?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBackground?: boolean;
}

export function getStoredCategoryIcons(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem("davi_finance_cat_icons");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveStoredCategoryIcon(catId: string | number, icon: string | null) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredCategoryIcons();
    if (icon && icon.trim() !== "" && icon !== "dot") {
      current[String(catId)] = icon;
    } else {
      delete current[String(catId)];
    }
    localStorage.setItem("davi_finance_cat_icons", JSON.stringify(current));
  } catch (err) {
    console.error("Erro ao guardar ícone local:", err);
  }
}

export function CategoryIcon({
  color = "#6366f1",
  icon,
  size = "sm",
  className = "",
  showBackground = true,
}: CategoryIconProps) {
  const hasEmoji = Boolean(icon && icon.trim() !== "" && icon !== "dot");

  const sizeStyles = {
    xs: {
      dot: "w-2.5 h-2.5",
      emoji: "text-xs",
      box: "w-5 h-5",
    },
    sm: {
      dot: "w-3.5 h-3.5",
      emoji: "text-sm",
      box: "w-6 h-6",
    },
    md: {
      dot: "w-4 h-4",
      emoji: "text-base",
      box: "w-8 h-8",
    },
    lg: {
      dot: "w-5 h-5",
      emoji: "text-xl",
      box: "w-10 h-10",
    },
    xl: {
      dot: "w-6 h-6",
      emoji: "text-2xl",
      box: "w-12 h-12",
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.sm;

  if (!hasEmoji) {
    return (
      <span
        className={`rounded-full shrink-0 shadow-xs transition-transform duration-300 ${currentSize.dot} ${className}`}
        style={{ backgroundColor: color }}
      />
    );
  }

  if (!showBackground) {
    return (
      <span className={`shrink-0 leading-none select-none ${currentSize.emoji} ${className}`}>
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`rounded-lg flex items-center justify-center shrink-0 shadow-xs border transition-transform duration-300 select-none ${currentSize.box} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}35`,
      }}
    >
      <span className={`${currentSize.emoji} leading-none`}>{icon}</span>
    </span>
  );
}
