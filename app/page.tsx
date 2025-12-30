"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SnippetsApp() {
  const [showSignup, setShowSignup] = useState(false);
  const [content, setContent] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleCaptureSnippet = async () => {
    if (!user) {
      alert("Please sign up to save snippets!");
      setShowSignup(true);
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selectedText.trim().length > 0) {
      const { data, error } = await supabase
        .from('snippets')
        .insert([{ content: selectedText, user_id: user.id }])
        .select();
      if (!error && data) setSnippets([data[0], ...snippets]);
    }
  };

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

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR ARCHITECTURE */}
      <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 sticky top-0 h-screen z-50">
        <div className="text-3xl font-serif font-black text-orange-600 underline">S.</div>
        <div className="flex flex-col gap-8 flex-1 text-2xl text-slate-300">
            <button className="hover:text-orange-500 transition">🏛️</button>
            <button className="text-orange-500 bg-orange-50 p-3 rounded-2xl">✍️</button>
            <button className="hover:text-orange-500 transition">👤</button>
            <button className="hover:text-orange-500 transition">🛍️</button>
        </div>
        <button className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-tighter">Exit</button>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="flex-1 p-8 md:p-12 lg:p-20 flex flex-col gap-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif font-black text-slate-900 leading-tight">Workspace</h1>
            <p className="text-slate-500 text-sm italic">Capture snippets & polish with AI</p>
          </div>
          {!user && (
            <button onClick={() => setShowSignup(true)} className="px-6 py-2 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200">
              Join for Free
            </button>
          )}
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4">
            <div className="flex gap-2 border-b pb-4">
              <button onClick={handleCaptureSnippet} className="text-xs font-bold bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
                ✂️ Capture Selection
              </button>
              <button onClick={handleAiPolish} className="text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                {isAiLoading ? "AI is Analyzing..." : "✨ AI Polish"}
              </button>
            </div>
            <textarea 
              ref={textareaRef}
              className="flex-1 w-full text-lg text-slate-700 outline-none resize-none font-medium leading-relaxed mt-4"
              placeholder="Start your writing or code here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">📋 Snippet Library ({snippets.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {snippets.length === 0 ? (
                  <p className="text-xs text-slate-400">Empty library.</p>
                ) : (
                  snippets.map((snip) => (
                    <div key={snip.id} className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
                      {snip.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {showSignup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl relative">
              <button onClick={() => setShowSignup(false)} className="absolute top-6 right-6">✕</button>
              <h2 className="text-3xl font-serif font-black text-slate-900 mb-6 text-center">Join Hub</h2>
              <button className="w-full py-4 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700">Get Started</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}