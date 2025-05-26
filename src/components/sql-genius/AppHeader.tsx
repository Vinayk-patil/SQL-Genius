"use client";

import { DatabaseZap } from 'lucide-react';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'; // Updated import path

export function AppHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <DatabaseZap className="h-7 w-7 text-primary mr-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            SQL <span className="text-primary">Genius</span>
          </h1>
        </div>
        <ThemeToggleButton />
      </div>
    </header>
  );
}
