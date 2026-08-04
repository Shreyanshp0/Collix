import { ShieldAlert, CheckCircle2, XCircle, Lock, AlertTriangle } from 'lucide-react';

const CAPABILITY_LABELS = {
  CODE_REVIEW: 'Code & Syntax Review',
  ARCHITECTURE_REVIEW: 'Architecture & Scalability Review',
  RESUME_REVIEW: 'Resume & Strategy Review',
  CAREER_GUIDANCE: 'Career Guidance & Advice',
  DOCUMENT_QA: 'Document Q&A',
  IDEA_BRAINSTORMING: 'Idea Brainstorming',
};

const RISK_BADGES = {
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function CapabilityDeniedCard({ data }) {
  if (!data) return null;

  const requiredCapKey = data.requiredCapability || 'CODE_REVIEW';
  const requiredLabel = CAPABILITY_LABELS[requiredCapKey] || requiredCapKey;
  const riskTier = data.risk || 'CRITICAL';
  const riskBadgeStyle = RISK_BADGES[riskTier] || RISK_BADGES.CRITICAL;

  const enabledCaps = Array.isArray(data.enabledCapabilities) ? data.enabledCapabilities : ['DOCUMENT_QA', 'IDEA_BRAINSTORMING'];
  const blockedCaps = Array.isArray(data.blockedCapabilities) ? data.blockedCapabilities : ['CODE_REVIEW', 'ARCHITECTURE_REVIEW'];

  return (
    <div className="my-3 w-full max-w-xl overflow-hidden rounded-md border-2 border-rose-500/40 bg-[#120f1a] p-4 shadow-lg shadow-rose-950/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-rose-500/50 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.14em] text-rose-400">
              Request Blocked • Workspace Policy
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondaryText">
              Backend Authorization Guard • 0 Tokens Consumed
            </p>
          </div>
        </div>
        <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${riskBadgeStyle}`}>
          {riskTier} Risk
        </span>
      </div>

      {/* Main Details Grid */}
      <div className="mt-3.5 space-y-3">
        {/* Requested Capability Section */}
        <div className="rounded-sm border border-border/80 bg-[#0a0812] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText">
              Requested Capability
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-400">
              <XCircle className="h-3.5 w-3.5" /> ✗ Blocked
            </span>
          </div>
          <p className="mt-1 text-sm font-black uppercase text-primaryText">{requiredLabel}</p>
          <p className="mt-0.5 text-[11px] text-secondaryText">
            <span className="font-bold text-rose-400">Reason:</span> Disabled by Workspace Administrator
          </p>
        </div>

        {/* Workspace Capability Status comparison */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Currently Allowed */}
          <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Workspace Currently Allows
            </p>
            <ul className="space-y-1">
              {enabledCaps.map((cap) => (
                <li key={cap} className="flex items-center gap-1.5 text-[11px] font-bold text-primaryText">
                  <span className="text-emerald-400">✓</span> {CAPABILITY_LABELS[cap] || cap}
                </li>
              ))}
            </ul>
          </div>

          {/* Blocked Capabilities */}
          <div className="rounded-sm border border-rose-500/20 bg-rose-500/5 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-400 mb-1.5 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Blocked Capabilities
            </p>
            <ul className="space-y-1">
              {blockedCaps.slice(0, 4).map((cap) => (
                <li key={cap} className="flex items-center gap-1.5 text-[11px] font-bold text-secondaryText">
                  <span className="text-rose-400">✗</span> {CAPABILITY_LABELS[cap] || cap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="mt-3 flex items-center gap-2 rounded-sm border border-border/50 bg-[#090710] px-3 py-2 text-[11px] text-secondaryText">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>Contact your workspace administrator to enable {requiredLabel} for this group.</span>
      </div>
    </div>
  );
}
