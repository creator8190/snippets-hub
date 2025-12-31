"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function GlobalAuthorTerminal() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // App Logic
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('author'); // 'author' or 'editor'

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchCoreData(session.user.id);
      }
      fetchMarket();
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCoreData(session.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchCoreData(uid: string) {
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

  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, password, options: { data: { full_name: email.split('@')[0], role: role } } 
      });
      if (error) alert(error.message); else alert("Clearance requested. Check email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-red-600/50 font-sans">
      
      {/* GLOW ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[1000px] h-[1000px] bg-red-600/5 blur-[200px] rounded-full" />
      </div>

      {/* SIDEBAR */}
      <aside className="w-24 bg-black/90 border-r border-white/5 flex flex-col items-center py-12 gap-10 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-3xl font-serif font-black text-red-600 cursor-pointer hover:scale-110 transition">S.</div>
        <nav className="flex flex-col gap-10 text-2xl text-zinc-800">
          <button onClick={() => setView('hub')} className={view === 'hub' ? 'text-red-600' : 'hover:text-white transition'}>🏛️</button>
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'hover:text-white transition'}>✍️</button>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'hover:text-white transition'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'hover:text-white transition'}>👤</button>
        </nav>
      </aside>

      <main className="flex-1 p-24 relative z-10 overflow-y-auto h-screen">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <div className="max-w-7xl animate-in fade-in slide-in-from-left-8 duration-1000">
            <h1 className="text-[170px] font-serif font-bold tracking-tighter leading-[0.75] mb-12 drop-shadow-2xl">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-4xl text-zinc-500 max-w-3xl font-light leading-relaxed mb-20 border-l-4 border-red-600 pl-12">
              The world's premier terminal for elite authors and student editors.
            </p>
            
            <div className="flex gap-8">
              {!user ? (
                <>
                  <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="px-16 py-8 bg-red-600 text-white rounded-[30px] font-black text-2xl shadow-2xl hover:translate-y-[-4px] transition-all">Join for Free</button>
                  <button onClick={() => { setIsSignUp(false); setShowAuth(true); }} className="px-16 py-8 border border-white/10 rounded-[30px] font-bold text-2xl hover:bg-white/5 transition-all">Log In</button>
                </>
              ) : (
                <button onClick={() => setView('write')} className="px-16 py-8 bg-red-600 text-white rounded-[30px] font-black text-2xl shadow-2xl transition-all">Open Terminal</button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: MARKETPLACE */}
        {view === 'marketplace' && (
          <div className="max-w-7xl">
            <h2 className="text-8xl font-serif font-bold italic tracking-tighter mb-20">Global Exchange</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 p-12 rounded-[60px] hover:border-red-600/50 transition-all">
                  <div className="flex justify-between mb-8">
                    <span className="text-red-600 text-[10px] font-black tracking-widest uppercase italic">IP Block #{item.id.slice(0,5)}</span>
                    <span className="text-3xl font-bold font-mono">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 italic text-xl leading-relaxed mb-10 h-32 overflow-hidden">"{item.preview_text}"</p>
                  <button className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Purchase Rights</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROFILE */}
        {view === 'profile' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-zinc-900/50 p-24 rounded-[100px] border border-white/10 shadow-3xl">
              <div className="flex items-center gap-16 mb-20">
                <div className="w-48 h-48 bg-red-600 rounded-[60px] flex items-center justify-center text-8xl shadow-2xl">👤</div>
                <div>
                  <h2 className="text-7xl font-serif font-bold italic tracking-tighter">{profile?.full_name || 'Author'}</h2>
                  <p className="text-zinc-500 font-mono text-xl">{profile?.role?.toUpperCase() || 'MEMBER'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-10 border-t border-white/5 pt-16 text-center">
                <div><p className="text-6xl font-bold">{snippets.length}</p><p className="text-[10px] uppercase font-black text-zinc-700 tracking-widest mt-2">Assets</p></div>
                <div><p className="text-6xl font-bold text-red-600">${profile?.total_earned || '0.00'}</p><p className="text-[10px] uppercase font-black text-zinc-700 tracking-widest mt-2">Revenue</p></div>
                <div><button onClick={() => supabase.auth.signOut()} className="mt-8 text-zinc-800 hover:text-red-600 font-black text-xs uppercase tracking-widest transition">Sign Out</button></div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: EDITOR/SNIPPETS */}
        {view === 'write' && (
          <div className="max-w-6xl mx-auto">
             <div className="bg-zinc-900/50 p-20 rounded-[80px] border border-white/5">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Drafting..." className="w-full h-[400px] bg-transparent outline-none text-4xl font-serif" />
                <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-12">
                   <span className="text-zinc-600 text-xs font-mono">Word Count: {content.split(' ').length}</span>
                   <button className="px-16 py-6 bg-red-600 rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-xl">List Snippet</button>
                </div>
             </div>
          </div>
        )}

        {/* AUTH MODAL */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
            <div className="bg-[#080808] p-24 rounded-[100px] w-full max-w-2xl border border-white/5 text-center relative shadow-2xl">
              <h2 className="text-7xl font-serif font-bold mb-10 italic tracking-tighter">{isSignUp ? 'Apply' : 'Authorize'}</h2>
              
              {isSignUp && (
                <div className="flex gap-4 mb-8 justify-center">
                  <button onClick={() => setRole('author')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${role === 'author' ? 'bg-red-600 border-red-600' : 'border-white/10 text-zinc-600'}`}>Professional Author</button>
                  <button onClick={() => setRole('editor')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${role === 'editor' ? 'bg-red-600 border-red-600' : 'border-white/10 text-zinc-600'}`}>Editor (Student Credits)</button>
                </div>
              )}

              <div className="space-y-6 mb-12">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-8 bg-black border border-white/10 rounded-[35px] text-white outline-none focus:border-red-600 text-2xl" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-8 bg-black border border-white/10 rounded-[35px] text-white outline-none focus:border-red-600 text-2xl" />
              </div>

              <button onClick={handleAuth} className="w-full py-8 bg-red-600 rounded-[35px] font-black text-2xl hover:bg-white hover:text-black transition-all shadow-2xl">Execute</button>
              <button onClick={() => setShowAuth(false)} className="mt-8 text-zinc-800 text-xs block mx-auto">Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}