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
  const [content, setContent] = useState('');
  const [snippets, setSnippets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSnippets(session.user.id);
    });
  }, []);

  async function fetchSnippets(userId: string) {
    const { data } = await supabase.from('snippets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setSnippets(data);
  }

  const handleCapture = async () => {
    if (!user) { setShowAuth(true); return; }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText.trim().length > 0) {
      const { data } = await supabase.from('snippets').insert([{ content: selectedText, user_id: user.id }]).select();
      if (data) {
        setSnippets([data[0], ...snippets]);
        alert("Snippet secured.");
      }
    } else {
      alert("Highlight text first to 'Snip' it!");
    }
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
    <div className="flex min-h-screen bg-[#f4f1ea] text-[#1a1a1a] font-sans">
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 sticky top-0 h-screen z-50">
        <div className="text-2xl font-serif font-black text-red-700 cursor-pointer hover:scale-110 transition" onClick={() => setView('landing')}>S.</div>
        <nav className="flex flex-col gap-8 flex-1 text-xl text-slate-400">
          <button onClick={() => setView('landing')} className={view === 'landing' ? 'text-red-600' : 'hover:text-red-600'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-red-600'}>✍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-slate-900' : 'hover:text-red-600'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-12">
        {view === 'landing' && (
          <div className="max-w-4xl mx-auto text-center py-20 space-y-8">
            <h1 className="text-8xl font-serif font-bold tracking-tighter leading-tight">Write. Protect. <span className="text-red-600 underline">Earn.</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">The world's first encrypted ecosystem where authors secure intellectual property.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setView('write')} className="px-10 py-4 bg-black text-white rounded-full font-bold">Open Drafting Room</button>
              <button onClick={() => setShowAuth(true)} className="px-10 py-4 border border-slate-300 rounded-full font-bold">Secure Login</button>
            </div>
          </div>
        )}

        {view === 'write' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-serif font-bold italic text-center">Private Drafting Room</h2>
            <div className="bg-white/80 backdrop-blur shadow-2xl rounded-[40px] p-12 min-h-[500px] relative border border-white">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Begin your legacy..."
                className="w-full h-[350px] bg-transparent outline-none text-xl leading-relaxed resize-none"
              />
              <div className="absolute bottom-10 right-10 flex gap-4">
                 <button onClick={handleAiPolish} className="px-6 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-bold hover:bg-purple-100 transition">
                   {isAiLoading ? 'AI Analyzing...' : '✨ AI Polish'}
                 </button>
                 <button onClick={handleCapture} className="px-6 py-2 bg-slate-100 rounded-full text-xs font-bold hover:bg-orange-100 transition">✂️ Snip Selection</button>
                 <button className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg shadow-red-200">Publish Snippet</button>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-3xl mx-auto pt-10">
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600" />
              <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">👤</div>
              <h2 className="uppercase tracking-[0.2em] text-[10px] font-black text-red-600 mb-10">Elite Student Editor</h2>
              <div className="grid grid-cols-3 gap-8 border-t pt-10">
                <div><div className="text-2xl font-bold">12</div><div className="text-[10px] uppercase text-slate-400 font-bold">Reviews Left</div></div>
                <div><div className="text-2xl font-bold">4.9</div><div className="text-[10px] uppercase text-slate-400 font-bold">Editor Rating</div></div>
                <div><div className="text-2xl font-bold">{snippets.length * 10 + 150}</div><div className="text-[10px] uppercase text-slate-400 font-black">Trust Points</div></div>
              </div>
            </div>
          </div>
        )}

        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
            <div className="bg-white p-12 rounded-[40px] shadow-2xl w-full max-w-md text-center">
              <h2 className="text-3xl font-serif font-bold mb-4 text-slate-900">Secure Access</h2>
              <div className="space-y-4 mb-6">
                <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border rounded-2xl" />
                <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-2xl" />
              </div>
              <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold">Enter the Hub</button>
              <button onClick={() => setShowAuth(false)} className="mt-4 text-slate-400 text-sm font-bold">Maybe Later</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}