
import { MetaCredentials, MetaSendMessageResponse, MetaUploadResponse, MetaTemplateResponse, CustomTemplate } from '../types';

const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = 'https://graph.facebook.com';

export const sendMetaTextMessage = async (
  creds: MetaCredentials,
  to: string,
  body: string
): Promise<MetaSendMessageResponse> => {
  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: body
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send message via Meta API');
  }

  return response.json();
};

export const sendMetaTemplateMessage = async (
  creds: MetaCredentials,
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  variables: string[] = []
): Promise<MetaSendMessageResponse> => {
  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.phoneNumberId}/messages`;
  
  const payload: any = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      }
    }
  };

  // If variables exist, add the components structure
  if (variables.length > 0) {
    payload.template.components = [
      {
        type: "body",
        parameters: variables.map(variable => ({
          type: "text",
          text: variable
        }))
      }
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send template via Meta API');
  }

  return response.json();
};

export const uploadMediaToMeta = async (
  creds: MetaCredentials,
  file: File
): Promise<MetaUploadResponse> => {
  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.phoneNumberId}/media`;
  
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
      // Content-Type is automatically set by fetch when using FormData
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload media to Meta API');
  }

  return response.json();
};

export const sendMetaMediaMessage = async (
  creds: MetaCredentials,
  to: string,
  type: 'image' | 'video' | 'audio',
  mediaId: string,
  caption?: string
): Promise<MetaSendMessageResponse> => {
  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.phoneNumberId}/messages`;
  
  const mediaObject: any = {
    id: mediaId
  };

  if (caption && type !== 'audio') {
    mediaObject.caption = caption;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: type,
    [type]: mediaObject
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send media message via Meta API');
  }

  return response.json();
};

export const retrieveMediaUrl = async (
  creds: MetaCredentials,
  mediaId: string
): Promise<string> => {
  // 1. Get the Media URL
  const urlResponse = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${creds.accessToken}` }
  });
  
  if (!urlResponse.ok) throw new Error('Failed to get media URL');
  const { url } = await urlResponse.json();

  // 2. Download the binary data
  const binaryResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${creds.accessToken}` }
  });

  if (!binaryResponse.ok) throw new Error('Failed to download media binary');
  const blob = await binaryResponse.blob();
  
  return URL.createObjectURL(blob);
};

// --- Template Management APIs ---

export const getMetaTemplates = async (
  creds: MetaCredentials
): Promise<CustomTemplate[]> => {
  if (!creds.wabaId) {
    throw new Error('WABA ID is required to fetch templates');
  }

  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.wabaId}/message_templates?limit=100`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch templates');
  }

  const data: MetaTemplateResponse = await response.json();
  
  // Transform raw data to our CustomTemplate type (adding helpers)
  return data.data.map(t => {
    const bodyComp = t.components.find(c => c.type === 'BODY');
    const text = bodyComp?.text || '';
    const matches = text.match(/{{(\d+)}}/g);
    const variableCount = matches ? new Set(matches).size : 0;

    return {
      ...t,
      body: text,
      variableCount
    };
  });
};

export const createMetaTemplate = async (
  creds: MetaCredentials,
  templateData: CustomTemplate
): Promise<any> => {
  if (!creds.wabaId) {
    throw new Error('WABA ID is required to create templates');
  }

  const url = `${BASE_URL}/${GRAPH_API_VERSION}/${creds.wabaId}/message_templates`;

  // Clean up the object for API (remove frontend helpers)
  const payload = {
    name: templateData.name,
    category: templateData.category,
    allow_category_change: true,
    language: "en_US", // Simplified for demo
    components: templateData.components
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create template');
  }

  return response.json();
};
