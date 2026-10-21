import React from 'react';
import { Compass, BookOpen, FileText, Plus, Moon, Sun, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentRoute: 'home' | 'guide' | 'research' | 'job';
  onNavigate: (route: 'home' | 'research') => void;
  onOpenIntake: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenIntake,
  isDark = true,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90 focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-black shadow-sm font-bold">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm">
                  OAuth Launch Guide
                </span>
                <span className="hidden sm:inline-flex rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-sky-400">
                  for Composio
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation links & Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              currentRoute === 'home'
                ? 'bg-zinc-800/80 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('research')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              currentRoute === 'research'
                ? 'bg-zinc-800/80 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Research & Decisions</span>
            <span className="sm:hidden">Research</span>
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-zinc-400" />}
            </button>
          )}

          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-3 py-1.5 text-xs font-bold text-black transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Investigate App</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
