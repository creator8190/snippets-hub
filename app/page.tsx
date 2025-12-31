"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase'; // Using the new lib file

export default function UltimateAuthorApp() {
  const [view, setView] = useState('landing'); 
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  
  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [listingPrice, setListingPrice] = useState('49.99');
  
  // UI States (Removed the 'isDataLoading' block that caused the bounce loop)
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initial Auth Check
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchData(session.user.id);
      }
      fetchMarketplace();
    };
    init();

    // Listen for Auth Changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData(session.user.id);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    const [prof, snips] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('snippets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);
    if (prof.data) setProfile(prof.data);
    if (snips.data) setSnippets(snips.data);
  };

  const fetchMarketplace = async () => {
    const { data } = await supabase.from('snippets').select('*, profiles(full_name)').eq('status', 'public');
    if (data) setMarketplaceItems(data);
  };

  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message); else alert("Check email!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
  };

  const handlePublish = async () => {
    if (!user) { setShowAuth(true); return; }
    setIsSaving(true);
    const { data, error } = await supabase.from('snippets').insert([{
      content, user_id: user.id, status: 'public', price: parseFloat(listingPrice),
      preview_text: content.slice(0, 150) + "..."
    }]).select();
    if (error) alert(error.message);
    else { setSnippets([data[0], ...snippets]); setView('marketplace'); fetchMarketplace(); }
    setIsSaving(false);
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-red-600/30">
      {/* GLOW BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 blur-[180px] rounded-full" />
      </div>

      {/* SIDEBAR */}
      <aside className="w-24 bg-black/90 border-r border-white/5 flex flex-col items-center py-12 gap-10 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-3xl font-serif font-black text-red-600 cursor-pointer">S.</div>
        <nav className="flex flex-col gap-10 text-2xl text-zinc-600">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-16 relative">
        {/* LANDING */}
        {view === 'landing' && (
          <div className="max-w-6xl animate-in fade-in duration-1000">
            <h1 className="text-[140px] font-serif font-bold tracking-tighter leading-[0.8] mb-12">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-2xl text-zinc-500 max-w-2xl mb-12 border-l-2 border-red-600 pl-8">
              The premier marketplace for world-class authors. Secure your IP and sell to global buyers.
            </p>
            <div className="flex gap-8">
              <button onClick={() => setView('write')} className="px-16 py-7 bg-red-600 rounded-2xl font-black text-xl hover:scale-105 transition-all">Start Creating</button>
              {!user && <button onClick={() => setShowAuth(true)} className="px-16 py-7 border border-white/10 rounded-2xl font-bold text-xl hover:bg-white/5 transition-all">Secure Access</button>}
            </div>
          </div>
        )}

        {/* MARKETPLACE */}
        {view === 'marketplace' && (
          <div className="max-w-7xl animate-in slide-in-from-bottom-5 duration-700">
            <h2 className="text-6xl font-serif font-bold italic mb-16">The Market</h2>
            <div className="grid grid-cols-3 gap-10">
              {marketplaceItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] hover:border-red-600/40 transition group">
                  <div className="flex justify-between mb-6">
                    <span className="text-red-600 text-[10px] font-black tracking-widest uppercase">Verified IP</span>
                    <span className="font-mono font-bold">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic mb-8 h-32 overflow-hidden">"{item.preview_text}"</p>
                  <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition">Purchase Rights</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAFTING ROOM */}
        {view === 'write' && (
          <div className="max-w-6xl">
            <div className="bg-zinc-900/80 rounded-[60px] p-20 border border-white/5">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Initialize legacy code..."
                className="w-full h-[400px] bg-transparent outline-none text-4xl font-serif leading-relaxed text-white"
              />
              <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-12">
                <button className="text-purple-500 font-black text-xs uppercase tracking-widest">⚡ AI Polish (PRO)</button>
                <div className="flex gap-6">
                  <input value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} className="bg-black border border-white/10 rounded-xl px-4 w-24 text-center" />
                  <button onClick={handlePublish} className="px-12 py-5 bg-red-600 rounded-2xl font-black transition-all hover:scale-105">Publish & Sell</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <div className="max-w-4xl animate-in fade-in">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-20 rounded-[80px] border border-white/10">
              <div className="flex items-center gap-12 mb-16">
                <div className="w-32 h-32 bg-red-600 rounded-[40px] flex items-center justify-center text-5xl shadow-2xl rotate-2">👤</div>
                <div>
                  <h2 className="text-5xl font-serif font-bold italic">{profile?.full_name || 'Author'}</h2>
                  <p className="text-zinc-500 font-mono">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center border-t border-white/5 pt-16">
                <div><div className="text-5xl font-bold">{snippets.length}</div><div className="text-[10px] uppercase text-zinc-500 font-black tracking-widest mt-2">Assets</div></div>
                <div><div className="text-5xl font-bold text-red-600">${profile?.total_earned || '0'}</div><div className="text-[10px] uppercase text-zinc-500 font-black tracking-widest mt-2">Earnings</div></div>
                <div><div className="text-3xl font-serif mt-2 uppercase">{profile?.membership_tier || 'Free'}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* AUTH MODAL */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="bg-zinc-900 p-20 rounded-[80px] w-full max-w-xl border border-white/5 text-center">
              <h2 className="text-6xl font-serif font-bold mb-10 italic">{isSignUp ? 'Apply' : 'Entry'}</h2>
              <div className="space-y-4 mb-10">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-6 bg-black border border-white/10 rounded-3xl text-white outline-none focus:border-red-600" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-6 bg-black border border-white/10 rounded-3xl text-white outline-none focus:border-red-600" />
              </div>
              <button onClick={handleAuth} className="w-full py-6 bg-red-600 rounded-3xl font-black text-2xl hover:bg-white hover:text-black transition-all">{isSignUp ? 'Create' : 'Enter'}</button>
              <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 text-zinc-500 font-black text-xs uppercase tracking-widest block mx-auto">{isSignUp ? 'Have account? Sign in' : 'New? Join Elite'}</button>
              <button onClick={() => setShowAuth(false)} className="mt-4 text-zinc-800 text-xs block mx-auto">Abort</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}