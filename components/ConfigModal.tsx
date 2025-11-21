import React, { useState, useEffect } from 'react';
import { MetaCredentials } from '../types';
import { X, Settings, Key, Phone, Shield, Briefcase, LogOut } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (creds: MetaCredentials) => void;
  onLogout: () => void;
  currentCreds: MetaCredentials | null;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, onLogout, currentCreds }) => {
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [businessName, setBusinessName] = useState('My Business');

  useEffect(() => {
    if (currentCreds) {
      setAccessToken(currentCreds.accessToken);
      setPhoneNumberId(currentCreds.phoneNumberId);
      setWabaId(currentCreds.wabaId || '');
      setBusinessName(currentCreds.businessName || 'My Business');
    }
  }, [currentCreds]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!accessToken || !phoneNumberId) {
        alert("Token and Phone Number ID are required");
        return;
    }
    onSave({ accessToken, phoneNumberId, wabaId, businessName });
    onClose();
  };

  const handleLogout = () => {
    if(confirm('Are you sure you want to disconnect your session?')) {
        onLogout();
        onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="glass-panel w-[90%] max-w-md rounded-2xl p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorational Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-nebula-glow blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2 neon-text">
            <Settings className="w-6 h-6 text-nebula-glow" /> System Config
          </h2>
          <button onClick={onClose} className="btn-base btn-ghost btn-icon text-glass-muted hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5 relative z-10">
          
          <div>
            <label className="label-glass">
                <Briefcase size={12}/> Business Display Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-glass"
              placeholder="e.g. Nebula Tech"
            />
          </div>

          <div className="h-[1px] bg-glass-border my-2"></div>

          <div>
            <label className="label-glass">
                <Shield size={12}/> Meta Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="input-glass font-mono"
              placeholder="EAAG..."
            />
          </div>

          <div>
            <label className="label-glass">
                <Phone size={12}/> Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="input-glass font-mono"
              placeholder="100234..."
            />
          </div>

           <div>
            <label className="label-glass">
                <Key size={12}/> WABA ID (Optional)
            </label>
            <input
              type="text"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              className="input-glass font-mono"
              placeholder="Business ID"
            />
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center gap-3 relative z-10">
          <button onClick={handleLogout} className="btn-base btn-ghost text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2">
             <LogOut size={16} /> Disconnect
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-base btn-glass px-6 py-3 rounded-xl text-sm font-medium">
                Cancel
            </button>
            <button onClick={handleSave} className="btn-base btn-primary px-8 py-3 rounded-xl text-sm font-bold tracking-wide">
                Initialize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;