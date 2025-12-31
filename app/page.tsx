"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZATION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SnippetsHub() {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('landing'); 
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [snippets, setSnippets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSnippets(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSnippets(session.user.id);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchSnippets(userId: string) {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Data fetch error:", error.message);
    if (data) setSnippets(data);
  }

  // --- ACTIONS ---
  const handleAuth = async () => {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Signup Error: " + error.message);
      } else {
        alert("Success! Check your email for a confirmation link.");
        setIsSignUp(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Login Error: " + error.message);
      } else {
        setUser(data.user);
        setShowAuth(false);
        fetchSnippets(data.user.id);
        setView('hub');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSnippets([]);
    setView('landing');
  };

  const saveToDatabase = async (textToSave: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!textToSave.trim()) {
      alert("The vault cannot protect empty space. Write something first.");
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('snippets')
      .insert([{ content: textToSave, user_id: user?.id }])
      .select();

    if (error) {
      alert("Encryption Failed: " + error.message);
    } else if (data) {
      setSnippets([data[0], ...snippets]);
      alert("Asset successfully secured in the Vault.");
    }
    setIsSaving(false);
  };

  const handleCapture = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selectedText) {
      saveToDatabase(selectedText);
    } else {
      alert("Highlight a specific phrase or sentence to 'Snip' and secure it.");
    }
  };

  const handleAiPolish = async () => {
    if (!content) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', { 
        method: 'POST', 
        body: JSON.stringify({ text: content }) 
      });
      const data = await res.json();
      setContent(prev => prev + "\n\n" + (data.suggestion || "AI could not process this request."));
    } catch (err) { 
      console.error(err); 
      alert("AI Service currently unavailable.");
    } finally { 
      setIsAiLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600/50 overflow-x-hidden">
      
      {/* BACKGROUND AESTHETIC LAYER */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 blur-[150px] rounded-full" />
      </div>

      {/* NAVIGATION SIDEBAR */}
      <aside className="w-24 bg-black/80 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 gap-12 sticky top-0 h-screen z-50">
        <div 
          className="text-3xl font-serif font-black text-red-600 tracking-tighter cursor-pointer hover:scale-110 transition duration-500" 
          onClick={() => setView('landing')}
        >
          S.
        </div>
        <nav className="flex flex-col gap-12 flex-1 text-2xl text-zinc-600">
          <button 
            onClick={() => setView('hub')} 
            className={view === 'hub' ? 'text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'hover:text-zinc-300 transition'}
            title="Vault"
          >
            🏛️
          </button>
          <button 
            onClick={() => setView('write')} 
            className={view === 'write' ? 'text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'hover:text-zinc-300 transition'}
            title="Draft"
          >
            ✍️
          </button>
          <button 
            onClick={() => setView('profile')} 
            className={view === 'profile' ? 'text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'hover:text-zinc-300 transition'}
            title="Profile"
          >
            👤
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-16 relative z-10">
        
        {/* LANDING VIEW */}
        {view === 'landing' && (
          <div className="max-w-5xl mx-auto py-20">
            <div className="space-y-8 text-left animate-in fade-in slide-in-from-left-8 duration-1000">
              <span className="text-red-600 font-black uppercase tracking-[0.5em] text-xs">Authored Intelligence</span>
              <h1 className="text-[120px] font-serif font-bold tracking-tighter leading-[0.85] mb-12">
                Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
              </h1>
              <p className="text-2xl text-zinc-400 max-w-2xl font-light leading-relaxed mb-16 border-l-2 border-red-600 pl-10">
                The world's most secure ecosystem for elite authors. Secure your IP and monetize your talent.
              </p>
              <div className="flex gap-10">
                <button 
                  onClick={() => setView('write')} 
                  className="px-16 py-7 bg-red-600 text-white rounded-full font-black text-xl hover:bg-white hover:text-black transition-all duration-500 shadow-[0_0_50px_rgba(220,38,38,0.4)]"
                >
                  Enter Drafting Room
                </button>
                {!user && (
                  <button 
                    onClick={() => { setIsSignUp(false); setShowAuth(true); }} 
                    className="px-16 py-7 border border-white/10 rounded-full font-bold text-xl hover:bg-white/5 transition-all"
                  >
                    Secure Access
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VAULT/HUB VIEW */}
        {view === 'hub' && (
          <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-10">
              <h2 className="text-6xl font-serif font-bold italic">The Vault</h2>
              <div className="text-right">
                <span className="text-red-600 font-black block text-xs tracking-widest uppercase mb-1">Status: Secured</span>
                <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{snippets.length} Assets Found</span>
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {snippets.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                  <p className="text-zinc-600 text-xl font-serif italic">Your vault is currently empty. Start drafting to secure assets.</p>
                </div>
              ) : (
                snippets.map((s, i) => (
                  <div key={i} className="p-12 bg-zinc-900/40 backdrop-blur-3xl rounded-[50px] border border-white/5 hover:border-red-600/40 transition-all duration-500 group relative">
                    <div className="absolute top-8 right-8 text-white/5 group-hover:text-red-600/30 transition-colors">🗝️</div>
                    <p className="text-zinc-300 italic text-xl leading-relaxed mb-10">"{s.content}"</p>
                    <div className="flex justify-between items-center pt-8 border-t border-white/5">
                      <span className="text-[10px] uppercase font-black text-red-600 tracking-[0.4em]">Proof of Ownership</span>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DRAFTING ROOM VIEW */}
        {view === 'write' && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <header className="mb-12 text-center">
               <h2 className="text-4xl font-serif font-bold italic text-white/90">Drafting Room</h2>
               <div className="h-1 w-20 bg-red-600 mx-auto mt-4 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
             </header>

            <div className="bg-zinc-900/50 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.6)] rounded-[80px] p-24 min-h-[750px] relative border border-white/5">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Initialize your next masterpiece..."
                className="w-full h-[450px] bg-transparent outline-none text-4xl font-serif leading-relaxed resize-none text-white placeholder:text-zinc-800"
              />
              
              <div className="absolute bottom-20 right-20 flex items-center gap-12">
                 <button 
                  onClick={handleAiPolish} 
                  className="text-purple-500 text-sm font-black uppercase tracking-[0.2em] hover:text-purple-300 transition-all active:scale-90"
                 >
                   {isAiLoading ? 'Analyzing...' : '⚡ AI Polish'}
                 </button>
                 <button 
                  onClick={handleCapture} 
                  className="text-zinc-500 text-sm font-black uppercase tracking-[0.2em] hover:text-white transition-all active:scale-90"
                 >
                   ✂️ Snip
                 </button>
                 <button 
                  onClick={() => saveToDatabase(content)} 
                  disabled={isSaving}
                  className="px-16 py-6 bg-white text-black rounded-full font-black text-lg shadow-2xl hover:bg-red-600 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-zinc-800 disabled:text-zinc-600"
                 >
                   {isSaving ? 'Encrypting...' : 'Publish & Earn'}
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="max-w-3xl mx-auto pt-10 animate-in fade-in duration-500">
            <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-[70px] border border-white/10 p-24 text-center relative overflow-hidden shadow-3xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
              
              <div className="w-32 h-32 bg-red-600 rounded-[40px] mx-auto mb-12 flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(220,38,38,0.5)] rotate-3">
                👤
              </div>
              
              <h2 className="uppercase tracking-[0.6em] text-[16px] font-black text-red-600 mb-4 italic">Verified Editor</h2>
              <p className="text-zinc-400 mb-16 font-mono text-sm tracking-widest">{user?.email || "GUEST_SESSION"}</p>
              
              <div className="grid grid-cols-3 gap-10 border-y border-white/5 py-14">
                <div>
                  <div className="text-5xl font-bold mb-2 text-white">12</div>
                  <div className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Active Credits</div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2 text-white">4.9</div>
                  <div className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Trust Index</div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2 text-white">{snippets.length + 150}</div>
                  <div className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Profit Points</div>
                </div>
              </div>
              
              <button 
                onClick={handleLogout} 
                className="mt-20 text-zinc-600 hover:text-red-600 font-black text-xs uppercase tracking-[0.4em] transition-all hover:tracking-[0.6em]"
              >
                Terminate Session
              </button>
            </div>
          </div>
        )}

        {/* AUTH MODAL OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg p-6">
            <div className="bg-zinc-900 p-20 rounded-[80px] shadow-[0_0_100px_rgba(0,0,0,1)] w-full max-w-2xl border border-white/5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 bg-red-600 h-full" />
              
              <h2 className="text-6xl font-serif font-bold mb-6 text-white italic">
                {isSignUp ? 'Apply for Access' : 'Security Clearance'}
              </h2>
              <p className="text-zinc-500 mb-12 text-lg">
                {isSignUp ? 'Join the elite ranks of verified authors.' : 'Enter your credentials to access the vault.'}
              </p>
              
              <div className="space-y-6 mb-14">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Identification Email" 
                  className="w-full p-7 bg-black border border-white/5 rounded-3xl text-white outline-none focus:border-red-600 transition-all text-xl" 
                />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Secret Access Code" 
                  className="w-full p-7 bg-black border border-white/5 rounded-3xl text-white outline-none focus:border-red-600 transition-all text-xl" 
                />
              </div>
              
              <button 
                onClick={handleAuth} 
                className="w-full py-7 bg-red-600 text-white rounded-3xl font-black text-2xl hover:bg-white hover:text-black transition-all duration-500"
              >
                {isSignUp ? 'Request Profile' : 'Grant Access'}
              </button>
              
              <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="mt-10 text-zinc-400 text-sm block mx-auto hover:text-red-600 transition-all font-bold tracking-widest uppercase"
              >
                {isSignUp ? 'Already have clearance? Log In' : 'New to the system? Apply for Access'}
              </button>
              
              <button 
                onClick={() => setShowAuth(false)} 
                className="mt-6 text-zinc-800 text-xs block mx-auto hover:text-zinc-500 transition uppercase tracking-tighter"
              >
                Abort Operation
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}