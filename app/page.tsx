"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketplaceView, ProfileView } from '@/components/MasterViews';

export default function UltimateApp() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      fetchMarket();
    };
    init();
  }, []);

  async function fetchUserData(uid: string) {
    const [p, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('snippets').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    ]);
    if (p.data) setProfile(p.data);
    if (s.data) setSnippets(s.data);
  }

  async function fetchMarket() {
    const { data } = await supabase.from('snippets').select('*, profiles(full_name)').eq('status', 'public');
    if (data) setMarketItems(data);
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-red-600/30 overflow-x-hidden">
      <aside className="w-24 bg-black border-r border-white/5 flex flex-col items-center py-12 gap-10 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-3xl font-serif font-black text-red-600 cursor-pointer">S.</div>
        <nav className="flex flex-col gap-10 text-2xl text-zinc-700">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-20 relative">
        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-red-600/5 blur-[180px] -z-10 rounded-full" />
        
        {view === 'landing' && (
          <div className="max-w-6xl animate-in fade-in duration-1000">
            <h1 className="text-[160px] font-serif font-bold tracking-tighter leading-[0.75] mb-12">Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span></h1>
            <p className="text-3xl text-zinc-500 max-w-2xl mb-16 border-l-2 border-red-600 pl-8 font-light">The executive terminal for intellectual property management.</p>
            <button onClick={() => setView('write')} className="px-20 py-8 bg-red-600 rounded-2xl font-black text-2xl hover:bg-white hover:text-black transition-all shadow-2xl">Enter Terminal</button>
          </div>
        )}

        {view === 'marketplace' && <MarketplaceView items={marketItems} />}
        {view === 'profile' && <ProfileView profile={profile} snippets={snippets} user={user} onSignOut={() => supabase.auth.signOut()} />}
        
        {view === 'write' && (
          <div className="max-w-6xl bg-zinc-900/50 p-20 rounded-[60px] border border-white/5">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Drafting..." className="w-full h-[400px] bg-transparent outline-none text-4xl font-serif" />
            <div className="mt-10 border-t border-white/5 pt-10 text-right">
              <button className="px-16 py-6 bg-red-600 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-all">Publish & Sell</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}