"use client";

import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ConfigModal from '../components/ConfigModal';
import TemplateModal from '../components/TemplateModal';
import TemplateDashboard from '../components/TemplateDashboard';
import LoginScreen from '../components/LoginScreen';
import { Contact, Message, MessageType, MetaCredentials, WebhookLog, CustomTemplate } from '../types';
import { sendMetaTextMessage, sendMetaTemplateMessage, uploadMediaToMeta, sendMetaMediaMessage } from '../services/metaService';
import { generateCustomerReply } from '../services/geminiService';
import { Settings, Globe, MessageSquare, LayoutTemplate, LogOut } from 'lucide-react';

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'demo-user',
    name: 'Demo Customer',
    unreadCount: 1,
    lastMessage: 'Hello! I am interested in your services.',
    lastMessageTime: Date.now() - 3600000,
    messages: [
       {
         id: '1',
         text: 'Hello! I am interested in your services.',
         timestamp: Date.now() - 3600000,
         direction: 'incoming',
         status: 'read',
         type: MessageType.TEXT
       }
    ]
  }
];

const Page: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // View State
  const [currentView, setCurrentView] = useState<'chat' | 'templates'>('chat');

  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [creds, setCreds] = useState<MetaCredentials | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  
  // Custom Template State (Local cache for Chat View)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  const activeContact = contacts.find(c => c.id === activeContactId) || null;

  const addWebhookLog = (event: 'messages' | 'status' | 'system', details: string, type: 'incoming' | 'outgoing' | 'system' = 'system') => {
      const newLog: WebhookLog = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          event,
          details,
          type
      };
      setWebhookLogs(prev => [newLog, ...prev]);
  };

  // Helper to determine message type from file
  const getMessageTypeFromFile = (file: File): MessageType => {
    if (file.type.startsWith('image/')) return MessageType.IMAGE;
    if (file.type.startsWith('video/')) return MessageType.VIDEO;
    if (file.type.startsWith('audio/')) return MessageType.AUDIO;
    return MessageType.IMAGE;
  };

  const handleSendMessage = async (text: string) => {
    if (!activeContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: Date.now(),
      direction: 'outgoing',
      status: 'sent', // Initial status
      type: MessageType.TEXT
    };

    updateContactMessages(activeContact.id, newMessage);

    if (creds) {
      setIsSending(true);
      try {
        await sendMetaTextMessage(creds, activeContact.id, text);
        simulateRealTimeStatus(activeContact.id, newMessage.id);
      } catch (error) {
        console.error("Meta API Error:", error);
        addWebhookLog('status', `Failed to send to Meta: ${error}`, 'system');
      } finally {
        setIsSending(false);
      }
    } else {
        // Simulate success for offline demo
        simulateRealTimeStatus(activeContact.id, newMessage.id);
    }

    simulateIncomingReply(activeContact.id, text);
  };

  const handleSaveTemplate = (template: CustomTemplate) => {
    setCustomTemplates([...customTemplates, template]);
    addWebhookLog('system', `Template created: ${template.name}`, 'system');
  };

  const handleSendTemplate = async (templateName: string, lang: string, variables: string[] = []) => {
    if (!activeContact) return;
    setIsTemplateOpen(false);

    let displayText = `Template: ${templateName}`;
    if (variables.length > 0) {
        displayText += `\nParams: [${variables.join(', ')}]`;
    }

    const newMessage: Message = {
        id: Date.now().toString(),
        text: displayText,
        templateName,
        timestamp: Date.now(),
        direction: 'outgoing',
        status: 'sent',
        type: MessageType.TEMPLATE
    };

    updateContactMessages(activeContact.id, newMessage);

    if (creds) {
        setIsSending(true);
        try {
            await sendMetaTemplateMessage(creds, activeContact.id, templateName, lang, variables);
            simulateRealTimeStatus(activeContact.id, newMessage.id);
        } catch (e) {
            console.error(e);
            addWebhookLog('status', `Template send failed: ${e}`, 'system');
        } finally {
            setIsSending(false);
        }
    } else {
        simulateRealTimeStatus(activeContact.id, newMessage.id);
    }

    simulateIncomingReply(activeContact.id, `[System: Received template ${templateName}]`);
  };

  const handleSendMedia = async (file: File) => {
     if (!activeContact) return;
     
     const msgType = getMessageTypeFromFile(file);
     const objectUrl = URL.createObjectURL(file);

     const newMessage: Message = {
         id: Date.now().toString(),
         text: file.name, 
         mediaUrl: objectUrl,
         timestamp: Date.now(),
         direction: 'outgoing',
         status: 'sent',
         type: msgType
     };

     updateContactMessages(activeContact.id, newMessage);

     if (creds) {
        setIsSending(true);
        try {
            const uploadRes = await uploadMediaToMeta(creds, file);
            const apiType = msgType === MessageType.IMAGE ? 'image' : 
                            msgType === MessageType.VIDEO ? 'video' : 'audio';
            
            await sendMetaMediaMessage(creds, activeContact.id, apiType, uploadRes.id, file.name);
            simulateRealTimeStatus(activeContact.id, newMessage.id);
        } catch (e) {
            console.error("Media Upload/Send Failed:", e);
        } finally {
            setIsSending(false);
        }
     } else {
        simulateRealTimeStatus(activeContact.id, newMessage.id);
     }

     simulateIncomingReply(activeContact.id, `[User sent a ${msgType}]`);
  };

  const simulateRealTimeStatus = (contactId: string, msgId: string) => {
      setTimeout(() => {
          updateMessageStatus(contactId, msgId, 'delivered');
          addWebhookLog('status', `Message ${msgId} status: DELIVERED`, 'incoming');
      }, 1500 + Math.random() * 1000);

      setTimeout(() => {
          updateMessageStatus(contactId, msgId, 'read');
          addWebhookLog('status', `Message ${msgId} status: READ`, 'incoming');
      }, 3500 + Math.random() * 2000);
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

  const updateMessageStatus = (contactId: string, msgId: string, status: 'delivered' | 'read') => {
      setContacts(prev => prev.map(c => {
          if (c.id !== contactId) return c;
          return {
              ...c,
              messages: c.messages.map(m => m.id === msgId ? { ...m, status } : m)
          };
      }));
  };

  const simulateIncomingReply = useCallback(async (contactId: string, userText: string) => {
     const contact = contacts.find(c => c.id === contactId);
     const history = contact ? contact.messages.map(m => m.text || '').slice(-5) : [];
     
     setTimeout(async () => {
        setContacts(prev => prev.map(c => {
             if (c.id !== contactId) return c;
             const msgs = c.messages.map(m => ({ ...m, status: 'read' as const }));
             return { ...c, messages: msgs };
        }));

        const replyText = await generateCustomerReply(history, userText);

        const replyMsg: Message = {
            id: Date.now().toString(),
            text: replyText,
            timestamp: Date.now(),
            direction: 'incoming',
            status: 'read',
            type: MessageType.TEXT
        };

        setContacts(prev => prev.map(c => {
            if (c.id === contactId) {
                return {
                    ...c,
                    messages: [...c.messages, replyMsg],
                    lastMessage: replyText,
                    lastMessageTime: Date.now(),
                    unreadCount: c.id === activeContactId ? 0 : c.unreadCount + 1
                };
            }
            return c;
        }));
        addWebhookLog('messages', `New message from ${contactId}`, 'incoming');
     }, 5000 + Math.random() * 2000); 
  }, [activeContactId, contacts]);

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
         <div className="mb-8 w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-glow to-purple-600 flex items-center justify-center shadow-lg animate-pulse-slow">
            <Globe className="text-white" size={20} />
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
