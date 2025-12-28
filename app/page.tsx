"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SnippetsApp() {
  const [view, setView] = useState('landing'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", role: "writer", plan: "free", rep: 0 });
  const [snippets, setSnippets] = useState<any[]>([]);

  useEffect(() => {
    fetchSnippets();
    const saved = localStorage.getItem('snippets_user');
    if (saved) {
      setUser(JSON.parse(saved));
      setIsLoggedIn(true);
      setView('hub');
    }
  }, []);

  const fetchSnippets = async () => {
    const { data } = await supabase.from('snippets').select('*').limit(10);
    if (data) setSnippets(data);
  };

  const handleAuth = (role: string) => {
    const newUser = { name: "User_" + Math.random().toString(36).substring(7), role, plan: "free", rep: 10 };
    localStorage.setItem('snippets_user', JSON.stringify(newUser));
    setUser(newUser);
    setIsLoggedIn(true);
    setView('hub');
  };

  // --- COMPONENT: PUBLIC LANDING PAGE ---
  if (!isLoggedIn && view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FCFAF7]">
        {/* Hero Section */}
        <header className="py-20 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-7xl font-serif font-bold italic mb-6 tracking-tighter">Write. Protect. <span className="underline decoration-orange-500">Earn.</span></h1>
          <p className="text-xl text-slate-500 mb-10 leading-relaxed">The elite hub where authors protect their drafts with dynamic watermarks and college editors earn credits for professional reviews.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setView('auth')} className="bg-black text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition">Get Started for Free</button>
            <button onClick={() => setView('preview')} className="bg-white border border-slate-200 px-10 py-4 rounded-full font-bold">Preview the Hub</button>
          </div>
        </header>

        {/* Feature Grid */}
        <section className="grid md:grid-cols-3 gap-8 px-12 pb-20">
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="font-bold mb-2">Anti-Theft Watermarking</h3>
            <p className="text-sm text-slate-500">Every snippet is dynamically watermarked with the viewer's username to prevent leaks.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-3xl mb-4">🎓</div>
            <h3 className="font-bold mb-2">College Credit System</h3>
            <p className="text-sm text-slate-500">Student editors build a professional portfolio and earn reputation points.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="font-bold mb-2">10% Platform Fee</h3>
            <p className="text-sm text-slate-500">Sell full manuscripts with ease. You keep 90%, we handle the security.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* GLOBAL NAVIGATION BAR */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-50 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-serif font-black italic cursor-pointer" onClick={() => setView('hub')}>S.</h1>
            <div className="hidden md:flex gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
              <button onClick={() => setView('hub')} className={view === 'hub' ? "text-orange-600" : ""}>The Hub</button>
              <button onClick={() => setView('leaderboard')} className={view === 'leaderboard' ? "text-orange-600" : ""}>Top Reviewers</button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {!isLoggedIn ? (
              <button onClick={() => setView('auth')} className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm">Join Now</button>
            ) : (
              <div className="flex items-center gap-4">
                <div onClick={() => setView('profile')} className="cursor-pointer text-right">
                  <p className="text-xs font-bold leading-none">{user.name}</p>
                  <p className="text-[10px] text-orange-600 font-bold uppercase">{user.plan} Plan</p>
                </div>
                <button onClick={() => {localStorage.clear(); window.location.reload();}} className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition">✕</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-12 px-6">
        {/* PREVIEW/HUB VIEW */}
        {(view === 'hub' || view === 'preview') && (
          <div>
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-serif font-bold italic">Latest Snippets</h2>
              {user.plan === 'free' && isLoggedIn && <p className="text-xs font-bold text-slate-400">Free Limit: 3/5 posts remaining</p>}
            </div>
            
            <div className="grid gap-6">
              {snippets.map(s => (
                <div key={s.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                  <p className="text-2xl font-serif italic mb-6">"{s.content}"</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Author: {s.author_name}</p>
                  {/* WATERMARK LOGIC */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-6xl font-black uppercase rotate-[-12deg] select-none">
                    {isLoggedIn ? user.name : "PREVIEW_ONLY"}
                  </div>
                </div>
              ))}
            </div>

            {!isLoggedIn && (
              <div className="mt-20 p-12 bg-orange-600 rounded-[3rem] text-center text-white">
                <h3 className="text-3xl font-serif font-bold mb-4">Want to see more?</h3>
                <p className="mb-8 opacity-90 font-medium">Create a free account to post your own work and leave reviews.</p>
                <button onClick={() => setView('auth')} className="bg-white text-orange-600 px-12 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition">Sign Up Free</button>
              </div>
            )}
          </div>
        )}

        {/* AUTH VIEW */}
        {view === 'auth' && (
          <div className="max-w-md mx-auto text-center py-20">
            <h2 className="text-4xl font-serif font-bold mb-8 italic">Choose Your Path</h2>
            <div className="space-y-4">
              <button onClick={() => handleAuth('writer')} className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-lg">I am a Writer</button>
              <button onClick={() => handleAuth('student')} className="w-full bg-white border-2 border-black py-5 rounded-2xl font-bold">I am an Editor</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}