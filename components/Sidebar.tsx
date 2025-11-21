
import React from 'react';
import { Contact } from '../types';
import { Search, Plus, Settings, LogOut, Filter } from 'lucide-react';

interface SidebarProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onNewChat: () => void;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  contacts, 
  activeContactId, 
  onSelectContact, 
  onNewChat, 
  onSettings,
  onLogout,
  className = '' 
}) => {
  return (
    <div className={`w-full md:w-[400px] h-full flex-col border-r border-glass-border glass-panel z-20 relative ${className}`}>
      {/* Header */}
      <div className="h-[70px] px-5 flex items-center justify-between shrink-0 border-b border-glass-border bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-glow to-nebula-secondary p-[1px] shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                 <div className="w-full h-full rounded-xl bg-black/80 backdrop-blur-sm flex items-center justify-center">
                     <div className="w-6 h-6 bg-gradient-to-br from-white to-transparent opacity-50 rounded-full"></div>
                 </div>
            </div>
            <div>
                <h1 className="font-display font-bold text-xl tracking-wide text-white neon-text leading-none">NEBULA</h1>
                <span className="text-[10px] text-glass-muted tracking-[0.3em] uppercase">Connect</span>
            </div>
        </div>
        <div className="flex gap-1">
            <button 
                onClick={onSettings}
                className="btn-base btn-ghost btn-icon text-glass-muted hover:text-white md:hidden"
                title="Settings"
            >
                <Settings size={20} />
            </button>
            <button 
                onClick={onLogout}
                className="btn-base btn-ghost btn-icon text-glass-muted hover:text-red-400 md:hidden"
                title="Logout"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 pb-2">
          <div className="w-full h-[45px] bg-black/20 rounded-xl flex items-center px-4 gap-3 border border-glass-border focus-within:border-nebula-glow/50 focus-within:bg-black/40 transition-all shadow-inner relative group">
              <Search className="w-4 h-4 text-glass-muted group-focus-within:text-nebula-glow transition-colors" />
              <input 
                  type="text" 
                  placeholder="Search network..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-glass-text placeholder-glass-muted h-full"
              />
              <Filter className="w-3 h-3 text-glass-muted cursor-pointer hover:text-white" />
          </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-2 pb-4 space-y-1">
          {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-glass-muted gap-4 p-8 text-center opacity-60">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <Search size={24} className="opacity-50"/>
                  </div>
                  <p className="text-sm">No active frequencies detected.</p>
                  <button 
                      onClick={onNewChat}
                      className="btn-base btn-glass px-6 py-2 rounded-full flex items-center gap-2 text-nebula-glow font-bold hover:bg-nebula-glow/10 border-nebula-glow/30"
                  >
                      <Plus size={16} /> Initiate Link
                  </button>
              </div>
          ) : (
              contacts.map(contact => (
              <div 
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className={`h-[72px] w-full flex items-center px-4 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden group ${
                      activeContactId === contact.id 
                      ? 'bg-gradient-to-r from-white/10 to-transparent border-glass-highlight' 
                      : 'border-transparent hover:bg-white/5'
                  }`}
              >
                  {activeContactId === contact.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-nebula-glow shadow-[0_0_10px_rgba(0,210,255,0.8)]"></div>
                  )}

                  <div className="w-12 h-12 rounded-full mr-4 relative shrink-0">
                        <div className={`absolute inset-0 rounded-full border border-white/10 ${activeContactId === contact.id ? 'border-nebula-glow/50' : ''}`}></div>
                        <img src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.name}&background=random`} alt={contact.name} className="w-full h-full rounded-full object-cover relative z-10" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-center mb-0.5">
                          <span className={`font-bold text-sm truncate transition-colors ${activeContactId === contact.id ? 'text-white text-shadow-sm' : 'text-glass-text group-hover:text-white'}`}>{contact.name}</span>
                          <span className="text-[10px] text-glass-muted font-mono">
                              {contact.lastMessageTime ? new Date(contact.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className={`text-xs truncate pr-2 w-11/12 block transition-colors ${activeContactId === contact.id ? 'text-glass-text' : 'text-glass-muted group-hover:text-glass-text/80'}`}>
                              {contact.messages.length > 0 && contact.messages[contact.messages.length-1].direction === 'outgoing' && (
                                  <span className="mr-1 inline-block text-nebula-glow">✓✓</span>
                              )}
                              {contact.lastMessage}
                          </span>
                          {contact.unreadCount > 0 && (
                              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-nebula-glow text-black text-[10px] font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,210,255,0.6)]">
                                  {contact.unreadCount}
                              </span>
                          )}
                      </div>
                  </div>
              </div>
              ))
          )}
      </div>

      <div className="p-3 flex justify-center text-[10px] text-glass-muted border-t border-glass-border bg-black/40">
         <span className="opacity-50 font-mono">ENCRYPTED • V20.0</span>
      </div>
    </div>
  );
};

export default Sidebar;
