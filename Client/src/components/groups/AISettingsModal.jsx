import { Bot, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import groupsApi from '../../api/groups.api.js';
import Modal from '../shared/Modal.jsx';
import AIConfigStep from './AIConfigStep.jsx';

export default function AISettingsModal({ isOpen, onClose, groupId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState(null);
  const [promptTemplate, setPromptTemplate] = useState(null);

  const fetchAIConfig = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await groupsApi.getAIConfig(groupId);
      const data = res.data || res;
      setAiConfig(data.aiConfiguration || {});
      setPromptTemplate(data.promptTemplate || null);
    } catch (err) {
      console.error('Failed to fetch AI Config:', err);
      toast.error('Failed to load AI Workspace configuration.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchAIConfig();
    }
  }, [isOpen, groupId, fetchAIConfig]);

  const handleSaveConfig = async () => {
    if (!groupId || !aiConfig) return;
    setSaving(true);
    try {
      const res = await groupsApi.updateAIConfig(groupId, aiConfig);
      const data = res.data || res;
      setPromptTemplate(data.promptTemplate || null);
      toast.success('Workspace AI configuration saved & prompt updated!');
      onClose?.();
    } catch (err) {
      console.error('Failed to save AI config:', err);
      const message = err.response?.data?.message || err.message || 'Failed to save configuration';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      sectionLabel="WORKSPACE AI SETTINGS"
      title="Nexus AI Workspace Configuration"
      subtitle="Customize persona, instructions, and preview compiled system prompt"
    >
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs font-bold uppercase tracking-[0.12em] text-secondaryText">
          Loading AI Workspace settings...
        </div>
      ) : (
        <div className="space-y-4">
          <AIConfigStep value={aiConfig} onChange={setAiConfig} disabled={saving} defaultExpanded={true} />

          {/* Compiled Workspace Prompt Preview */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-presenceGreen" />
                <span className="text-xs font-black uppercase tracking-[0.12em] text-primaryText">
                  Compiled Workspace Prompt Preview
                </span>
              </div>
              {promptTemplate?.fingerprint && (
                <span className="text-[9px] font-mono text-secondaryText">
                  FP: {promptTemplate.fingerprint.substring(0, 12)}...
                </span>
              )}
            </div>

            <pre className="max-h-44 overflow-y-auto rounded-sm border border-border/40 bg-background p-2.5 text-[11px] font-mono text-secondaryText leading-relaxed whitespace-pre-wrap">
              {promptTemplate?.compiledPrompt || 'No compiled prompt available yet.'}
            </pre>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.08em]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="brutal-button flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save & Update AI'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
