
import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Fingerprint } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay and validation
    setTimeout(() => {
      if (identity && password) {
         if (password.length < 6) {
             setError("Security Code too short (min 6 chars)");
             setIsLoading(false);
             return;
         }
         onLogin();
      } else {
        setError("Identity verification failed.");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center relative overflow-hidden bg-nebula-dark">
       {/* Background Effects */}
       <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-nebula-glow/10 rounded-full blur-[100px] pointer-events-none"></div>
       
       <div className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-[400px] relative z-10 flex flex-col gap-8 border border-glass-border shadow-2xl animate-in fade-in zoom-in-95 duration-500 backdrop-blur-3xl bg-black/40">
          <div className="text-center space-y-3">
             <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-nebula-glow to-nebula-secondary rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,210,255,0.25)] mb-2 p-[1px]">
                 <div className="w-full h-full bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Shield className="text-white w-10 h-10 drop-shadow-lg" />
                 </div>
             </div>
             <div>
                <h1 className="text-2xl font-display font-bold text-white neon-text tracking-wider">NEBULA</h1>
                <p className="text-glass-muted text-xs uppercase tracking-[0.2em]">Secure Gateway</p>
             </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
             {error && (
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs text-center animate-in fade-in slide-in-from-top-2 font-medium flex items-center justify-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> {error}
                 </div>
             )}

             <div className="space-y-1.5">
                <label className="label-glass ml-1">User Identity</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-glass-muted w-4 h-4 group-focus-within:text-nebula-glow transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ID / Email"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        className="input-glass pl-11"
                        autoFocus
                    />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="label-glass ml-1">Access Key</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-glass-muted w-4 h-4 group-focus-within:text-nebula-glow transition-colors" />
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-glass pl-11 font-mono tracking-widest"
                    />
                </div>
             </div>

             <div className="pt-4">
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-base btn-primary w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 group shadow-lg shadow-nebula-glow/20 hover:shadow-nebula-glow/40"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
             </div>
          </form>

          <div className="text-center border-t border-glass-border pt-6 flex justify-between items-center px-2">
             <div className="flex items-center gap-2 text-[10px] text-glass-muted/50">
                 <Fingerprint size={12} /> Biometrics Disabled
             </div>
             <p className="text-[10px] text-glass-muted/50 font-mono">
                 SYS.V.2.5
             </p>
          </div>
       </div>
    </div>
  );
};

export default LoginScreen;
