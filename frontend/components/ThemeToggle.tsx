"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ border: '1px solid var(--border)', backgroundColor: 'transparent' }}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? "☀️" : "🌙"}
        </button>
    );
}
