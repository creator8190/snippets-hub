"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SnippetsHub() {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('landing'); 
  const [showAuth, setShowAuth] = useState(false);
  const [content, setContent] = useState('');
  const [snippets, setSnippets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- DATABASE SYNC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSnippets(session.user.id);
    });
  }, []);

  async function fetchSnippets(userId: string) {
    const { data } = await supabase
      .from('snippets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setSnippets(data);
  }

  // --- AI POLISH LOGIC ---
  const handleAiPolish = async () => {
    if (!content) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      setContent(prev => prev + "\n\n" + data.suggestion);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- SNIPPET CAPTURE LOGIC ---
  const handleCaptureSnippet = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const selection = window.getSelection()?.toString();
    
    if (selection && selection.trim().length > 0) {
      const { data, error } = await supabase
        .from('snippets')
        .insert([{ content: selection, user_id: user.id }])
        .select();

      if (!error && data) {
        setSnippets([data[0], ...snippets]);
        alert("Snippet Protected & Saved.");
      }
    } else {
      alert("Please highlight text in your draft first!");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f1ea] text-[#1a1a1a] font-sans">
      {/* SIDEBAR ARCHITECTURE (Matches your photo) */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 sticky top-0 h-screen z-50">
        <div className="text-2xl font-serif font-black text-red-700 underline cursor-pointer" onClick={() => setView('landing')}>S.</div>
        <nav className="flex flex-col gap-8 flex-1 text-xl text-slate-300">
          <button onClick={() => setView('hub')} className={`hover:text-slate-900 transition ${view === 'hub' ? 'text-slate-900' : ''}`}>🏛️</button>
          <button onClick={() => setView('write')} className={`hover:text-orange-600 transition ${view === 'write' ? 'text-orange-600' : ''}`}>✍️</button>
          <button onClick={() => setView('profile')} className={`hover:text-slate-900 transition ${view === 'profile' ? 'text-slate-900' : ''}`}>👤</button>
          <button onClick={() => setView('shop')} className={`hover:text-slate-900 transition ${view === 'shop' ? 'text-slate-900' : ''}`}>🛍️</button>
        </nav>
        <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exit</button>
      </aside>

      <main className="flex-1 p-8 md:p-12 lg:p-16 relative">
        {/* LANDING VIEW */}
        {view === 'landing' && (
          <div className="max-w-4xl mx-auto text-center py-20 space-y-10">
            <h1 className="text-8xl font-serif font-bold tracking-tighter leading-none">
              Write. Protect. <span className="text-red-600 underline underline-offset-8">Earn.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              The world's first encrypted ecosystem where authors secure their intellectual property.
            </p>
            <div className="flex justify-center gap-6">
              <button onClick={() => setShowAuth(true)} className="px-12 py-5 bg-black text-white rounded-full font-bold shadow-xl hover:scale-105 transition">Join the Hub — Free</button>
              <button onClick={() => setView('hub')} className="px-12 py-5 border-2 border-slate-200 rounded-full font-bold hover:bg-white transition">Preview Gallery</button>
            </div>
          </div>
        )}

        {/* WRITE VIEW (Drafting Room) */}
        {view === 'write' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <h2 className="text-4xl font-serif font-bold italic">Private Drafting Room</h2>
                <div className="flex gap-3">
                    <button onClick={handleAiPolish} className="px-5 py-2 bg-purple-100 text-purple-700 rounded-full font-bold text-sm hover:bg-purple-200 transition">
                        {isAiLoading ? "AI Scanning..." : "✨ AI Polish"}
                    </button>
                    <button onClick={handleCaptureSnippet} className="px-5 py-2 bg-orange-100 text-orange-700 rounded-full font-bold text-sm hover:bg-orange-200 transition">
                        ✂️ Capture Snippet
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-2xl rounded-[45px] p-16 min-h-[600px] border border-slate-100 relative group">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Begin your legacy..."
                className="w-full h-[450px] bg-transparent outline-none text-2xl font-serif leading-relaxed resize-none text-slate-800"
              />
              <div className="absolute bottom-12 right-12">
                <button className="px-10 py-4 bg-red-600 text-white rounded-full font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition active:scale-95">
                    Publish Snippet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUB / LIBRARY VIEW */}
        {view === 'hub' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-serif font-bold mb-8">The Global Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {snippets.map((snip) => (
                    <div key={snip.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm font-serif italic text-lg">
                        "{snip.content}"
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* AUTH MODAL */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center border border-white/20">
              <h2 className="text-4xl font-serif font-bold mb-2">Secure Access</h2>
              <p className="text-slate-400 mb-8 font-medium text-sm">Join the ecosystem to protect your work.</p>
              <div className="space-y-4">
                <input type="email" placeholder="Institutional Email" className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-orange-500 transition outline-none" />
                <input type="password" placeholder="Password" className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-orange-500 transition outline-none" />
                <button className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-100 mt-4">Enter the Hub</button>
                <button onClick