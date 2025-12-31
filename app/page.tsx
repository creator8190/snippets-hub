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
    if (error) { alert("Security breach: " + error.message); } 
    else if (data) { setSnippets([data[0], ...snippets]); alert("Asset Secured."); }
    setIsSaving(false);
  };

  const handleCapture = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText) saveToDatabase(selectedText);
    else alert("Please highlight text to capture.");
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
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600/50">
      {/* Premium Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <aside className="w-24 bg-black/80 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 gap-12 sticky top-0 h-screen z-50">
        <div className="text-3xl font-serif font-black text-red-600 tracking-tighter cursor-pointer hover:scale-110 transition duration-500" onClick={() => setView('landing')}>S.</div>
        <nav className="flex flex-col gap-10 flex-1 text-2xl text-zinc-600">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'hover:text-zinc-300 transition'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'hover:text-zinc-300 transition'}>✍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'hover:text-zinc-300 transition'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-16 relative z-10">
        {view === 'landing' && (
          <div className="max-w-5xl mx-auto py-20">
            <div className="space-y-6 text-left">
              <span className="text-red-600 font-black uppercase tracking-[0.4em] text-xs">Authored Intelligence</span>
              <h1 className="text-[120px] font-serif font-bold tracking-tighter leading-[0.85] mb-12">
                Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
              </h1>
              <p className="text-2xl text-zinc-400 max-w-2xl font-light leading-relaxed mb-12 border-l border-red-600 pl-8">
                The elite ecosystem for modern authors. Capture, encrypt, and monetize your intellectual property with AI-assisted security.
              </p>
              <div className="flex gap-8">
                <button onClick={() => setView('write')} className="px-14 py-6 bg-red-600 text-white rounded-full font-black text-lg hover:bg-white hover:text-black hover:scale-105 transition-all duration-500 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                  Enter Drafting Room
                </button>
                {!user && (
                  <button onClick={() => setShowAuth(true)} className="px-14 py-6 border border-white/10 rounded-full font-bold text-lg hover:bg-white/5 transition-all">
                    Secure Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'hub' && (
          <div className="max-w-5xl mx-auto space-y-12">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
              <h2 className="text-5xl font-serif font-bold italic">Secured Assets</h2>
              <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{snippets.length} Protected Files</span>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {snippets.map((s, i) => (
                <div key={i} className="p-10 bg-zinc-900/40 backdrop-blur-xl rounded-[40px] border border-white/5 hover:border-red-600/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition">🗝️</div>
                  <p className="text-zinc-300 italic text-lg leading-relaxed mb-8">"{s.content}"</p>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-[10px] uppercase font-black text-red-600 tracking-[0.3em]">Owner Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'write' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[60px] p-20 min-h-[700px] relative border border-white/5">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Initialize your draft..."
                className="w-full h-[450px] bg-transparent outline-none text-3xl font-serif leading-relaxed resize-none text-white placeholder:text-zinc-800"
              />
              <div className="absolute bottom-16 right-16 flex items-center gap-10">
                 <button onClick={handleAiPolish} className="text-purple-500 text-sm font-black uppercase tracking-widest hover:text-purple-300 transition-all">
                   {isAiLoading ? 'Analyzing...' : '⚡ AI Polish'}
                 </button>
                 <button onClick={handleCapture} className="text-zinc-500 text-sm font-black uppercase tracking-widest hover:text-white transition-all">✂️ Snip</button>
                 <button onClick={() => saveToDatabase(content)} className="px-14 py-5 bg-white text-black rounded-full font-black shadow-2xl hover:bg-red-600 hover:text-white hover:scale-105 transition-all duration-300">
                   {isSaving ? 'Encrypting...' : 'Publish to Vault'}
                 </button>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-2xl mx-auto pt-10">
            <div className="bg-zinc-900/50 backdrop-blur-2xl rounded-[60px] border border-white/10 p-24 text-center relative overflow-hidden shadow-3xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
              <div className="w-28 h-28 bg-red-600 rounded-[35px] mx-auto mb-10 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(220,38,38,0.4)]">👤</div>
              <h2 className="uppercase tracking-[0.5em] text-[14px] font-black text-red-600 mb-4 italic">Master Editor</h2>
              <p className="text-zinc-500 mb-16 font-mono text-sm tracking-tighter">{user?.email}</p>
              <div className="grid grid-cols-3 gap-8 border-y border-white/5 py-12">
                <div><div className="text-4xl font-bold">12</div><div className="text-[10px] uppercase text-zinc-500 font-bold mt-2 tracking-widest">Active Reviews</div></div>
                <div><div className="text-4xl font-bold">4.9</div><div className="text-[10px] uppercase text-zinc-500 font-bold mt-2 tracking-widest">Trust Rating</div></div>
                <div><div className="text-4xl font-bold">{snippets.length + 150}</div><div className="text-[10px] uppercase text-zinc-500 font-bold mt-2 tracking-widest">Profit Points</div></div>
              </div>
              <button onClick={handleLogout} className="mt-16 text-zinc-600 hover:text-red-600 font-bold text-xs uppercase tracking-[0.3em] transition-all">Terminate Secure Session</button>
            </div>
          </div>
        )}

        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
            <div className="bg-zinc-900 p-20 rounded-[60px] shadow-3xl w-full max-w-xl border border-white/5 text-center">
              <h2 className="text-5xl font-serif font-bold mb-10 text-white italic">Clearance</h2>
              <div className="space-y-6 mb-12">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Access Email" className="w-full p-6 bg-black border border-white/5 rounded-3xl text-white outline-none focus:border-red-600 transition" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Code" className="w-full p-6 bg-black border border-white/5 rounded-3xl text-white outline-none focus:border-red-600 transition" />
              </div>
              <button onClick={handleLogin} className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-xl hover:bg-white hover:text-black transition-all">Grant Access</button>
              <button onClick={() => setShowAuth(false)} className="mt-8 text-zinc-600 text-sm block mx-auto hover:text-white transition">Abort</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}