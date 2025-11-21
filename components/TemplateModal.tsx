
import React, { useState, useMemo } from 'react';
import { X, LayoutTemplate, Send, Globe, Plus, Save, ArrowLeft, MessageSquareDashed } from 'lucide-react';
import { CustomTemplate } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (templateName: string, lang: string, variables: string[]) => void;
  customTemplates: CustomTemplate[];
  onSaveTemplate: (template: CustomTemplate) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSend, customTemplates, onSaveTemplate }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'fill'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  
  // Form State for Creating
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newLang, setNewLang] = useState('en_US');

  // Form State for Filling Variables
  const [variableValues, setVariableValues] = useState<string[]>([]);

  // We prioritise passed templates (real ones) over emptiness
  const allTemplates = customTemplates;

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setMode('create');
    setNewName('');
    setNewBody('');
  };

  const handleSaveNew = () => {
    if (!newName || !newBody) return;
    
    const matches = newBody.match(/{{(\d+)}}/g);
    const count = matches ? new Set(matches).size : 0;

    const newT: CustomTemplate = {
        id: Date.now().toString(),
        name: newName.toLowerCase().replace(/\s+/g, '_'),
        language: newLang,
        category: 'MARKETING',
        body: newBody,
        variableCount: count,
        status: 'APPROVED',
        components: [{ type: 'BODY', text: newBody }]
    };

    onSaveTemplate(newT);
    setMode('select');
  };

  const handleSelect = (t: CustomTemplate) => {
    setSelectedTemplate(t);
    if (t.variableCount > 0) {
        setVariableValues(Array(t.variableCount).fill(''));
        setMode('fill');
    } else {
        setMode('fill');
    }
  };

  const handleSendFinal = () => {
    if (!selectedTemplate) return;
    onSend(selectedTemplate.name, selectedTemplate.language, variableValues);
    setMode('select');
    setSelectedTemplate(null);
    setVariableValues([]);
  };

  const renderContent = () => {
    if (mode === 'create') {
        return (
            <div className="space-y-4 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <label className="label-glass">Template Name</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. welcome_offer"
                        className="input-glass font-mono"
                    />
                </div>
                <div>
                    <label className="label-glass">Language Code</label>
                    <input 
                        type="text" 
                        value={newLang}
                        onChange={e => setNewLang(e.target.value)}
                        className="input-glass font-mono"
                    />
                </div>
                <div>
                    <label className="label-glass">
                        Body Content <span className="text-pink-400 normal-case ml-2">(Use {"{{1}}"}, {"{{2}}"} for variables)</span>
                    </label>
                    <textarea 
                        value={newBody}
                        onChange={e => setNewBody(e.target.value)}
                        placeholder="Hi {{1}}, thanks for your order!"
                        className="input-glass h-32 resize-none"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setMode('select')} className="btn-base btn-glass flex-1 py-3 rounded-xl text-sm font-bold">
                        Cancel
                    </button>
                    <button onClick={handleSaveNew} className="btn-base btn-primary flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-sm">
                        <Save size={16} /> Save Locally
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'fill' && selectedTemplate) {
        return (
            <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-black/20 p-4 rounded-lg border border-glass-border">
                    <h3 className="text-nebula-glow font-mono text-xs mb-2 uppercase">Preview</h3>
                    <p className="text-sm text-glass-text leading-relaxed whitespace-pre-wrap">
                        {selectedTemplate.body?.split(/({{\d+}})/).map((part, idx) => {
                            if (part.match(/^{{\d+}}$/)) {
                                const varIndex = parseInt(part.replace(/\D/g, '')) - 1;
                                return (
                                    <span key={idx} className="bg-nebula-glow/20 text-nebula-glow px-1 rounded mx-0.5 font-bold">
                                        {variableValues[varIndex] || part}
                                    </span>
                                );
                            }
                            return part;
                        })}
                    </p>
                </div>

                {selectedTemplate.variableCount! > 0 && (
                    <div className="space-y-3">
                         <label className="label-glass">Variable Values</label>
                         {Array.from({ length: selectedTemplate.variableCount! }).map((_, i) => (
                             <div key={i} className="flex items-center gap-3">
                                 <span className="text-xs font-mono text-pink-400 w-10 shrink-0">{`{{${i + 1}}}`}</span>
                                 <input 
                                    type="text"
                                    placeholder={`Value for variable ${i+1}`}
                                    value={variableValues[i] || ''}
                                    onChange={(e) => {
                                        const newVals = [...variableValues];
                                        newVals[i] = e.target.value;
                                        setVariableValues(newVals);
                                    }}
                                    className="input-glass py-2"
                                 />
                             </div>
                         ))}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button onClick={() => {setMode('select'); setSelectedTemplate(null);}} className="btn-base btn-glass flex-1 py-3 rounded-xl text-sm font-bold">
                        Back
                    </button>
                    <button onClick={handleSendFinal} className="btn-base btn-primary flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                        <Send size={16} /> Send Now
                    </button>
                </div>
            </div>
        );
    }

    // Default Select View
    return (
        <>
            <button 
                onClick={handleStartCreate}
                className="btn-base w-full mb-4 py-3 rounded-xl border border-dashed border-glass-border hover:border-nebula-glow hover:text-nebula-glow text-glass-muted flex items-center justify-center gap-2 group relative z-10"
            >
                <Plus size={18} className="group-hover:rotate-90 transition-transform"/> Create New Template
            </button>

            <div className="space-y-3 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {allTemplates.length === 0 ? (
                 <div className="text-center py-8 text-glass-muted text-xs">
                    No templates found. <br/> Create one or fetch from Meta.
                 </div>
            ) : (
                allTemplates.map((t) => (
                    <div 
                    key={t.id || t.name}
                    onClick={() => handleSelect(t)}
                    className="p-4 rounded-xl border border-glass-border bg-black/20 hover:bg-white/5 cursor-pointer transition-all duration-300 group hover:border-glass-highlight hover:scale-[0.99]"
                    >
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm text-white group-hover:text-nebula-glow transition-colors">{t.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-glass-muted">{t.language}</span>
                    </div>
                    <p className="text-xs text-glass-text opacity-80 line-clamp-2 font-light">{t.body}</p>
                    {t.variableCount! > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className="text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                                {t.variableCount} Variables
                            </span>
                        </div>
                    )}
                    </div>
                ))
            )}
            </div>
        </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="glass-panel w-[90%] max-w-md rounded-2xl p-6 relative overflow-hidden min-h-[400px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-purple-600 blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 bg-nebula-glow blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-pink-500" /> 
            {mode === 'create' ? 'Design Protocol' : mode === 'fill' ? 'Configure Parameters' : 'Select Protocol'}
          </h2>
          <button onClick={onClose} className="btn-base btn-ghost btn-icon text-glass-muted hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
