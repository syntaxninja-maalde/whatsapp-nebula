
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ConfigModal from '../components/ConfigModal';
import TemplateModal from '../components/TemplateModal';
import TemplateDashboard from '../components/TemplateDashboard';
import LoginScreen from '../components/LoginScreen';
import { Contact, Message, MessageType, MetaCredentials, WebhookLog, CustomTemplate } from '../types';
import { sendMetaTextMessage, sendMetaTemplateMessage, uploadMediaToMeta, sendMetaMediaMessage } from '../services/metaService';
import { Settings, Globe, MessageSquare, LayoutTemplate, LogOut, Wifi, WifiOff } from 'lucide-react';

const WS_URL = 'wss://webhooks.maalde.co.in/ws';

const Page: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // View State
  const [currentView, setCurrentView] = useState<'chat' | 'templates'>('chat');

  // Data State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [creds, setCreds] = useState<MetaCredentials | null>(null);
  
  // UI State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // WebSocket status
  
  // Custom Template State (Local cache for Chat View)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const activeContact = contacts.find(c => c.id === activeContactId) || null;

  // 1. Load Data from LocalStorage on Mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('wb_contacts');
    const savedCreds = localStorage.getItem('wb_creds');
    const savedTemplates = localStorage.getItem('wb_templates');

    if (savedContacts) {
        try {
            setContacts(JSON.parse(savedContacts));
        } catch (e) { console.error("Failed to load contacts", e); }
    }
    if (savedCreds) {
        try {
            setCreds(JSON.parse(savedCreds));
        } catch (e) { console.error("Failed to load creds", e); }
    }
    if (savedTemplates) {
        try {
             setCustomTemplates(JSON.parse(savedTemplates));
        } catch (e) { console.error("Failed to load templates", e); }
    }
  }, []);

  // 2. Save Data to LocalStorage on Change
  useEffect(() => {
    localStorage.setItem('wb_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (creds) localStorage.setItem('wb_creds', JSON.stringify(creds));
  }, [creds]);
  
  useEffect(() => {
    localStorage.setItem('wb_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);


  // 3. WebSocket Connection Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const connectWs = () => {
        console.log("Connecting to WebSocket...");
        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log("WebSocket Connected");
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
            setIsConnected(false);
            // Reconnect after 3s
            setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
            console.error("WebSocket Error:", err);
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                handleWebSocketMessage(payload);
            } catch (e) {
                console.error("Failed to parse WS message:", e);
            }
        };

        wsRef.current = ws;
    };

    connectWs();

    return () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
    };
  }, [isAuthenticated]);

  // 4. Handle Incoming WS Messages
  const handleWebSocketMessage = (payload: any) => {
      const { type, data } = payload;

      if (type === 'message') {
          // Incoming Message
          const contactId = data.from;
          const timestamp = parseInt(data.timestamp) * 1000 || Date.now(); // Ensure ms
          
          let messageType = MessageType.TEXT;
          let text = data.text || '';
          let mediaUrl = undefined;

          // Normalize Media Types from your backend payload structure
          if (data.media) {
              // Assuming your backend sends normalized media object
              const mime = data.media.mime_type || '';
              if (mime.startsWith('image')) messageType = MessageType.IMAGE;
              else if (mime.startsWith('video')) messageType = MessageType.VIDEO;
              else if (mime.startsWith('audio')) messageType = MessageType.AUDIO;
              
              // Note: Meta requires downloading media with token. 
              // For now, we might not have the direct URL unless your backend proxied it.
              // If ID is provided, we would need a way to fetch it. 
              // For this implementation, we'll display a placeholder or the raw ID if no link.
              text = data.media.caption || text;
              // If your backend provides a link, use it, otherwise we can't display it easily without a backend proxy
              // mediaUrl = data.media.link; 
          }

          const newMessage: Message = {
              id: data.id,
              text: text,
              mediaUrl: mediaUrl, // Will be undefined unless backend sends a link
              timestamp: timestamp,
              direction: 'incoming',
              status: 'read', // Auto-mark as read locally
              type: messageType
          };

          setContacts(prev => {
              const existing = prev.find(c => c.id === contactId);
              if (existing) {
                  // Prevent duplicates
                  if (existing.messages.some(m => m.id === newMessage.id)) return prev;
                  
                  return prev.map(c => c.id === contactId ? {
                      ...c,
                      messages: [...c.messages, newMessage],
                      lastMessage: messageType === MessageType.TEXT ? text : `Sent ${messageType}`,
                      lastMessageTime: timestamp,
                      unreadCount: c.id === activeContactId ? 0 : c.unreadCount + 1
                  } : c);
              } else {
                  // New Contact
                  return [{
                      id: contactId,
                      name: `+${contactId}`, // Default name
                      unreadCount: 1,
                      messages: [newMessage],
                      lastMessage: messageType === MessageType.TEXT ? text : `Sent ${messageType}`,
                      lastMessageTime: timestamp
                  }, ...prev];
              }
          });

      } else if (type === 'status') {
          // Status Update (sent, delivered, read)
          const contactId = data.recipient_id;
          const msgId = data.id;
          const newStatus = data.status; // sent, delivered, read

          setContacts(prev => prev.map(c => {
              if (c.id !== contactId) return c;
              return {
                  ...c,
                  messages: c.messages.map(m => m.id === msgId ? { ...m, status: newStatus } : m)
              };
          }));
      }
  };

  // Helper to determine message type from file
  const getMessageTypeFromFile = (file: File): MessageType => {
    if (file.type.startsWith('image/')) return MessageType.IMAGE;
    if (file.type.startsWith('video/')) return MessageType.VIDEO;
    if (file.type.startsWith('audio/')) return MessageType.AUDIO;
    return MessageType.IMAGE;
  };

  const handleSendMessage = async (text: string) => {
    if (!activeContact || !creds) {
        if (!creds) alert("Please configure your Meta API Credentials first.");
        return;
    }

    // Optimistic Update
    const tempId = 'temp_' + Date.now();
    const newMessage: Message = {
      id: tempId,
      text,
      timestamp: Date.now(),
      direction: 'outgoing',
      status: 'sent', 
      type: MessageType.TEXT
    };

    updateContactMessages(activeContact.id, newMessage);
    setIsSending(true);

    try {
      const response = await sendMetaTextMessage(creds, activeContact.id, text);
      // Update with real ID from Meta
      const realId = response.messages[0].id;
      
      setContacts(prev => prev.map(c => {
          if (c.id !== activeContact.id) return c;
          return {
              ...c,
              messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m)
          };
      }));

    } catch (error: any) {
      console.error("Meta API Error:", error);
      alert(`Failed to send: ${error.message}`);
      // Mark as failed in UI (optional, for now we just keep it sent)
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTemplate = (template: CustomTemplate) => {
    setCustomTemplates([...customTemplates, template]);
  };

  const handleSendTemplate = async (templateName: string, lang: string, variables: string[] = []) => {
    if (!activeContact || !creds) return;
    setIsTemplateOpen(false);

    let displayText = `Template: ${templateName}`;
    if (variables.length > 0) {
        displayText += `\nParams: [${variables.join(', ')}]`;
    }

    const tempId = 'temp_' + Date.now();
    const newMessage: Message = {
        id: tempId,
        text: displayText,
        templateName,
        timestamp: Date.now(),
        direction: 'outgoing',
        status: 'sent',
        type: MessageType.TEMPLATE
    };

    updateContactMessages(activeContact.id, newMessage);
    setIsSending(true);

    try {
        const response = await sendMetaTemplateMessage(creds, activeContact.id, templateName, lang, variables);
        const realId = response.messages[0].id;
        
        setContacts(prev => prev.map(c => {
            if (c.id !== activeContact.id) return c;
            return {
                ...c,
                messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m)
            };
        }));
    } catch (e: any) {
        console.error(e);
        alert(`Template send failed: ${e.message}`);
    } finally {
        setIsSending(false);
    }
  };

  const handleSendMedia = async (file: File) => {
     if (!activeContact || !creds) return;
     
     const msgType = getMessageTypeFromFile(file);
     const objectUrl = URL.createObjectURL(file);

     const tempId = 'temp_' + Date.now();
     const newMessage: Message = {
         id: tempId,
         text: file.name, 
         mediaUrl: objectUrl,
         timestamp: Date.now(),
         direction: 'outgoing',
         status: 'sent',
         type: msgType
     };

     updateContactMessages(activeContact.id, newMessage);
     setIsSending(true);

     try {
        const uploadRes = await uploadMediaToMeta(creds, file);
        const apiType = msgType === MessageType.IMAGE ? 'image' : 
                        msgType === MessageType.VIDEO ? 'video' : 'audio';
        
        const response = await sendMetaMediaMessage(creds, activeContact.id, apiType, uploadRes.id, file.name);
        const realId = response.messages[0].id;
        
        setContacts(prev => prev.map(c => {
            if (c.id !== activeContact.id) return c;
            return {
                ...c,
                messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m)
            };
        }));

     } catch (e: any) {
        console.error("Media Upload/Send Failed:", e);
        alert(`Media send failed: ${e.message}`);
     } finally {
        setIsSending(false);
     }
  };

  const updateContactMessages = (contactId: string, message: Message) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          messages: [...c.messages, message],
          lastMessage: message.type === MessageType.TEXT ? message.text : `Sent ${message.type}`,
          lastMessageTime: message.timestamp,
          unreadCount: 0
        };
      }
      return c;
    }));
  };

  const handleNewChat = () => {
     const phone = prompt("Enter phone number (with country code, e.g., 15550001234):");
     if (phone) {
        const exists = contacts.find(c => c.id === phone);
        if (exists) {
            setActiveContactId(exists.id);
        } else {
            const newContact: Contact = {
                id: phone,
                name: `+${phone}`,
                unreadCount: 0,
                messages: [],
                lastMessage: '',
                lastMessageTime: undefined
            };
            setContacts([newContact, ...contacts]);
            setActiveContactId(phone);
        }
     }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans relative z-0 bg-nebula-dark">
      
      {/* Navigation Rail (Desktop) */}
      <div className="hidden md:flex w-[80px] flex-col items-center py-8 border-r border-glass-border glass-panel z-30">
         <div className="mb-8 w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-glow to-purple-600 flex items-center justify-center shadow-lg relative group cursor-pointer" title={isConnected ? "Server Connected" : "Connecting..."}>
            <Globe className="text-white" size={20} />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
         </div>
         
         <div className="flex-1 flex flex-col gap-6 w-full items-center">
            <button 
                onClick={() => setCurrentView('chat')}
                className={`btn-base p-3 rounded-xl transition-all duration-300 relative group ${currentView === 'chat' ? 'bg-white/10 text-nebula-glow shadow-[0_0_15px_rgba(0,210,255,0.3)]' : 'text-glass-muted hover:text-white'}`}
            >
                <MessageSquare size={24} />
                <span className="absolute left-[70px] bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-glass-border">Chats</span>
            </button>

            <button 
                onClick={() => setCurrentView('templates')}
                className={`btn-base p-3 rounded-xl transition-all duration-300 relative group ${currentView === 'templates' ? 'bg-white/10 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'text-glass-muted hover:text-white'}`}
            >
                <LayoutTemplate size={24} />
                <span className="absolute left-[70px] bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-glass-border">Templates</span>
            </button>
         </div>

         <div className="flex flex-col gap-4 items-center w-full mb-4">
            <button 
                onClick={() => setIsConfigOpen(true)}
                className="btn-base p-3 rounded-xl text-glass-muted hover:text-white hover:bg-white/5 transition-all relative group"
            >
                <Settings size={24} />
                <span className="absolute left-[70px] bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-glass-border">Settings</span>
            </button>
            
            <button 
                onClick={() => {
                    setIsAuthenticated(false);
                    setCurrentView('chat');
                }}
                className="btn-base p-3 rounded-xl text-glass-muted hover:text-red-400 hover:bg-white/5 transition-all relative group"
            >
                <LogOut size={24} />
                <span className="absolute left-[70px] bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-glass-border text-red-400">Logout</span>
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'templates' ? (
            <TemplateDashboard creds={creds} onBack={() => setCurrentView('chat')} />
        ) : (
            <>
                {/* Sidebar (Chat List) */}
                <Sidebar 
                    contacts={contacts} 
                    activeContactId={activeContactId} 
                    onSelectContact={setActiveContactId}
                    onNewChat={handleNewChat}
                    onSettings={() => setIsConfigOpen(true)}
                    onLogout={() => setIsAuthenticated(false)}
                    className={`${activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] border-r border-glass-border`}
                />

                {/* Chat Area */}
                <div className={`${activeContactId ? 'flex' : 'hidden md:flex'} flex-1 h-full relative`}>
                    {activeContact ? (
                        <ChatWindow 
                            contact={activeContact} 
                            onSendMessage={handleSendMessage}
                            onSendMedia={handleSendMedia}
                            onOpenTemplates={() => setIsTemplateOpen(true)}
                            isSending={isSending}
                            onBack={() => setActiveContactId(null)}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center glass-panel z-10 rounded-none relative overflow-hidden w-full h-full">
                             {/* Mobile Nav Toggle (Visible only when no active contact on mobile) */}
                             <div className="md:hidden absolute bottom-20 flex gap-4">
                                <button onClick={() => setCurrentView('chat')} className="btn-base px-6 py-3 rounded-full font-bold bg-nebula-glow text-black">Chats</button>
                                <button onClick={() => setCurrentView('templates')} className="btn-base px-6 py-3 rounded-full font-bold btn-glass">Templates</button>
                             </div>

                            <div className="text-center p-8">
                                <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 neon-text animate-float">
                                    {creds?.businessName || 'WhatsBiz Nebula'}
                                </h1>
                                <div className="flex items-center justify-center gap-2 text-sm text-glass-muted mb-6">
                                     {isConnected ? (
                                         <span className="text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                             <Wifi size={12} /> Server Connected
                                         </span>
                                     ) : (
                                         <span className="text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                             <WifiOff size={12} /> Disconnected
                                         </span>
                                     )}
                                </div>
                                <p className="text-sm text-glass-text">Select a conversation to start.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>

      {/* Mobile Config Button (Bottom Right) - Only visible in Chat View */}
      {currentView === 'chat' && activeContactId && (
        <button 
            onClick={() => setIsConfigOpen(true)}
            className="fixed md:hidden bottom-6 right-6 z-50 p-3 rounded-full bg-glass-button text-nebula-glow shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
        >
            <Settings size={24} />
        </button>
      )}

      {/* Modals */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={setCreds}
        onLogout={() => setIsAuthenticated(false)}
        currentCreds={creds}
      />

      <TemplateModal 
        isOpen={isTemplateOpen} 
        onClose={() => setIsTemplateOpen(false)}
        onSend={handleSendTemplate}
        customTemplates={customTemplates}
        onSaveTemplate={handleSaveTemplate}
      />
    </div>
  );
};

export default Page;
