import React, { useState } from 'react';
import { 
  Sparkles, 
  Sliders,
  Search,
  ArrowRight
} from 'lucide-react';
import { GuideSummary, GuideAssumptions } from '../types/client.js';
import { IntakeForm } from './IntakeForm.js';
import { ChatAssistant } from './ChatAssistant.js';
import { GuidesCarousel } from './GuidesCarousel.js';

interface HomeProps {
  guides: GuideSummary[];
  onOpenGuide: (id: string) => void;
  onStartSearch: (provider: string) => void;
  onNavigateToResearch: () => void;
  onSubmitIntake?: (provider: string, website: string, assumptions: GuideAssumptions) => void;
}

export const Home: React.FC<HomeProps> = ({
  guides,
  onOpenGuide,
  onStartSearch,
  onNavigateToResearch,
  onSubmitIntake,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_assist'>('manual');
  const [selectedProviderHint, setSelectedProviderHint] = useState<string>('');

  const handleFormSubmit = (provider: string, website: string, assumptions: GuideAssumptions) => {
    if (onSubmitIntake) {
      onSubmitIntake(provider, website, assumptions);
    } else {
      onStartSearch(provider);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 text-zinc-200">
      {/* Top Banner / Hero matching composio.dev developer toolkit */}
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-[11px] font-semibold text-sky-400 shadow-sm mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Composio Developer Toolkit</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Find your OAuth path to launch.
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Determine whether Composio-managed OAuth fits your use case, or get an owned-app setup & verification guide.
        </p>
      </div>

      {/* Mode Switcher Tabs: "Manual vs AI Assist" just below hero */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center rounded-xl bg-[#0e121d] border border-zinc-800 p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'manual'
                ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_assist')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'ai_assist'
                ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Manual Intake Form (Main Landing Page) */}
      {activeTab === 'manual' && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
          <IntakeForm
            initialProvider={selectedProviderHint}
            onSubmit={handleFormSubmit}
            onSelectPreset={(p) => setSelectedProviderHint(p)}
          />
        </div>
      )}

      {/* Tab 2: AI Assist (OAuth Launch Assistant Chat) */}
      {activeTab === 'ai_assist' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-200">
          <ChatAssistant
            onOpenGuide={onOpenGuide}
            onOpenIntake={(hint) => {
              setSelectedProviderHint(hint || '');
              setActiveTab('manual');
            }}
          />
        </div>
      )}

      {/* Visible Bottom Carousel: Three Carousel Boxes */}
      <GuidesCarousel
        guides={guides}
        onOpenGuide={onOpenGuide}
        onNavigateToResearch={onNavigateToResearch}
      />
    </div>
  );
};
