import { Bot, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

const DOMAINS = [
  { id: 'software-development', label: 'Software Development' },
  { id: 'placement-preparation', label: 'Placement Preparation' },
  { id: 'college-studies', label: 'College Studies' },
  { id: 'research', label: 'Research' },
  { id: 'business', label: 'Business' },
  { id: 'hr-recruitment', label: 'HR & Recruitment' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'legal', label: 'Legal' },
  { id: 'customer-support', label: 'Customer Support' },
  { id: 'general', label: 'General' },
];

const PERSONAS = [
  { id: 'senior-software-engineer', label: 'Senior Software Engineer' },
  { id: 'technical-architect', label: 'Technical Architect' },
  { id: 'recruiter', label: 'Recruiter' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'research-assistant', label: 'Research Assistant' },
  { id: 'product-manager', label: 'Product Manager' },
  { id: 'business-consultant', label: 'Business Consultant' },
];

const STYLES = [
  { id: 'concise', label: 'Concise' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'detailed', label: 'Detailed' },
];

const MODES = [
  { id: 'hybrid', label: 'Hybrid RAG' },
  { id: 'document-first', label: 'Document First' },
  { id: 'general-assistant', label: 'General Assistant' },
];

const CREATIVITY_LEVELS = [
  { id: 'low', label: 'Low (Precise)' },
  { id: 'medium', label: 'Medium (Balanced)' },
  { id: 'high', label: 'High (Creative)' },
];

const CAPABILITY_OPTIONS = [
  { id: 'codeReview', label: 'Code & Syntax Review' },
  { id: 'architectureReview', label: 'Architecture & Scalability' },
  { id: 'resumeReview', label: 'Resume & Strategy Review' },
  { id: 'documentQA', label: 'Document Q&A' },
  { id: 'careerCoaching', label: 'Career Guidance' },
  { id: 'brainstorming', label: 'Idea Brainstorming' },
];

export default function AIConfigStep({ value, onChange, disabled = false, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const config = value || {
    workspaceDomain: 'general',
    persona: 'mentor',
    responseStyle: 'balanced',
    defaultMode: 'hybrid',
    creativity: 'medium',
    additionalInstructions: '',
    capabilities: { documentQA: true, brainstorming: true },
  };

  const updateField = (field, fieldValue) => {
    onChange?.({
      ...config,
      [field]: fieldValue,
    });
  };

  const toggleCapability = (capId) => {
    const currentCaps = config.capabilities || {};
    updateField('capabilities', {
      ...currentCaps,
      [capId]: !currentCaps[capId],
    });
  };

  return (
    <div className="rounded-sm border-2 border-border bg-[#0f131b] p-3 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-aiPurple" strokeWidth={2.25} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-primaryText">
              Nexus AI Workspace Persona & Rules
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondaryText">
              {config.workspaceDomain} • {config.persona}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-aiPurple">
          <span>{expanded ? 'Hide' : 'Configure'}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
          {/* Domain & Persona */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
                Workspace Domain
              </label>
              <select
                className="brutal-input w-full text-xs"
                value={config.workspaceDomain}
                onChange={(e) => updateField('workspaceDomain', e.target.value)}
                disabled={disabled}
              >
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
                AI Persona / Role
              </label>
              <select
                className="brutal-input w-full text-xs"
                value={config.persona}
                onChange={(e) => updateField('persona', e.target.value)}
                disabled={disabled}
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Style & Mode */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
                Response Style
              </label>
              <select
                className="brutal-input w-full text-xs"
                value={config.responseStyle}
                onChange={(e) => updateField('responseStyle', e.target.value)}
                disabled={disabled}
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
                Primary Mode
              </label>
              <select
                className="brutal-input w-full text-xs"
                value={config.defaultMode}
                onChange={(e) => updateField('defaultMode', e.target.value)}
                disabled={disabled}
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
                Creativity
              </label>
              <select
                className="brutal-input w-full text-xs"
                value={config.creativity}
                onChange={(e) => updateField('creativity', e.target.value)}
                disabled={disabled}
              >
                {CREATIVITY_LEVELS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capabilities checkboxes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1.5">
              Allowed Capabilities
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CAPABILITY_OPTIONS.map((cap) => {
                const isChecked = Boolean(config.capabilities?.[cap.id]);
                return (
                  <label
                    key={cap.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-sm border px-2 py-1.5 text-[11px] font-bold uppercase transition-colors ${
                      isChecked
                        ? 'border-aiPurple bg-aiPurple/10 text-primaryText'
                        : 'border-border bg-background text-secondaryText'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCapability(cap.id)}
                      disabled={disabled}
                      className="accent-aiPurple"
                    />
                    <span className="truncate">{cap.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
              Custom Workspace Directives (Optional)
            </label>
            <textarea
              rows={2}
              className="brutal-input w-full text-xs resize-none"
              placeholder="e.g. Focus on scalable microservices backend architecture & interview preparation."
              value={config.additionalInstructions || ''}
              onChange={(e) => updateField('additionalInstructions', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
