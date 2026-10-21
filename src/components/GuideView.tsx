import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Building,
  Key,
  ShieldCheck,
  Info,
  BookOpen,
  Filter,
  Zap,
  Globe
} from 'lucide-react';
import { Guide, NextStepPack, GuideAssumptions, StartingPath } from '../types/client.js';
import { NextStepPackModal } from './NextStepPackModal.js';
import { createGuideVersion, fetchNextStepPack } from '../api/client.js';

interface GuideViewProps {
  guide: Guide;
  onBack: () => void;
  onVersionCreated: (newGuide: Guide) => void;
}

export const GuideView: React.FC<GuideViewProps> = ({
  guide,
  onBack,
  onVersionCreated,
}) => {
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [pack, setPack] = useState<NextStepPack | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'scopes' | 'checklist' | 'blockers' | 'evidence'>('overview');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [showAssumptionEditor, setShowAssumptionEditor] = useState(false);
  
  // Accordion state: first step open by default
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    [guide?.setupChecklist?.[0]?.id || 'step-0']: true,
  });

  const isManagedAvailable = !!(guide?.composioToolkitMatch?.found && guide?.composioToolkitMatch?.managedAuthAvailable === 'available');

  // User-selected path view override (defaults to guide recommendation, but user can click either card)
  const [selectedPathOverride, setSelectedPathOverride] = useState<StartingPath>(() => {
    if (!isManagedAvailable) return 'register_owned_app';
    return guide?.pathAssessment?.startingPath || 'composio_managed_suitable';
  });

  // Sync when guide changes
  useEffect(() => {
    if (!guide?.pathAssessment) return;
    if (!isManagedAvailable) {
      setSelectedPathOverride('register_owned_app');
    } else {
      setSelectedPathOverride(guide.pathAssessment.startingPath);
    }
    if (guide.setupChecklist?.[0]?.id) {
      setOpenAccordions({ [guide.setupChecklist[0].id]: true });
    }
  }, [guide?.id, guide?.pathAssessment?.startingPath, isManagedAvailable]);

  // Load local device progress
  useEffect(() => {
    if (!guide?.id) return;
    try {
      const stored = localStorage.getItem(`progress_${guide.id}`);
      if (stored) {
        setCompletedSteps(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [guide?.id]);

  const toggleStep = (stepId: string) => {
    const next = { ...completedSteps, [stepId]: !completedSteps[stepId] };
    setCompletedSteps(next);
    try {
      localStorage.setItem(`progress_${guide.id}`, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const toggleAccordion = (stepId: string) => {
    setOpenAccordions((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenPack = async () => {
    setLoadingPack(true);
    try {
      const data = await fetchNextStepPack(guide.id);
      setPack(data);
      setPackModalOpen(true);
    } catch (e) {
      console.error('Failed to load next-step pack:', e);
    } finally {
      setLoadingPack(false);
    }
  };

  const handleExportMarkdown = () => {
    const md = `# ${guide.providerName} OAuth Launch Guide (v${guide.version})
Starting Path: ${guide.pathAssessment.headline}
Use Case: ${guide.exampleUseCase}

## Path Assessment
${guide.pathAssessment.why}

## Key Metrics
- Developer Effort: ${guide.pathAssessment.developerEffort}
- External Waiting: ${guide.pathAssessment.externalWaiting}
- Can Start Testing: ${guide.pathAssessment.canStartTesting.status} (${guide.pathAssessment.canStartTesting.note})
- Launch Blocker: ${guide.pathAssessment.whatCouldBlockLaunch}

## Permissions & Scopes
${guide.permissionsTable.map(p => `- \`${p.permission}\`: ${p.whyNeeded} [${p.reviewImplication}]`).join('\n')}

## Setup Checklist
${guide.setupChecklist.map(s => `- [ ] ${s.action} (${s.owner}) - ${s.details || s.completionCondition}`).join('\n')}

## Blockers & Recovery
${guide.blockersAndRecovery.map(b => `- **${b.symptom}**: ${b.explanationOrHypothesis}\n  Next Action: ${b.nextAction}`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.slug}-guide-v${guide.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateAssumptions = async (updated: Partial<GuideAssumptions>) => {
    const newAssumptions: GuideAssumptions = {
      ...guide.pathAssessment.assumptions,
      ...updated,
    };
    try {
      const newGuide = await createGuideVersion(guide.id, newAssumptions);
      if (newGuide) {
        setShowAssumptionEditor(false);
        onVersionCreated(newGuide);
      }
    } catch (e) {
      console.error('Failed to create new version:', e);
    }
  };

  if (!guide || !guide.pathAssessment || !guide.id) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center gap-3 text-xs text-zinc-400 font-medium">
          <div className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <span>Loading guide details...</span>
        </div>
      </div>
    );
  }

  const pAssessment = guide.pathAssessment;
  const totalSteps = guide.setupChecklist?.length || 0;
  const completedCount = (guide.setupChecklist || []).filter(s => !!completedSteps[s.id]).length;

  const filteredSteps = (guide.setupChecklist || []).filter(s => {
    if (selectedOwnerFilter === 'all') return true;
    return s.owner === selectedOwnerFilter;
  });

  // Short BIG stats formatting with honest Unknown fallbacks
  const devEffortStr = pAssessment?.developerEffort || '';
  const shortEffort = devEffortStr.includes('15') || devEffortStr.includes('30')
    ? '15–30m'
    : devEffortStr.includes('1–2') || devEffortStr.includes('1-2')
    ? '1–2 hrs'
    : devEffortStr.includes('2–4') || devEffortStr.includes('2-4')
    ? '2–4 hrs'
    : devEffortStr.trim() ? devEffortStr.slice(0, 15) : 'Unknown';

  const extWaitStr = pAssessment?.externalWaiting || '';
  const shortWaiting = extWaitStr.toLowerCase().includes('zero') || extWaitStr.toLowerCase().includes('none')
    ? 'Instant'
    : extWaitStr.toLowerCase().includes('unknown') || extWaitStr.toLowerCase().includes('vary')
    ? 'Unknown'
    : extWaitStr.includes('weeks') || extWaitStr.includes('3')
    ? '3–6 wks'
    : extWaitStr.trim() ? extWaitStr.slice(0, 14) : 'Unknown';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 text-zinc-200">
      {/* Top back & actions bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#121522] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition shadow-sm"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-sky-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#121522] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition shadow-sm"
            title="Download clean Markdown summary"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleOpenPack}
            disabled={loadingPack}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-3.5 py-1.5 text-xs font-bold text-black transition shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-black" />
            <span>{loadingPack ? 'Loading...' : 'Prepare Next-Step Pack'}</span>
          </button>
        </div>
      </div>

      {/* Guide Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-[#10131d] p-5 shadow-lg mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{guide.providerName}</h1>
              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                v{guide.version}
              </span>
              {guide.providerWebsite && (
                <a
                  href={guide.providerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                >
                  <span>{guide.providerWebsite.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                pAssessment.startingPath === 'composio_managed_suitable'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {pAssessment.startingPath === 'composio_managed_suitable' && 'Composio-Managed Suitable'}
                {pAssessment.startingPath === 'register_owned_app' && 'Owned Provider App Advised'}
                {pAssessment.startingPath === 'provider_not_found_in_composio' && 'Custom Provider App'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              Intended Use: <span className="text-zinc-200 font-medium">"{guide.exampleUseCase || guide.pathAssessment?.assumptions?.intendedActions || 'Integration actions'}"</span>
            </p>
          </div>

          <button
            onClick={() => setShowAssumptionEditor(!showAssumptionEditor)}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 self-start sm:self-auto underline"
          >
            {showAssumptionEditor ? 'Hide Assumptions' : `Tweak Assumptions (Creates v${guide.version + 1})`}
          </button>
        </div>

        {/* Inline Assumption Editor Drawer */}
        {showAssumptionEditor && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#0b0e17] p-3.5 rounded-xl border border-zinc-800">
            <div>
              <span className="block font-semibold text-zinc-300 mb-1">Target Audience</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ audience: 'external_customers' })}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    pAssessment.assumptions?.audience === 'external_customers'
                      ? 'bg-sky-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  External Users
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ audience: 'team_only' })}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    pAssessment.assumptions?.audience === 'team_only'
                      ? 'bg-sky-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Team Only
                </button>
              </div>
            </div>

            <div>
              <span className="block font-semibold text-zinc-300 mb-1">Custom Brand Consent</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ customBrandingRequired: true })}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    pAssessment.assumptions?.customBrandingRequired
                      ? 'bg-sky-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Required (Owned)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ customBrandingRequired: false })}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    !pAssessment.assumptions?.customBrandingRequired
                      ? 'bg-sky-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Composio OK
                </button>
              </div>
            </div>

            <div>
              <span className="block font-semibold text-zinc-300 mb-1">Assumption Persistence</span>
              <p className="text-[11px] text-zinc-500 mt-1">
                Saving updates creates an explicit, versioned guide branch on disk.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hero: ONE NEXT ACTION (Prompt 6: "one next action") */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-[#0c1a2f] via-[#0e1728] to-[#121522] p-4 sm:p-5 mb-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-black font-bold mt-0.5">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block mb-0.5">
                Your Next Action
              </span>
              <p className="text-sm font-semibold text-white leading-snug">
                {pAssessment.myNextAction || 'Review setup steps below'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenPack}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-bold text-black transition shrink-0 shadow-md"
          >
            <span>Prepare Action Pack</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BIG Short Effort/Wait Values (Prompt 6: "BIG short effort/wait values (Unknown if unsourced)") */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Developer Effort */}
        <div className="rounded-xl border border-zinc-800 bg-[#121522] p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Setup Effort
          </span>
          <div className="text-2xl font-black text-white tracking-tight">
            {shortEffort}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 truncate" title={pAssessment.developerEffort}>
            {pAssessment.developerEffort || 'Unknown developer effort'}
          </p>
        </div>

        {/* External Waiting */}
        <div className="rounded-xl border border-zinc-800 bg-[#121522] p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            External Waiting
          </span>
          <div className="text-2xl font-black text-sky-400 tracking-tight">
            {shortWaiting}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 truncate" title={pAssessment.externalWaiting}>
            {pAssessment.externalWaiting || 'Unknown waiting time'}
          </p>
        </div>

        {/* Can I start testing? */}
        <div className="rounded-xl border border-zinc-800 bg-[#121522] p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Can I test now?
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" />
            <span className="capitalize">{(pAssessment.canStartTesting?.status || 'yes').replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 truncate" title={pAssessment.canStartTesting?.note}>
            {pAssessment.canStartTesting?.note || 'Testing status'}
          </p>
        </div>

        {/* Launch Blocker */}
        <div className="rounded-xl border border-zinc-800 bg-[#121522] p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Launch Risk
          </span>
          <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-1 line-clamp-1">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="truncate">{(pAssessment.whatCouldBlockLaunch || 'None identified').split(';')[0]}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2" title={pAssessment.whatCouldBlockLaunch}>
            {pAssessment.whatCouldBlockLaunch || 'None identified'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 gap-1 mb-5 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: '1. Path & Fit' },
          { id: 'scopes', label: '2. Scopes & Access' },
          { id: 'checklist', label: `3. Checklist (${completedCount}/${totalSteps})` },
          { id: 'blockers', label: '4. Blockers & Fixes' },
          { id: 'evidence', label: '5. Evidence & Sources' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-sky-400 text-sky-400 font-bold bg-sky-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Path & Fit Comparison (User Request: "recommended composio" + "we want to make for composio") */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#10131d] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">Recommended Path Rationale</h2>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{pAssessment.why || 'Path assessment rationale based on provider integration requirements.'}</p>
          </div>

          {/* Side by side comparison: COMPOSIO RECOMMENDED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Card 1: Composio-Managed OAuth */}
            {isManagedAvailable ? (
              <div 
                onClick={() => setSelectedPathOverride('composio_managed_suitable')}
                className={`rounded-2xl border p-5 transition cursor-pointer relative ${
                  selectedPathOverride === 'composio_managed_suitable'
                    ? 'border-sky-500/80 bg-gradient-to-b from-[#0e1a2f] to-[#111624] ring-1 ring-sky-500/50 shadow-lg'
                    : 'border-zinc-800 bg-[#10131d] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Composio-Managed OAuth</span>
                  <span className="rounded-full bg-sky-500 text-black px-2.5 py-0.5 text-[10px] font-black tracking-wide uppercase shadow-sm">
                    Recommended for Composio
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  Zero developer app registration. Fastest path to test your AI agent.
                </p>
                <ul className="space-y-2 text-zinc-300 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Instant sandbox connection (no developer app needed)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Automatic token encryption & refresh managed by Composio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Pre-approved scopes for rapid agent prototyping</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <span className="text-zinc-500 font-bold">✕</span>
                    <span>Displays "Composio" on user consent screen</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <span className="text-zinc-500 font-bold">✕</span>
                    <span>Shared rate limits with other platform developers</span>
                  </li>
                </ul>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-sky-400 font-semibold">
                    {selectedPathOverride === 'composio_managed_suitable' ? 'Active Selected Path' : 'Click to select this path'}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">Fastest</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-[#0d0f17] p-5 opacity-60 cursor-not-allowed relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-zinc-400 text-sm">Composio-Managed OAuth</span>
                  <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    Not Available
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-3">
                  {!guide.composioToolkitMatch?.found 
                    ? `No pre-built Composio toolkit exists for ${guide.providerName}.`
                    : `Composio documentation explicitly notes managed OAuth is not provided for ${guide.providerName}.`}
                </p>
                <div className="rounded-lg bg-zinc-900/80 p-3 text-[11px] text-zinc-400 border border-zinc-800 mb-3">
                  <p>
                    {!guide.composioToolkitMatch?.found
                      ? `Direct provider OAuth integration is required. Register an app in ${guide.providerName}'s developer portal.`
                      : `You must create your own OAuth app in ${guide.providerName}'s developer portal and configure custom credentials in Composio.`}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Disabled for this provider</span>
                  <span className="font-mono text-[10px]">Direct App Required</span>
                </div>
              </div>
            )}

            {/* Card 2: Owned Provider OAuth App */}
            <div 
              onClick={() => setSelectedPathOverride('register_owned_app')}
              className={`rounded-2xl border p-5 transition cursor-pointer relative ${
                selectedPathOverride === 'register_owned_app' || !isManagedAvailable
                  ? 'border-purple-500/80 bg-gradient-to-b from-[#1b122e] to-[#121320] ring-1 ring-purple-500/50 shadow-lg'
                  : 'border-zinc-800 bg-[#10131d] hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">Owned Provider OAuth App</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  !isManagedAvailable 
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}>
                  {!isManagedAvailable ? 'Required for this Provider' : 'For Custom Branding'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">
                Register in provider portal; connect credentials via Composio Custom Auth.
              </p>
              <ul className="space-y-2 text-zinc-300 text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Your brand logo & name on customer consent screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Dedicated API rate limits & quotas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Full control over redirect URIs and scopes</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-zinc-500 font-bold">✕</span>
                  <span>Requires portal registration & possible verification</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-zinc-500 font-bold">✕</span>
                  <span>Subject to provider review queues before external rollout</span>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-purple-400 font-semibold">
                  {selectedPathOverride === 'register_owned_app' || !isManagedAvailable ? 'Active Selected Path' : 'Click to select this path'}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">Dedicated</span>
              </div>
            </div>
          </div>

          {/* Composio Toolkit Details */}
          {guide.composioToolkitMatch ? (
            <div className="rounded-xl border border-zinc-800 bg-[#0c101a] p-4 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white block">
                  Composio Toolkit Match: {guide.composioToolkitMatch.name || `${guide.providerName} Toolkit`}
                </span>
                {guide.composioToolkitMatch.docUrl && (
                  <a
                    href={guide.composioToolkitMatch.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Composio Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-zinc-400 text-[11px] mb-2">
                Auth scheme: <strong className="text-zinc-200">{guide.composioToolkitMatch.relevantAuthMethod || 'OAuth 2.0'}</strong> | Status: <strong className="text-zinc-200">{guide.composioToolkitMatch.metadataStatus || 'documentation_checked'}</strong>
              </p>
              {guide.composioToolkitMatch.limitationsDocumented && guide.composioToolkitMatch.limitationsDocumented.length > 0 && (
                <ul className="space-y-1 text-zinc-400 text-[11px]">
                  {guide.composioToolkitMatch.limitationsDocumented.map((l, i) => (
                    <li key={i}>• {l}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-[#0c101a] p-4 text-xs">
              <span className="font-bold text-zinc-300 block mb-1">
                Composio Toolkit: Direct Provider OAuth
              </span>
              <p className="text-zinc-400 text-[11px]">
                No pre-built Composio toolkit catalog entry identified for {guide.providerName}. Connect via custom actions or generic OAuth 2.0 configuration.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Scopes & Permissions */}
      {activeTab === 'scopes' && (
        <div className="rounded-xl border border-zinc-800 bg-[#10131d] overflow-hidden shadow-sm text-xs">
          <div className="p-3 border-b border-zinc-800 bg-[#0d1018] flex items-center justify-between text-zinc-400">
            <span>Granular scope mapping for requested actions</span>
            <span className="text-[11px] text-sky-400 font-mono">{guide.permissionsTable.length} Scopes Mapped</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0b0e17] border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Feature</th>
                <th className="py-2.5 px-3 font-semibold">Scope Name</th>
                <th className="py-2.5 px-3 font-semibold">Why Needed</th>
                <th className="py-2.5 px-3 font-semibold">Review Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {guide.permissionsTable.map((p, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-3 font-medium text-white">{p.feature}</td>
                  <td className="py-3 px-3">
                    <code className="font-mono text-[11px] bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-sky-300">
                      {p.permission}
                    </code>
                  </td>
                  <td className="py-3 px-3 leading-relaxed text-zinc-400">{p.whyNeeded}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.reviewImplication.includes('Restricted')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : p.reviewImplication.includes('Sensitive')
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {p.reviewImplication}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Numbered Setup Accordions (Prompt 6: "Numbered setup accordions, details closed; first step open") */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#10131d] border border-zinc-800 p-3.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Setup Progress:</span>
              <span className="text-zinc-400">{completedCount} of {totalSteps} steps marked on this device</span>
              <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-sky-400 transition-all duration-300" 
                  style={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={selectedOwnerFilter}
                onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                className="bg-[#0b0e17] border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Action Owners</option>
                <option value="developer">Developer Actions</option>
                <option value="agent">Agent Actions</option>
                <option value="provider_reviewer">Provider Reviewer</option>
                <option value="customer_admin">Customer Admin</option>
              </select>
            </div>
          </div>

          {/* Accordion Steps List */}
          <div className="space-y-2">
            {filteredSteps.map((step, idx) => {
              const isOpen = !!openAccordions[step.id];
              const isDone = !!completedSteps[step.id];

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    isDone 
                      ? 'border-emerald-500/30 bg-[#0d1612]' 
                      : isOpen 
                      ? 'border-sky-500/50 bg-[#121522]' 
                      : 'border-zinc-800 bg-[#10131d] hover:border-zinc-700'
                  }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleAccordion(step.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.id);
                        }}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                            : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500'
                        }`}
                        title="Mark complete on this machine"
                      >
                        {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>

                      {/* Number and Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          Step {idx + 1}
                        </span>
                        <span className={`text-xs font-bold ${isDone ? 'text-zinc-400 line-through' : 'text-white'}`}>
                          {step.action}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700 hidden sm:inline">
                        {step.owner}
                      </span>
                      {step.estimate?.duration && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {step.estimate.duration}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Body (Details closed by default; first step open) */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 text-xs space-y-2 text-zinc-300 bg-[#0d101a]/50">
                      {step.details && (
                        <p className="leading-relaxed text-zinc-300 font-sans">{step.details}</p>
                      )}
                      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400">
                        <strong className="text-zinc-200">Completion Condition:</strong> {step.completionCondition}
                      </div>
                      {step.prerequisites && step.prerequisites.length > 0 && (
                        <div className="text-[10px] text-zinc-500">
                          Prerequisites: {step.prerequisites.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Blockers & Fixes */}
      {activeTab === 'blockers' && (
        <div className="space-y-3">
          {guide.blockersAndRecovery.map((b, idx) => (
            <div key={idx} className="rounded-xl border border-zinc-800 bg-[#10131d] p-4 text-xs shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{b.symptom}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">{b.explanationOrHypothesis}</p>
              
              <div className="p-3 rounded-lg bg-[#0b0e17] border border-zinc-800 space-y-1.5 text-[11px]">
                <div className="text-sky-300">
                  <strong>Recommended Recovery:</strong> {b.nextAction}
                </div>
                {b.humanHandoff && (
                  <div className="text-zinc-400">
                    <strong>Human Action Needed:</strong> {b.humanHandoff}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Evidence & Sources */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#10131d] p-4 text-xs">
            <h3 className="font-bold text-white mb-2">Verified Sourced Citations</h3>
            <div className="divide-y divide-zinc-800/80">
              {guide.sources.map((s) => (
                <div key={s.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <a
                      href={s.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>{s.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {s.summary && <p className="text-zinc-400 text-[11px] mt-0.5">{s.summary}</p>}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 shrink-0 uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    {s.sourceType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {guide.claims && guide.claims.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-[#10131d] p-4 text-xs">
              <h3 className="font-bold text-white mb-2">Consequential Claims Audit</h3>
              <div className="space-y-2">
                {guide.claims.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-[#0b0e17] border border-zinc-800">
                    <p className="font-medium text-zinc-200">"{c.statement}"</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>Evidence: <strong className="text-zinc-300">{c.evidenceClass}</strong></span>
                      <span>•</span>
                      <span>Applies to: {c.applicability}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Step Pack Modal */}
      {pack && (
        <NextStepPackModal
          pack={pack}
          guide={guide}
          isOpen={packModalOpen}
          onClose={() => setPackModalOpen(false)}
        />
      )}
    </div>
  );
};
