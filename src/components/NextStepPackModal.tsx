import React, { useState } from 'react';
import { X, Copy, Check, Download, AlertTriangle, ShieldCheck, Sparkles, FileText, Terminal, Globe, ExternalLink } from 'lucide-react';
import { NextStepPack, Guide } from '../types/client.js';

interface NextStepPackModalProps {
  pack: NextStepPack;
  guide: Guide;
  isOpen: boolean;
  onClose: () => void;
}

export const NextStepPackModal: React.FC<NextStepPackModalProps> = ({
  pack,
  guide,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const mcpUrl = 'https://connect.composio.dev/mcp';
  const cliCommand = `npx composio-core add ${guide.slug}`;

  const fullMarkdown = `# ${pack.title}
*Generated on ${new Date(pack.generatedAt).toLocaleDateString()} for ${guide.providerName}*

## Summary
${pack.summary}

## Composio Connect & Agent Plugins Setup
- Shared Composio MCP URL: \`${mcpUrl}\`
- Agent CLI Setup: \`${cliCommand}\`
- Integration Model: ${pack.pathType === 'managed' ? 'Composio-Managed OAuth (instant, pre-configured scopes)' : 'Owned Provider OAuth Client (custom branding)'}

${pack.sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n')}

${pack.draftPermissionJustification ? `## Draft Permission Justification\n> ${pack.draftPermissionJustification}\n` : ''}

${pack.demoWalkthroughOutline ? `## Demo Walkthrough Video Outline\n${pack.demoWalkthroughOutline}\n` : ''}

${pack.reviewerInstructionsTemplate ? `## Reviewer Test Account Instructions Template\n\`\`\`\n${pack.reviewerInstructionsTemplate}\n\`\`\`\n` : ''}

## Warnings & Disclaimers
${pack.warningsAndDisclaimers.map((w) => `- ${w}`).join('\n')}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.slug}-next-step-pack.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    ...pack.sections.map((s, idx) => ({ id: idx, title: s.title, type: 'section' })),
    { id: pack.sections.length, title: 'Composio Connect & Plugins', type: 'connect' },
    ...(pack.draftPermissionJustification ? [{ id: pack.sections.length + 1, title: 'Scope Justification', type: 'justification' }] : []),
    ...(pack.reviewerInstructionsTemplate ? [{ id: pack.sections.length + 2, title: 'Reviewer Instructions', type: 'instructions' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-3xl rounded-2xl bg-[#10131d] border border-zinc-800 shadow-2xl my-8 flex flex-col max-h-[90vh] text-zinc-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800 shrink-0 bg-[#0d1018]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                Action Pack
              </span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                {pack.pathType === 'managed' ? 'Composio Managed Path' : 'Owned Provider App Path'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">
              {pack.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Copy-pasteable setup checklists, Composio Connect MCP endpoints, and draft justifications.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body with tabs */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Disclaimer Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Developer Review Required</p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                Draft justifications and walkthrough outlines are templates generated from official guidelines. Always review before submitting to providers. This tool does not collect secrets or submit external forms.
              </p>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-1 text-xs font-medium">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 border-b-2 whitespace-nowrap transition ${
                  activeTab === t.id
                    ? 'border-sky-400 text-sky-400 font-bold bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="rounded-xl border border-zinc-800 bg-[#0c101a] p-4 text-xs">
            {/* Section content */}
            {activeTab < pack.sections.length && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {pack.sections[activeTab].title}
                </h3>
                <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans">
                  {pack.sections[activeTab].content}
                </div>
              </div>
            )}

            {/* Composio Connect & Agent Plugins Tab */}
            {activeTab === pack.sections.length && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Composio Connect & Agent Plugins</h3>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Composio provides a unified <strong>Model Context Protocol (MCP) server</strong> and native <strong>Agent Plugins</strong> so your AI agent can discover tools, trigger user authorization links on the fly, and execute actions across 1000+ apps without custom token storage code.
                </p>

                {/* MCP Endpoint Box */}
                <div className="p-3 rounded-xl bg-[#121522] border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">1. Composio Connect (MCP Server URL)</span>
                    <a
                      href="https://docs.composio.dev/docs/composio-connect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Add this MCP URL to your client (Cursor, Claude Code, Codex, Windsurf, or LangChain):
                  </p>
                  <div className="flex items-center justify-between bg-black/60 border border-zinc-700/80 rounded px-3 py-2 font-mono text-sky-300">
                    <span>{mcpUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mcpUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-zinc-400 hover:text-white transition text-xs"
                      title="Copy MCP URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* CLI Setup Box */}
                <div className="p-3 rounded-xl bg-[#121522] border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">2. Agent Plugin CLI Setup</span>
                    <a
                      href="https://docs.composio.dev/docs/agent-plugins"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Agent Plugins Standard</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Install toolkit integration directly into your agent runtime via Composio CLI:
                  </p>
                  <div className="flex items-center justify-between bg-black/60 border border-zinc-700/80 rounded px-3 py-2 font-mono text-emerald-300">
                    <span>{cliCommand}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cliCommand);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-zinc-400 hover:text-white transition text-xs"
                      title="Copy CLI command"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scope justification tab */}
            {pack.draftPermissionJustification && activeTab === pack.sections.length + 1 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Draft Permission Justification</h3>
                <blockquote className="p-3 rounded-lg bg-[#121522] border-l-2 border-sky-400 text-zinc-300 leading-relaxed font-sans italic">
                  "{pack.draftPermissionJustification}"
                </blockquote>
                <p className="mt-3 text-[11px] text-zinc-400">
                  Submit this explanation during developer portal app registration or scope review questionnaires.
                </p>
              </div>
            )}

            {/* Reviewer instructions tab */}
            {pack.reviewerInstructionsTemplate && activeTab === pack.sections.length + 2 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Reviewer Test Account Instructions</h3>
                <pre className="p-3 rounded-lg bg-black/60 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                  {pack.reviewerInstructionsTemplate}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-[#0d1018] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-sky-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy All Markdown'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Download .md</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-bold text-black transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
