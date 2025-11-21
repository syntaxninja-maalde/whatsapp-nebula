
import React, { useState, useEffect } from 'react';
import { CustomTemplate, TemplateComponent, TemplateButton, MetaCredentials, TemplateCategory } from '../types';
import { getMetaTemplates, createMetaTemplate } from '../services/metaService';
import { LayoutTemplate, Plus, Save, RefreshCw, CheckCircle2, XCircle, Clock, Smartphone, Type, Image as ImageIcon, Link as LinkIcon, Phone, ArrowLeft } from 'lucide-react';

interface TemplateDashboardProps {
  creds: MetaCredentials | null;
  onBack: () => void;
}

const TemplateDashboard: React.FC<TemplateDashboardProps> = ({ creds, onBack }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Builder State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('MARKETING');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<TemplateButton[]>([]);

  useEffect(() => {
    if (view === 'list' && creds?.wabaId) {
      fetchTemplates();
    }
  }, [view, creds]);

  const fetchTemplates = async () => {
    if (!creds) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMetaTemplates(creds);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
      // Removed demo data fallback to avoid confusion with real data
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !bodyText) {
      alert("Name and Body text are required.");
      return;
    }
    if (!creds) {
        alert("Please configure API credentials first.");
        return;
    }

    setIsLoading(true);
    
    const components: TemplateComponent[] = [];

    if (headerType !== 'NONE') {
      components.push({
        type: 'HEADER',
        format: headerType === 'TEXT' ? 'TEXT' : headerType === 'IMAGE' ? 'IMAGE' : 'VIDEO',
        text: headerType === 'TEXT' ? headerText : undefined
      });
    }

    components.push({
      type: 'BODY',
      text: bodyText
    });

    if (footerText) {
      components.push({
        type: 'FOOTER',
        text: footerText
      });
    }

    if (buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons
      });
    }

    const newTemplate: CustomTemplate = {
      id: '',
      name: name.toLowerCase().replace(/\s+/g, '_'),
      language: 'en_US',
      status: 'PENDING',
      category,
      components
    };

    try {
      await createMetaTemplate(creds, newTemplate);
      alert("Template submitted to Meta for review!");
      setView('list');
    } catch (err: any) {
      alert(`Error creating template: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold bg-green-500/10 px-2 py-1 rounded border border-green-500/20 tracking-wide"><CheckCircle2 size={12} /> ACTIVE</span>;
      case 'PENDING': return <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 tracking-wide"><Clock size={12} /> REVIEW</span>;
      case 'REJECTED': return <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20 tracking-wide"><XCircle size={12} /> REJECTED</span>;
      default: return <span className="text-glass-muted text-xs">{status}</span>;
    }
  };

  const renderPreview = () => {
    return (
      <div className="w-[300px] mx-auto bg-nebula-dark rounded-[35px] overflow-hidden border-[6px] border-gray-800 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] relative h-[600px] flex flex-col z-10">
        {/* Status Bar */}
        <div className="h-8 bg-[#202c33] w-full flex items-center justify-between px-5 pt-1">
            <div className="text-[10px] text-white font-medium">12:00</div>
            <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
                <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
            </div>
        </div>
        
        {/* App Bar */}
        <div className="h-14 bg-[#202c33] flex items-center px-3 gap-3 border-b border-white/5 shadow-md z-10">
            <ArrowLeft size={18} className="text-white" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
            <div className="text-white font-medium text-sm truncate flex-1">My Business</div>
        </div>

        {/* Chat Background */}
        <div className="flex-1 p-3 bg-[#0b141a] relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:300px_300px]"></div>
            
            <div className="relative z-10 bg-[#202c33] rounded-lg rounded-tl-none p-1 shadow-md w-full max-w-[90%] mt-2">
                <div className="p-1">
                    {headerType !== 'NONE' && (
                        <div className="mb-2 rounded-md overflow-hidden bg-white/5 border border-white/5">
                            {headerType === 'TEXT' && <p className="p-3 font-bold text-white text-sm">{headerText || 'Header Text'}</p>}
                            {headerType === 'IMAGE' && <div className="h-32 bg-slate-700 flex items-center justify-center text-slate-500"><ImageIcon size={32}/></div>}
                            {headerType === 'VIDEO' && <div className="h-32 bg-slate-700 flex items-center justify-center text-slate-500"><Smartphone size={32}/></div>}
                        </div>
                    )}
                    
                    <p className="text-[13px] text-[#e9edef] px-2 py-1 whitespace-pre-wrap leading-5">
                        {bodyText || 'Enter body text...'}
                    </p>

                    {footerText && (
                        <p className="text-[10px] text-[#8696a0] px-2 mt-2 mb-1">{footerText}</p>
                    )}
                </div>

                <div className="flex justify-end px-2 pb-1.5">
                     <span className="text-[9px] text-[#8696a0]">12:01 PM</span>
                </div>

                {buttons.length > 0 && (
                    <div className="border-t border-[#2a3942] mt-1">
                        {buttons.map((btn, idx) => (
                            <div key={idx} className="h-10 flex items-center justify-center gap-2 text-[#00a884] text-[13px] font-medium border-b border-[#2a3942] last:border-none cursor-pointer hover:bg-[#2a3942] transition-colors bg-[#202c33]">
                                {btn.type === 'URL' && <LinkIcon size={14} />}
                                {btn.type === 'PHONE_NUMBER' && <Phone size={14} />}
                                {btn.type === 'QUICK_REPLY' && <RefreshCw size={14} />}
                                {btn.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        {/* Bottom Safe Area */}
        <div className="h-5 bg-[#0b141a]"></div>
      </div>
    );
  };

  if (view === 'list') {
    return (
      <div className="w-full h-full flex flex-col p-6 md:p-8 overflow-hidden bg-nebula-dark/50">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 neon-text">Protocols</h1>
            <p className="text-glass-muted text-xs md:text-sm tracking-wide">Manage communication templates</p>
          </div>
          <div className="flex gap-3">
             {!creds?.wabaId && (
                 <div className="hidden md:flex px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-xs items-center font-bold">
                    MISSING WABA ID
                 </div>
             )}
             <button onClick={fetchTemplates} disabled={isLoading} className="btn-base btn-glass p-3 rounded-xl text-glass-muted hover:text-white hover:bg-white/10">
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
             </button>
             <button 
                onClick={() => setView('create')} 
                className="btn-base btn-primary px-5 py-3 rounded-xl font-bold flex items-center gap-2 text-sm"
            >
                <Plus size={18} /> <span className="hidden sm:inline">New Template</span>
            </button>
          </div>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm">
                System Error: {error}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
          {templates.length === 0 && !isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-glass-muted opacity-60">
                  <LayoutTemplate size={48} className="mb-4 opacity-50"/>
                  <p>No templates found for this Business Account.</p>
              </div>
          ) : (
            templates.map((t) => (
                <div key={t.id} className="glass-panel p-5 rounded-2xl group hover:border-nebula-glow/30 transition-all hover:-translate-y-1 hover:shadow-2xl bg-black/20">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white text-base truncate w-2/3 group-hover:text-nebula-glow transition-colors">{t.name}</h3>
                    {renderStatus(t.status)}
                </div>
                <div className="flex gap-2 mb-4">
                    <span className="text-[9px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-glass-muted border border-white/5">{t.language}</span>
                    <span className="text-[9px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-glass-muted border border-white/5">{t.category}</span>
                </div>
                <p className="text-xs text-glass-text line-clamp-3 h-[45px] mb-4 font-light leading-relaxed opacity-80">
                    {t.body || t.components.find(c => c.type === 'BODY')?.text || 'No text content'}
                </p>
                <div className="flex justify-between items-center text-[10px] text-glass-muted border-t border-glass-border pt-3">
                    <span className="font-mono">{t.components.length} BLOCKS</span>
                    <span className="font-mono opacity-50">#{t.id.substring(0, 6)}</span>
                </div>
                </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-nebula-dark">
        {/* Form Builder */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 border-r border-glass-border">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('list')} className="btn-base btn-ghost p-2 rounded-full hover:bg-white/10">
                    <ArrowLeft size={22} />
                </button>
                <h2 className="text-xl font-bold text-white tracking-wide">New Template Protocol</h2>
            </div>

            <div className="space-y-6 max-w-2xl">
                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-glass">Internal ID</label>
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input-glass"
                            placeholder="e.g. summer_sale_2024"
                        />
                    </div>
                    <div>
                        <label className="label-glass">Category Classification</label>
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value as TemplateCategory)}
                            className="input-glass appearance-none"
                        >
                            <option value="MARKETING">MARKETING</option>
                            <option value="UTILITY">UTILITY</option>
                            <option value="AUTHENTICATION">AUTHENTICATION</option>
                        </select>
                    </div>
                </div>

                {/* Header */}
                <div className="glass-panel p-5 rounded-xl bg-black/20">
                    <label className="label-glass text-nebula-glow mb-3">
                        <Type size={12}/> Header Component
                    </label>
                    <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg border border-glass-border">
                        {['NONE', 'TEXT', 'IMAGE', 'VIDEO'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setHeaderType(type as any)}
                                className={`btn-base flex-1 py-2 rounded text-[10px] font-bold transition-all ${headerType === type ? 'bg-nebula-glow text-black shadow-md' : 'text-glass-muted hover:text-white'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    {headerType === 'TEXT' && (
                        <input 
                            value={headerText}
                            onChange={e => setHeaderText(e.target.value)}
                            className="input-glass py-2 text-sm"
                            placeholder="Enter header text..."
                            maxLength={60}
                        />
                    )}
                </div>

                {/* Body */}
                <div className="glass-panel p-5 rounded-xl bg-black/20">
                     <label className="label-glass text-nebula-glow mb-3">
                        <Type size={12}/> Body Content
                    </label>
                    <textarea 
                        value={bodyText}
                        onChange={e => setBodyText(e.target.value)}
                        className="input-glass h-40 resize-none leading-relaxed"
                        placeholder="Enter your message here..."
                    />
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => setBodyText(prev => prev + ' {{1}} ')} className="btn-base text-[10px] bg-pink-500/10 px-3 py-1.5 rounded-lg hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 transition-colors font-mono">
                            + Variable
                        </button>
                         <button onClick={() => setBodyText(prev => prev + ' *bold* ')} className="btn-base text-[10px] bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-glass-muted hover:text-white font-bold">
                            B
                        </button>
                         <button onClick={() => setBodyText(prev => prev + ' _italic_ ')} className="btn-base text-[10px] bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-glass-muted hover:text-white italic">
                            I
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="glass-panel p-5 rounded-xl bg-black/20">
                     <label className="label-glass text-nebula-glow mb-3">
                        <Type size={12}/> Footer (Optional)
                    </label>
                    <input 
                        value={footerText}
                        onChange={e => setFooterText(e.target.value)}
                        className="input-glass py-2 text-sm"
                        placeholder="e.g. Reply STOP to unsubscribe"
                        maxLength={60}
                    />
                </div>

                {/* Buttons */}
                 <div className="glass-panel p-5 rounded-xl bg-black/20">
                     <label className="label-glass text-nebula-glow mb-3">
                        <Type size={12}/> Interactive Buttons
                    </label>
                    <div className="space-y-3">
                        {buttons.map((btn, idx) => (
                            <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                                <div className="flex-1 bg-black/40 p-3 rounded-lg text-sm text-white flex justify-between items-center border border-glass-border shadow-inner">
                                    <span className="text-xs font-mono"><span className="opacity-50">{btn.type}:</span> {btn.text}</span>
                                    <button onClick={() => setButtons(buttons.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-colors"><XCircle size={16}/></button>
                                </div>
                            </div>
                        ))}
                        {buttons.length < 3 && (
                            <div className="flex gap-2">
                                <button onClick={() => setButtons([...buttons, { type: 'QUICK_REPLY', text: 'Yes' }])} className="btn-base px-3 py-2 rounded bg-white/5 text-[10px] font-bold hover:bg-white/10 text-white border border-glass-border">
                                    + Quick Reply
                                </button>
                                <button onClick={() => setButtons([...buttons, { type: 'URL', text: 'Visit Website', url: 'https://' }])} className="btn-base px-3 py-2 rounded bg-white/5 text-[10px] font-bold hover:bg-white/10 text-white border border-glass-border">
                                    + Website Link
                                </button>
                                 <button onClick={() => setButtons([...buttons, { type: 'PHONE_NUMBER', text: 'Call Us', phoneNumber: '' }])} className="btn-base px-3 py-2 rounded bg-white/5 text-[10px] font-bold hover:bg-white/10 text-white border border-glass-border">
                                    + Phone Number
                                </button>
                            </div>
                        )}
                        {buttons.length > 0 && (
                             <div className="p-3 bg-black/20 rounded-lg mt-3 border border-glass-border">
                                <label className="text-[9px] uppercase text-glass-muted tracking-wider mb-1 block">Edit Selected Button</label>
                                <input 
                                    value={buttons[buttons.length-1].text}
                                    onChange={(e) => {
                                        const newBtns = [...buttons];
                                        newBtns[newBtns.length-1].text = e.target.value;
                                        setButtons(newBtns);
                                    }}
                                    placeholder="Button Label"
                                    className="w-full bg-transparent border-b border-glass-border py-2 text-sm text-white outline-none focus:border-nebula-glow transition-colors"
                                />
                             </div>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={handleSave} 
                    disabled={isLoading} 
                    className="btn-base btn-primary w-full py-4 rounded-xl font-bold flex justify-center items-center gap-3 text-sm uppercase tracking-widest shadow-lg"
                >
                    {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                    Submit Protocol
                </button>
            </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full md:w-[420px] bg-black/20 border-l border-glass-border p-8 flex flex-col items-center justify-center relative hidden lg:flex">
            <div className="absolute top-6 left-6 text-[10px] font-bold text-glass-muted uppercase tracking-widest opacity-50">Simulation Environment</div>
            {renderPreview()}
            <div className="mt-8 text-center px-6 opacity-50">
                <p className="text-[10px] text-glass-muted font-mono">
                    RENDER_MODE: PREVIEW<br/>
                    DEVICE: GENERIC_MOBILE
                </p>
            </div>
        </div>
    </div>
  );
};

export default TemplateDashboard;
