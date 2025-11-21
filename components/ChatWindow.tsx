
import React, { useState, useRef, useEffect } from 'react';
import { Message, Contact, MessageType } from '../types';
import { Paperclip, Mic, Send, Smile, MoreVertical, Search, FileAudio, Check, CheckCheck, ArrowLeft, Download, Play } from 'lucide-react';

interface ChatWindowProps {
  contact: Contact;
  onSendMessage: (text: string) => void;
  onSendMedia: (file: File) => void;
  onOpenTemplates: () => void;
  isSending: boolean;
  onBack: () => void;
}

const MAX_CHARS = 4096;

const ChatWindow: React.FC<ChatWindowProps> = ({ contact, onSendMessage, onSendMedia, onOpenTemplates, isSending, onBack }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [contact.messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSendMedia(e.target.files[0]);
      e.target.value = '';
    }
  };

  const renderStatusIcon = (status: string) => {
      if (status === 'sent') return <Check size={14} className="text-glass-muted" />;
      if (status === 'delivered') return <CheckCheck size={14} className="text-glass-muted" />;
      if (status === 'read') return <CheckCheck size={14} className="text-nebula-glow drop-shadow-[0_0_5px_rgba(0,210,255,0.6)]" />;
      return <div className="w-3 h-3 border-2 border-glass-muted border-t-transparent rounded-full animate-spin" />;
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case MessageType.IMAGE:
        return (
          <div className="mb-1 group">
            <div className="rounded-lg overflow-hidden bg-black/20 relative w-full max-w-[300px] border border-glass-border transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.1)]">
              {msg.mediaUrl ? (
                <img 
                  src={msg.mediaUrl} 
                  alt="Shared Image" 
                  className="w-full h-auto object-cover cursor-pointer" 
                />
              ) : (
                 <div className="flex items-center justify-center h-48 w-full bg-white/5">
                    <span className="text-glass-muted text-xs animate-pulse">Encrypting Image...</span>
                 </div>
              )}
            </div>
            {msg.text && msg.text !== msg.mediaUrl && <div className="mt-2 text-sm text-glass-text">{msg.text}</div>}
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="mb-1 group">
            <div className="rounded-lg overflow-hidden bg-black/20 relative w-full max-w-[300px] border border-glass-border group-hover:border-nebula-glow/30 transition-colors">
              {msg.mediaUrl ? (
                <video 
                  src={msg.mediaUrl} 
                  controls 
                  className="w-full h-auto object-cover"
                />
              ) : (
                 <div className="flex items-center justify-center h-48 w-full bg-white/5">
                    <span className="text-glass-muted text-xs animate-pulse">Encrypting Video...</span>
                 </div>
              )}
            </div>
            {msg.text && msg.text !== msg.mediaUrl && <div className="mt-2 text-sm text-glass-text">{msg.text}</div>}
          </div>
        );

      case MessageType.AUDIO:
        return (
            <div className="flex items-center gap-3 w-full min-w-[260px] py-3 px-3 rounded-xl bg-black/20 border border-glass-border backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse-slow">
                    <FileAudio className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    {msg.mediaUrl ? (
                         <div className="flex items-center gap-2">
                             <audio controls src={msg.mediaUrl} className="h-8 w-full max-w-[200px] opacity-80 contrast-150" />
                             <a 
                                href={msg.mediaUrl} 
                                download={`audio_${msg.id}.mp3`}
                                className="btn-base btn-ghost btn-icon p-2 hover:bg-white/10 text-glass-muted hover:text-white transition-colors"
                                title="Download Audio"
                             >
                                 <Download size={16} />
                             </a>
                         </div>
                    ) : (
                         <div className="text-xs text-glass-muted animate-pulse">Processing Audio Stream...</div>
                    )}
                </div>
            </div>
        );

      case MessageType.TEMPLATE:
        return (
          <div className="border-l-4 border-nebula-glow pl-3 py-1 bg-nebula-glow/5 rounded-r-lg">
            <div className="text-[10px] text-nebula-glow mb-1 uppercase font-bold tracking-widest flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-nebula-glow animate-pulse"></span>
               Template: {msg.templateName}
            </div>
            {msg.text}
          </div>
        );

      default:
        return msg.text;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative glass-panel border-y-0 border-r-0 z-10 w-full">
      {/* Chat Header */}
      <div className="h-[70px] w-full px-4 md:px-6 flex items-center justify-between shrink-0 border-b border-glass-border bg-black/20 backdrop-blur-xl z-20">
        <div className="flex items-center cursor-pointer group overflow-hidden">
          <button onClick={onBack} className="md:hidden mr-3 text-glass-muted hover:text-white p-2 btn-base btn-ghost rounded-full">
             <ArrowLeft size={22} />
          </button>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full mr-3 md:mr-4 relative shrink-0">
             <div className="absolute inset-0 rounded-full border-2 border-nebula-glow opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 box-border"></div>
             <img src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.name}&background=random`} alt="avatar" className="w-full h-full rounded-full object-cover relative z-10 p-[2px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-display font-bold text-base md:text-lg group-hover:text-nebula-glow transition-colors truncate tracking-wide">{contact.name}</h3>
            <p className="text-xs text-glass-muted flex items-center gap-1.5 truncate font-mono">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span> 
               SECURE LINK ACTIVE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
           <button className="btn-base btn-ghost btn-icon text-glass-muted hover:text-white hidden sm:flex hover:bg-white/5">
              <Search className="w-5 h-5" />
           </button>
           <button className="btn-base btn-ghost btn-icon text-glass-muted hover:text-white hover:bg-white/5">
              <MoreVertical className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 custom-scrollbar relative">
        <div className="flex flex-col gap-4 pb-4">
           <div className="flex justify-center mb-6">
              <div className="px-4 py-1.5 rounded-full text-[10px] sm:text-xs text-yellow-200/70 border border-yellow-500/20 bg-yellow-500/5 text-center backdrop-blur-sm select-none font-mono tracking-wide">
                 🔒 END-TO-END ENCRYPTION EMULATED
              </div>
           </div>

           {contact.messages.map((msg) => (
             <div key={msg.id} className={`flex w-full ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl shadow-lg p-1 transition-all duration-300 ${
                  msg.direction === 'outgoing' ? 'bubble-outgoing rounded-tr-sm' : 'bubble-incoming rounded-tl-sm'
                }`}>
                   <div className="px-4 py-3 text-sm text-glass-text sm:text-[15px] leading-relaxed whitespace-pre-wrap font-normal break-words">
                     {renderMessageContent(msg)}
                   </div>

                   <div className={`flex items-center justify-end gap-1.5 px-3 pb-2 mt-1 ${msg.type !== MessageType.TEXT ? 'absolute bottom-2 right-2 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm' : ''}`}>
                      <span className="text-[10px] text-glass-muted font-mono opacity-70">{formatTime(msg.timestamp)}</span>
                      {msg.direction === 'outgoing' && (
                        <span title={msg.status} className="flex items-center">
                           {renderStatusIcon(msg.status)}
                        </span>
                      )}
                   </div>
                </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Area */}
      <div className="min-h-[80px] px-3 md:px-6 py-4 flex items-end gap-2 md:gap-4 shrink-0 z-20 border-t border-glass-border bg-black/30 backdrop-blur-xl">
        <div className="flex gap-2 items-center h-[50px]">
            <button 
                onClick={onOpenTemplates} 
                title="Send Template" 
                className="btn-base btn-glass w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center group shrink-0 hover:bg-white/10 transition-all"
            >
                <span className="font-display font-bold text-lg text-glass-muted group-hover:text-nebula-glow transition-colors">/</span>
            </button>
            
            <div className="relative shrink-0">
            <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
            />
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-base btn-ghost btn-icon w-10 h-10 md:w-12 md:h-12 text-glass-muted hover:text-white hover:bg-white/5 transition-all"
            >
                <Paperclip className="w-5 h-5 md:w-6 md:h-6 transform -rotate-45" />
            </button>
            </div>
        </div>

        <div className="flex-1 relative">
            <div className="min-h-[50px] bg-transparent border border-white/20 rounded-2xl flex items-center px-3 md:px-4 gap-2 md:gap-3 focus-within:border-nebula-glow focus-within:bg-white/5 transition-all focus-within:shadow-[0_0_15px_rgba(0,210,255,0.1)] w-full relative overflow-hidden">
                <Smile className="w-5 h-5 md:w-6 md:h-6 text-glass-muted cursor-pointer hover:text-yellow-400 transition-colors hidden sm:block hover:scale-110 shrink-0" />
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    maxLength={MAX_CHARS}
                    className="bg-transparent border-none outline-none text-white w-full placeholder-glass-muted text-sm md:text-[15px] py-3 pr-10"
                />
                {/* Character Counter Integrated inside input */}
                <div className="absolute right-3 bottom-3 text-[9px] font-mono text-glass-muted opacity-50 pointer-events-none">
                    {inputValue.length}
                    <span className="mx-0.5">/</span>
                    {MAX_CHARS}
                </div>
            </div>
        </div>

        <div className="h-[50px] flex items-center">
            {inputValue ? (
            <button 
                onClick={handleSend} 
                disabled={isSending} 
                className="btn-base btn-primary w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,210,255,0.3)] hover:scale-105 transition-transform"
            >
                <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
            </button>
            ) : (
            <button className="btn-base btn-glass w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-glass-muted hover:text-white shrink-0 hover:bg-white/10 transition-all">
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
