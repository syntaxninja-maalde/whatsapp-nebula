
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ConfigModal from '../components/ConfigModal';
import TemplateModal from '../components/TemplateModal';
import TemplateDashboard from '../components/TemplateDashboard';
import LoginScreen from '../components/LoginScreen';
import { Contact, Message, MessageType, MetaCredentials, WebhookLog, CustomTemplate } from '../types';
import { sendMetaTextMessage, sendMetaTemplateMessage, uploadMediaToMeta, sendMetaMediaMessage, retrieveMediaUrl, getMetaTemplates } from '../services/metaService';
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
  
  // Custom Template State (Fetched from Meta)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const activeContact = contacts.find(c => c.id === activeContactId) || null;

  // 1. Load Data from LocalStorage on Mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('wb_contacts');
    const savedCreds = localStorage.getItem('wb_creds');
    
    if (savedContacts) {
        try { setContacts(JSON.parse(savedContacts)); } catch (e) { console.error(e); }
    }
    if (savedCreds) {
        try { setCreds(JSON.parse(savedCreds)); } catch (e) { console.error(e); }
    }
  }, []);

  // 2. Save Data to LocalStorage on Change
  useEffect(() => {
    localStorage.setItem('wb_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (creds) {
        localStorage.setItem('wb_creds', JSON.stringify(creds));
        // Fetch real templates when creds are available
        if (creds.wabaId) {
            getMetaTemplates(creds)
                .then(setCustomTemplates)
                .catch(err => console.error("Failed to auto-fetch templates", err));
        }
    }
  }, [creds]);

  // 3. Retroactive Media Fetching (The fix for "Encrypting Image..." issue)
  useEffect(() => {
    if (!creds) return;

    const fetchMissingMedia = async () => {
        const contactsCopy = [...contacts];
        let hasChanges = false;

        for (const contact of contactsCopy) {
            for (const msg of contact.messages) {
                // If it's media, incoming, has a mediaId but NO mediaUrl
                if ((msg.type === MessageType.IMAGE || msg.type === MessageType.VIDEO || msg.type === MessageType.AUDIO) && 
                    msg.mediaId && 
                    !msg.mediaUrl && 
                    msg.direction === 'incoming') {
                    
                    try {
                        console.log(`Fetching missing media for msg ${msg.id}`);
                        const url = await retrieveMediaUrl(creds, msg.mediaId);
                        msg.mediaUrl = url;
                        hasChanges = true;
                    } catch (e) {
                        console.error(`Failed to retro-fetch media for ${msg.id}`, e);
                    }
                }
            }
        }

        if (hasChanges) {
            setContacts(contactsCopy);
        }
    };

    // Debounce slightly to avoid spamming on load
    const timeout = setTimeout(fetchMissingMedia, 1000);
    return () => clearTimeout(timeout);
  }, [creds, contacts.length]); // Re-run if creds change or new contacts added (which implies new messages)

  // 4. WebSocket Connection Logic
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
        if (wsRef.current) wsRef.current.close();
    };
  }, [isAuthenticated, creds]); 

  // 5. Handle Incoming WS Messages
  const handleWebSocketMessage = async (payload: any) => {
      const { type, data } = payload;

      if (type === 'message') {
          const contactId = data.from;
          const timestamp = parseInt(data.timestamp) * 1000 || Date.now();
          
          let messageType = MessageType.TEXT;
          let text = data.text || '';
          let mediaId = undefined;

          if (data.media) {
              const mime = data.media.mime_type || '';
              if (mime.startsWith('image')) messageType = MessageType.IMAGE;
              else if (mime.startsWith('video')) messageType = MessageType.VIDEO;
              else if (mime.startsWith('audio')) messageType = MessageType.AUDIO;
              
              text = data.media.caption || text;
              mediaId = data.media.id;
          }

          const newMessage: Message = {
              id: data.id,
              text: text,
              mediaUrl: undefined, // Start undefined, fetch later or immediately below
              mediaId: mediaId,
              timestamp: timestamp,
              direction: 'incoming',
              status: 'read',
              type: messageType
          };

          // Optimistically fetch media URL if creds are available right now
          if (mediaId && creds) {
             retrieveMediaUrl(creds, mediaId).then(url => {
                 setContacts(prev => prev.map(c => {
                      if (c.id !== contactId) return c;
                      return {
                          ...c,
                          messages: c.messages.map(m => m.id === newMessage.id ? { ...m, mediaUrl: url } : m)
                      };
                  }));
             }).catch(e => console.error("Immediate fetch failed, relying on retro-fetch", e));
          }

          // Update Contact State with new message
          setContacts(prev => {
              const existing = prev.find(c => c.id === contactId);
              if (existing) {
                  if (existing.messages.some(m => m.id === newMessage.id)) return prev;
                  return prev.map(c => c.id === contactId ? {
                      ...c,
                      messages: [...c.messages, newMessage],
                      lastMessage: messageType === MessageType.TEXT ? text : `Sent ${messageType}`,
                      lastMessageTime: timestamp,
                      unreadCount: c.id === activeContactId ? 0 : c.unreadCount + 1
                  } : c);
              } else {
                  return [{
                      id: contactId,
                      name: `+${contactId}`,
                      unreadCount: 1,
                      messages: [newMessage],
                      lastMessage: messageType === MessageType.TEXT ? text : `Sent ${messageType}`,
                      lastMessageTime: timestamp
                  }, ...prev];
              }
          });

      } else if (type === 'status') {
          const contactId = data.recipient_id;
          const msgId = data.id;
          const newStatus = data.status;

          setContacts(prev => prev.map(c => {
              if (c.id !== contactId) return c;
              return {
                  ...c,
                  messages: c.messages.map(m => m.id === msgId ? { ...m, status: newStatus } : m)
              };
          }));
      }
  };

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
      const realId = response.messages[0].id;
      setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m) } : c));
    } catch (error: any) {
      alert(`Failed to send: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async (templateName: string, lang: string, variables: string[] = []) => {
    if (!activeContact || !creds) return;
    setIsTemplateOpen(false);
    const tempId = 'temp_' + Date.now();
    const newMessage: Message = {
        id: tempId,
        text: `Template: ${templateName}`,
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
        setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m) } : c));
    } catch (e: any) {
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
        setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...m, id: realId } : m) } : c));
     } catch (e: any) {
        alert(`Media send failed: ${e.message}`);
     } finally {
        setIsSending(false);
     }
  };

  const updateContactMessages = (contactId: string, message: Message) => {
    setContacts(prev => prev.map(c => c.id === contactId ? {
        ...c,
        messages: [...c.messages, message],
        lastMessage: message.type === MessageType.TEXT ? message.text : `Sent ${message.type}`,
        lastMessageTime: message.timestamp,
        unreadCount: 0
    } : c));
  };

  const handleNewChat = () => {
     const phone = prompt("Enter phone number (with country code, e.g., 15550001234):");
     if (phone) {
        const exists = contacts.find(c => c.id === phone);
        if (exists) setActiveContactId(exists.id);
        else {
            setContacts([{ id: phone, name: `+${phone}`, unreadCount: 0, messages: [], lastMessage: '', lastMessageTime: undefined }, ...contacts]);
            setActiveContactId(phone);
        }
     }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans relative z-0 bg-nebula-dark">
      <div className="hidden md:flex w-[80px] flex-col items-center py-8 border-r border-glass-border glass-panel z-30">
         <div className="mb-8 w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-glow to-purple-600 flex items-center justify-center shadow-lg relative group cursor-pointer" title={isConnected ? "Server Connected" : "Connecting..."}>
            <Globe className="text-white" size={20} />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-black ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
         </div>
         <div className="flex-1 flex flex-col gap-6 w-full items-center">
            <button onClick={() => setCurrentView('chat')} className={`btn-base p-3 rounded-xl transition-all duration-300 ${currentView === 'chat' ? 'bg-white/10 text-nebula-glow' : 'text-glass-muted hover:text-white'}`}><MessageSquare size={24} /></button>
            <button onClick={() => setCurrentView('templates')} className={`btn-base p-3 rounded-xl transition-all duration-300 ${currentView === 'templates' ? 'bg-white/10 text-pink-400' : 'text-glass-muted hover:text-white'}`}><LayoutTemplate size={24} /></button>
         </div>
         <div className="flex flex-col gap-4 items-center w-full mb-4">
            <button onClick={() => setIsConfigOpen(true)} className="btn-base p-3 rounded-xl text-glass-muted hover:text-white hover:bg-white/5"><Settings size={24} /></button>
            <button onClick={() => { setIsAuthenticated(false); setCurrentView('chat'); }} className="btn-base p-3 rounded-xl text-glass-muted hover:text-red-400 hover:bg-white/5"><LogOut size={24} /></button>
         </div>
      </div>
      <div className="flex-1 flex relative overflow-hidden">
        {currentView === 'templates' ? (
            <TemplateDashboard creds={creds} onBack={() => setCurrentView('chat')} />
        ) : (
            <>
                <Sidebar contacts={contacts} activeContactId={activeContactId} onSelectContact={setActiveContactId} onNewChat={handleNewChat} onSettings={() => setIsConfigOpen(true)} onLogout={() => setIsAuthenticated(false)} className={`${activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] border-r border-glass-border`} />
                <div className={`${activeContactId ? 'flex' : 'hidden md:flex'} flex-1 h-full relative`}>
                    {activeContact ? (
                        <ChatWindow contact={activeContact} onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} onOpenTemplates={() => setIsTemplateOpen(true)} isSending={isSending} onBack={() => setActiveContactId(null)} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center glass-panel z-10 rounded-none w-full h-full">
                             <div className="md:hidden absolute bottom-20 flex gap-4">
                                <button onClick={() => setCurrentView('chat')} className="btn-base px-6 py-3 rounded-full font-bold bg-nebula-glow text-black">Chats</button>
                                <button onClick={() => setCurrentView('templates')} className="btn-base px-6 py-3 rounded-full font-bold btn-glass">Templates</button>
                             </div>
                            <div className="text-center p-8">
                                <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 neon-text animate-float">{creds?.businessName || 'WhatsBiz Nebula'}</h1>
                                <div className="flex items-center justify-center gap-2 text-sm text-glass-muted mb-6">{isConnected ? <span className="text-green-400 flex items-center gap-1"><Wifi size={12} /> Connected</span> : <span className="text-red-400 flex items-center gap-1"><WifiOff size={12} /> Disconnected</span>}</div>
                                <p className="text-sm text-glass-text">Select a conversation to start.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
      {currentView === 'chat' && activeContactId && <button onClick={() => setIsConfigOpen(true)} className="fixed md:hidden bottom-6 right-6 z-50 p-3 rounded-full bg-glass-button text-nebula-glow"><Settings size={24} /></button>}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} onSave={setCreds} onLogout={() => setIsAuthenticated(false)} currentCreds={creds} />
      <TemplateModal isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} onSend={handleSendTemplate} customTemplates={customTemplates} onSaveTemplate={template => setCustomTemplates([...customTemplates, template])} />
    </div>
  );
};

export default Page;
