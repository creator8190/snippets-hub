"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SnippetsHub() {
  const [view, setView] = useState('landing'); 
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [snippets, setSnippets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSnippets(session.user.id);
    });
  }, []);

  async function fetchSnippets(userId: string) {
    const { data } = await supabase.from('snippets').select('*').order('created_at', { ascending: false });
    if (data) setSnippets(data);
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); } 
    else { setUser(data.user); setShowAuth(false); fetchSnippets(data.user.id); setView('hub'); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  const saveToDatabase = async (textToSave: string) => {
    if (!textToSave.trim()) return;
    setIsSaving(true);
    const { data, error } = await supabase.from('snippets').insert([{ content: textToSave, user_id: user?.id }]).select();
    if (error) { alert("Save failed: " + error.message); } 
    else if (data) { setSnippets([data[0], ...snippets]); alert("Snippet secured."); }
    setIsSaving(false);
  };

  const handleCapture = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText) saveToDatabase(selectedText);
    else alert("Highlight text first!");
  };

  const handleAiPolish = async () => {
    if (!content) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ text: content }) });
      const data = await res.json();
      setContent(prev => prev + "\n\n" + data.suggestion);
    } catch (err) { console.error(err); } finally { setIsAiLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-red-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <aside className="w-20 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 gap-10 sticky top-0 h-screen z-50">
        <div className="text-2xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition" onClick={() => setView('landing')}>S.</div>
        <nav className="flex flex-col gap-10 flex-1 text-xl text-slate-500">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-white' : 'hover:text-red-500 transition'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-500' : 'hover:text-red-500 transition'}>✍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-white' : 'hover:text-red-500 transition'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-12 relative z-10">
        {view === 'landing' && (
          <div className="max-w-4xl mx-auto text-center py-32 space-y-10">
            <h1 className="text-9xl font-serif font-bold tracking-tighter leading-[0.8] text-white">
              The <span className="text-red-600">Vault</span> <br/> of Words.
            </h1>
            <p className="text-xl text-slate-400 max-w-xl mx-auto font-light leading-relaxed">Secure your intellectual property in a high-fidelity drafting environment.</p>
            <div className="flex justify-center gap-6">
              <button onClick={() => setView('write')} className="px-12 py-5 bg-white text-black rounded-full font-black hover:bg-red-600 hover:text-white transition-all duration-300">Start Drafting</button>
              {!user && <button onClick={() => setShowAuth(true)} className="px-12 py-5 border border-white/20 rounded-full font-bold hover:bg-white/5 transition">Secure Access</button>}
            </div>
          </div>
        )}

        {view === 'hub' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-serif font-bold text-white">Your Secured Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {snippets.map((s, i) => (
                <div key={i} className="p-8 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 hover:border-red-600/50 transition-all group">
                  <p className="text-slate-300 italic leading-relaxed">"{s.content}"</p>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-red-600 tracking-[0.2em]">Verified Asset</span>
                    <span className="text-[10px] text-slate-500">ID: {s.id.toString().slice(-4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'write' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white/5 backdrop-blur-2xl shadow-2xl rounded-[48px] p-16 min-h-[600px] relative border border-white/10">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your legacy..."
                className="w-full h-[400px] bg-transparent outline-none text-2xl font-serif leading-relaxed resize-none text-white placeholder:text-slate-700"
              />
              <div className="absolute bottom-12 right-12 flex items-center gap-6">
                 <button onClick={handleAiPolish} className="text-purple-400 text-xs font-black uppercase tracking-widest hover:text-purple-300 transition">
                   {isAiLoading ? 'Analyzing...' : '✨ AI Polish'}
                 </button>
                 <button onClick={handleCapture} className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-white transition">✂️ Snip</button>
                 <button onClick={() => saveToDatabase(content)} className="px-10 py-4 bg-red-600 text-white rounded-full font-black shadow-2xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all">
                   {isSaving ? 'Securing...' : 'Publish to Vault'}
                 </button>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-2xl mx-auto pt-10 text-center">
            <div className="bg-gradient-to-b from-white/10 to-transparent backdrop-blur-md rounded-[48px] border border-white/10 p-20">
              <div className="w-24 h-24 bg-red-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl shadow-2xl shadow-red-600/20 rotate-3">👤</div>
              <h2 className="uppercase tracking-[0.3em] text-[12px] font-black text-red-600 mb-2">Elite Content Editor</h2>
              <p className="text-slate-400 mb-12 font-mono text-sm">{user?.email}</p>
              <div className="grid grid-cols-3 gap-12 border-y border-white/10 py-10">
                <div><div className="text-3xl font-bold text-white">12</div><div className="text-[10px] uppercase text-slate-500 font-bold mt-1">Reviewers</div></div>
                <div><div className="text-3xl font-bold text-white">4.9</div><div className="text-[10px] uppercase text-slate-500 font-bold mt-1">Rating</div></div>
                <div><div className="text-3xl font-bold text-white">{snippets.length + 150}</div><div className="text-[10px] uppercase text-slate-500 font-bold mt-1">Trust</div></div>
              </div>
              <button onClick={handleLogout} className="mt-12 text-slate-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition">Terminate Session</button>
            </div>
          </div>
        )}

        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
            <div className="bg-[#1e293b] p-16 rounded-[48px] shadow-3xl w-full max-w-md border border-white/10 text-center">
              <h2 className="text-4xl font-serif font-bold mb-8 text-white">Vault Access</h2>
              <div className="space-y-4 mb-8">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-5 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 transition" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-5 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 transition" />
              </div>
              <button onClick={handleLogin} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-900/20 hover:bg-red-700 transition">Unlock</button>
              <button onClick={() => setShowAuth(false)} className="mt-6 text-slate-500 text-sm block mx-auto hover:text-white transition">Return</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}