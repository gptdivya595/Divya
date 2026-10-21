import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, ChevronLeft, ChevronRight, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { GuideSummary } from '../types/client.js';

interface GuidesCarouselProps {
  guides: GuideSummary[];
  onOpenGuide: (id: string) => void;
  onNavigateToResearch?: () => void;
}

export const GuidesCarousel: React.FC<GuidesCarouselProps> = ({
  guides,
  onOpenGuide,
  onNavigateToResearch,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const filteredGuides = guides.filter((g) =>
    g.providerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    g.exampleUseCase.toLowerCase().includes(filterQuery.toLowerCase()) ||
    g.startingPath.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const CAROUSEL_SIZE = 3;
  const maxIndex = Math.max(0, Math.ceil(filteredGuides.length / CAROUSEL_SIZE) - 1);

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const currentGuides = filteredGuides.slice(
    carouselIndex * CAROUSEL_SIZE,
    carouselIndex * CAROUSEL_SIZE + CAROUSEL_SIZE
  );

  return (
    <div className="w-full mt-6 pt-5 border-t border-zinc-800/80">
      {/* Directory Header with Search & Carousel Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Researched Provider Guides Directory
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verified scopes, Composio-managed compatibility, and approval queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Input */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value);
                setCarouselIndex(0);
              }}
              placeholder="Filter guides..."
              className="w-full rounded-xl border border-zinc-800 bg-[#090c14] pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/70 transition shadow-inner"
            />
          </div>

          {/* Carousel Arrows */}
          {filteredGuides.length > CAROUSEL_SIZE && (
            <div className="flex items-center gap-1.5 shrink-0 bg-[#090c14] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Previous guides"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono text-zinc-500 px-1">
                {carouselIndex + 1}/{maxIndex + 1}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Next guides"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Carousel Boxes Visible */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#0d101a] p-8 text-center text-xs text-zinc-400">
          No provider guides matching "{filterQuery}". Use the search bar above to launch real-time research.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentGuides.map((g) => {
            const isComposioManaged = g.startingPath === 'composio_managed_suitable';
            const isOwnedApp = g.startingPath === 'register_owned_app';

            return (
              <div
                key={g.id}
                className="rounded-xl border border-zinc-800/90 bg-[#10131d] p-3.5 sm:p-4 flex flex-col justify-between hover:border-zinc-700 hover:shadow-lg transition group duration-150"
              >
                <div>
                  {/* Top line: Name & Version */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                      {g.providerName}
                    </h3>
                    <span className="font-mono text-[9px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50 shrink-0">
                      v{g.version}
                    </span>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="mb-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                        isComposioManaged
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : isOwnedApp
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isComposioManaged && 'Composio-Managed Suitable'}
                      {isOwnedApp && 'Owned App Advised'}
                      {!isComposioManaged && !isOwnedApp && 'Custom Provider App'}
                    </span>
                  </div>

                  {/* Use Case Brief */}
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                    {g.exampleUseCase}
                  </p>

                  {/* Wait Time Breakdown Box - compact with 2-line clamp */}
                  <div className="rounded-lg border border-zinc-800/80 bg-[#0a0d16] p-2 text-[11px] text-zinc-300 mb-2.5 leading-snug">
                    <span className="font-semibold text-zinc-400">Wait: </span>
                    <span className="text-zinc-300 line-clamp-2" title={g.externalWaiting}>{g.externalWaiting}</span>
                  </div>
                </div>

                {/* Bottom Card Footer: Effort & Action Button */}
                <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-zinc-500 truncate">
                    {g.developerEffort ? (
                      <>Effort: <span className="text-zinc-300 font-medium">{g.developerEffort.replace(/for [^;]+/g, '').trim()}</span></>
                    ) : (
                      <span className="text-zinc-400 font-medium">Ready</span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenGuide(g.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-850 hover:bg-zinc-750 px-2.5 py-1 text-[11px] font-semibold text-white transition shadow-sm hover:border-sky-500/50 group-hover:bg-zinc-700 shrink-0"
                  >
                    <span>View Guide</span>
                    <ArrowRight className="h-3 w-3 text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rationale and Docs link */}
      {onNavigateToResearch && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 px-1">
          <span>Sourced from official provider policies & Composio developer standards</span>
          <button
            onClick={onNavigateToResearch}
            className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 transition"
          >
            <span>View Research Decisions & Evidence</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
