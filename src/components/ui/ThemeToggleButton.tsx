
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';

export function ThemeToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder button for SSR and initial client render
    // This helps maintain layout consistency and avoids hydration errors.
    // The button is disabled as its functionality depends on the resolved theme.
    return <Button variant="ghost" size="icon" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      aria-label={resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {resolvedTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
