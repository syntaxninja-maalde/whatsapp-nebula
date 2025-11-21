
export interface MetaCredentials {
  accessToken: string;
  phoneNumberId: string;
  wabaId?: string; // WhatsApp Business Account ID
  businessName?: string; // Added for branding
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  TEMPLATE = 'template',
  AUDIO = 'audio',
  VIDEO = 'video'
}

export interface Message {
  id: string;
  text?: string;
  mediaUrl?: string;
  mediaId?: string; // Added to support fetching media later if it fails initially
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: MessageType;
  templateName?: string;
}

export interface Contact {
  id: string; // Phone number
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  messages: Message[];
}

// --- Enhanced Template Types for Meta API ---

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
  text: string;
  phoneNumber?: string;
  url?: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'; // For Header
  text?: string; // For Header, Body, Footer
  buttons?: TemplateButton[]; // For Buttons component
  example?: { header_handle?: string[]; body_text?: string[][] }; // Meta requirement for variable examples
}

export interface CustomTemplate {
  id: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: TemplateCategory;
  components: TemplateComponent[];
  
  // Helpers for UI display (calculated from components)
  body?: string; 
  variableCount?: number;
}

export interface WebhookLog {
  id: string;
  timestamp: number;
  event: 'messages' | 'status' | 'system';
  details: string;
  type: 'incoming' | 'outgoing' | 'system';
}

// Meta API Response Types
export interface MetaSendMessageResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export interface MetaUploadResponse {
  id: string;
}

export interface MetaTemplateResponse {
  data: CustomTemplate[];
  paging: { cursors: { before: string; after: string } };
}
