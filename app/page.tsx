"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- APP ARCHITECTURE ---
export default function UltimateAuthorApp() {
  // Navigation & View State
  const [view, setView] = useState('landing'); 
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // User & Profile Data
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  
  // Editor & Marketplace State
  const [content, setContent] = useState('');
  const [listingPrice, setListingPrice] = useState('49.99');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Flags
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- LIFECYCLE & SYNC ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await syncUserData(session.user.id);
      }
      await fetchMarketplace();
      setIsDataLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await syncUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setSnippets([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const syncUserData = async (userId: string) => {
    const [profRes, snipRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('snippets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);
    if (profRes.data) setProfile(profRes.data);
    if (snipRes.data) setSnippets(snipRes.data);
  };

  const fetchMarketplace = async () => {
    const { data } = await supabase
      .from('snippets')
      .select('*, profiles(full_name)')
      .eq('status', 'public')
      .order('created_at', { ascending: false });
    if (data) setMarketplaceItems(data);
  };

  // --- AUTH LOGIC ---
  const handleAuthAction = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: email.split('@')[0] } }
      });
      if (error) alert(error.message);
      else alert("Verification email sent!");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else { setShowAuth(false); setView('hub'); }
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- WORKFLOW LOGIC ---
  const handlePublishListing = async () => {
    if (!user) { setShowAuth(true); return; }
    
    // Paywall Logic: Free users limited to 2 public listings
    const publicCount = snippets.filter(s => s.status === 'public').length;
    if (profile?.membership_tier === 'free' && publicCount >= 2) {
      alert("Free Tier Limit Reached. Upgrade to Pro for unlimited Marketplace listings.");
      setView('profile');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase.from('snippets').insert([{
      content,
      user_id: user.id,
      status: 'public',
      price: parseFloat(listingPrice),
      preview_text: content.slice(0, 150) + "..."
    }]).select();

    if (error) alert(error.message);
    else {
      setSnippets([data[0], ...snippets]);
      setContent('');
      alert("Asset listed on Marketplace.");
      await fetchMarketplace();
      setView('marketplace');
    }
    setIsSaving(false);
  };

  const handleAiPolish = async () => {
    if (profile?.membership_tier !== 'pro') {
      alert("AI Polish is a Premium-only feature.");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ text: content }) });
      const data = await res.json();
      setContent(prev => prev + "\n\n" + data.suggestion);
    } catch (e) { alert("AI Service Offline"); } 
    finally { setIsAiLoading(false); }
  };

  // --- FILTERED MARKETPLACE ---
  const filteredMarket = useMemo(() => {
    return marketplaceItems.filter(item => 
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, marketplaceItems]);

  if (isDataLoading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-red-600 font-serif text-5xl animate-bounce">S.</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600/30">
      
      {/* PERSISTENT NAVIGATION SIDEBAR */}
      <aside className="w-24 bg-black border-r border-white/5 flex flex-col items-center py-10 gap-10 sticky top-0 h-screen z-50">
        <div onClick={() => setView('landing')} className="text-3xl font-serif font-black text-red-600 cursor-pointer">S.</div>
        <nav className="flex flex-col gap-10 flex-1">
          <button onClick={() => setView('hub')} className={`text-2xl transition ${view === 'hub' ? 'text-red-600' : 'text-zinc-600 hover:text-white'}`}>🏛️</button>
          <button onClick={() => setView('write')} className={`text-2xl transition ${view === 'write' ? 'text-red-600' : 'text-zinc-600 hover:text-white'}`}>✍️</button>
          <button onClick={() => setView('marketplace')} className={`text-2xl transition ${view === 'marketplace' ? 'text-red-600' : 'text-zinc-600 hover:text-white'}`}>🛍️</button>
          <button onClick={() => setView('profile')} className={`text-2xl transition ${view === 'profile' ? 'text-red-600' : 'text-zinc-600 hover:text-white'}`}>👤</button>
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="text-zinc-700 hover:text-red-600">🔌</button>
      </aside>

      <main className="flex-1 p-12 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-600/5 blur-[150px] -z-10 rounded-full" />

        {/* --- LANDING VIEW --- */}
        {view === 'landing' && (
          <div className="max-w-6xl mx-auto pt-20 animate-in fade-in duration-1000">
            <h1 className="text-[150px] font-serif font-bold tracking-tighter leading-[0.8] mb-12">
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-3xl text-zinc-500 max-w-3xl font-light leading-relaxed mb-16 border-l-4 border-red-600 pl-10">
              The elite terminal for professional authors. Secure your intellectual property and sell it on the global market.
            </p>
            <div className="flex gap-8">
              <button onClick={() => setView('write')} className="px-20 py-8 bg-red-600 text-white rounded-2xl font-black text-2xl hover:bg-white hover:text-black hover:scale-105 transition-all shadow-2xl shadow-red-900/30">
                Open Drafting Room
              </button>
              {!user && (
                <button onClick={() => setShowAuth(true)} className="px-20 py-8 border border-white/10 rounded-2xl font-bold text-2xl hover:bg-white/5 transition-all">
                  Get Clearance
                </button>
              )}
            </div>
            
            {/* Social Proof Section */}
            <div className="mt-32 grid grid-cols-3 gap-12 border-t border-white/5 pt-16">
              <div>
                <h4 className="text-zinc-500 uppercase tracking-widest text-xs font-black mb-4">Total Assets Protected</h4>
                <p className="text-4xl font-serif">14,209</p>
              </div>
              <div>
                <h4 className="text-zinc-500 uppercase tracking-widest text-xs font-black mb-4">Author Payouts</h4>
                <p className="text-4xl font-serif text-red-600">$1.2M+</p>
              </div>
              <div>
                <h4 className="text-zinc-500 uppercase tracking-widest text-xs font-black mb-4">Global Network</h4>
                <p className="text-4xl font-serif">Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* --- MARKETPLACE VIEW --- */}
        {view === 'marketplace' && (
          <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-10 duration-700">
            <header className="flex justify-between items-center mb-16">
              <h2 className="text-7xl font-serif font-bold italic">The Market</h2>
              <div className="relative">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..." 
                  className="bg-zinc-900/50 border border-white/10 rounded-2xl px-8 py-4 w-96 outline-none focus:border-red-600 transition" 
                />
              </div>
            </header>
            
            <div className="grid grid-cols-3 gap-10">
              {filteredMarket.length === 0 ? <p className="text-zinc-600">No assets found in the network.</p> : filteredMarket.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[48px] hover:border-red-600/40 transition group">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-red-600 font-black text-[10px] tracking-widest uppercase">Verified IP</span>
                    <span className="text-2xl font-bold font-mono">${item.price}</span>
                  </div>
                  <p className="text-zinc-300 text-lg italic leading-relaxed h-36 overflow-hidden mb-8">
                    "{item.preview_text}"
                  </p>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👤</div>
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{item.profiles?.full_name}</span>
                  </div>
                  <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition">Acquire Asset</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DRAFTING VIEW --- */}
        {view === 'write' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-serif font-bold italic">Drafting Room</h2>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-zinc-900 rounded-lg text-xs font-mono">Word Count: {content.split(' ').length}</span>
                <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${profile?.membership_tier === 'pro' ? 'bg-red-600' : 'bg-zinc-800 text-zinc-500'}`}>
                  {profile?.membership_tier} Account
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-3xl rounded-[80px] p-24 border border-white/5 shadow-3xl">
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Begin the sequence..."
                className="w-full h-[450px] bg-transparent outline-none text-4xl font-serif leading-relaxed text-white placeholder:text-zinc-800 resize-none"
              />
              
              <div className="mt-16 flex items-center justify-between border-t border-white/5 pt-16">
                <div className="flex gap-10">
                  <button onClick={handleAiPolish} className="text-purple-500 font-black tracking-widest text-xs uppercase hover:text-white transition">
                    {isAiLoading ? 'Analyzing...' : '⚡ AI Polish (PRO)'}
                  </button>
                  <button className="text-zinc-500 font-black tracking-widest text-xs uppercase hover:text-white transition">✂️ Snip</button>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-black border border-white/10 rounded-2xl px-6 py-4">
                    <span className="text-zinc-600 font-bold text-xs mr-3">$</span>
                    <input 
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      className="bg-transparent outline-none font-mono text-xl w-24"
                    />
                  </div>
                  <button 
                    onClick={handlePublishListing} 
                    disabled={isSaving}
                    className="px-16 py-6 bg-red-600 text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-900/40"
                  >
                    {isSaving ? 'Encrypting...' : 'Publish & Sell'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROFILE DASHBOARD --- */}
        {view === 'profile' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-24 rounded-[100px] border border-white/10 relative shadow-3xl">
              <div className="absolute top-12 right-12">
                <button className="px-6 py-2 bg-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  System Online
                </button>
              </div>
              
              <div className="flex items-center gap-16 mb-20">
                <div className="w-48 h-48 bg-red-600 rounded-[60px] flex items-center justify-center text-7xl shadow-2xl rotate-3">👤</div>
                <div>
                  <h2 className="text-7xl font-serif font-bold italic mb-4">{profile?.full_name || 'Verified Author'}</h2>
                  <p className="text-zinc-500 font-mono text-lg tracking-widest">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-16 border-t border-white/5 pt-20">
                <div>
                  <h5 className="text-zinc-500 uppercase tracking-widest text-[10px] font-black mb-4">Secured Assets</h5>
                  <p className="text-6xl font-serif">{snippets.length}</p>
                </div>
                <div>
                  <h5 className="text-zinc-500 uppercase tracking-widest text-[10px] font-black mb-4">Total Earnings</h5>
                  <p className="text-6xl font-serif text-red-600">${profile?.total_earned?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <h5 className="text-zinc-500 uppercase tracking-widest text-[10px] font-black mb-4">Account Tier</h5>
                  <p className="text-4xl font-serif uppercase tracking-tighter text-white">{profile?.membership_tier}</p>
                  <button className="text-red-600 text-[10px] font-black uppercase tracking-widest mt-4 hover:underline">Manage Subscription</button>
                </div>
              </div>
            </div>

            {/* UPGRADE PRO CARD */}
            {profile?.membership_tier === 'free' && (
              <div className="bg-white p-16 rounded-[60px] flex justify-between items-center group">
                <div className="max-w-xl">
                  <h3 className="text-black text-5xl font-serif font-bold italic mb-6">Unleash Full Potential</h3>
                  <p className="text-zinc-600 text-xl font-medium leading-relaxed">
                    Upgrade to <span className="text-red-600 font-bold">PRO</span> for unlimited marketplace listings, full AI capabilities, and priority technical clearance.
                  </p>
                </div>
                <button className="px-16 py-8 bg-red-600 text-white rounded-3xl font-black text-2xl hover:scale-110 transition-all shadow-xl">
                  Upgrade — $29/mo
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- AUTH MODAL --- */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6">
            <div className="bg-[#0a0a0a] p-24 rounded-[80px] w-full max-w-2xl border border-white/5 text-center shadow-[0_0_100px_rgba(220,38,38,0.2)] relative">
              <h2 className="text-7xl font-serif font-bold mb-6 italic">{isSignUp ? 'Apply' : 'Entry'}</h2>
              <p className="text-zinc-500 mb-12 text-lg">Secure your credentials to access the author network.</p>
              
              <div className="space-y-6 mb-12">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Network Identity (Email)" 
                  className="w-full p-8 bg-black border border-white/10 rounded-3xl text-white outline-none focus:border-red-600 transition text-xl" 
                />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secret Access Key" 
                  className="w-full p-8 bg-black border border-white/10 rounded-3xl text-white outline-none focus:border-red-600 transition text-xl" 
                />
              </div>

              <button 
                onClick={handleAuthAction}
                className="w-full py-8 bg-red-600 text-white rounded-3xl font-black text-2xl hover:bg-white hover:text-black transition-all"
              >
                {isSignUp ? 'Initialize Profile' : 'Authorize Session'}
              </button>

              <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="mt-10 text-zinc-500 font-black uppercase text-xs tracking-[0.3em] hover:text-red-600 transition"
              >
                {isSignUp ? 'Existing Clearance? Sign In' : 'New Author? Apply for Clearance'}
              </button>
              
              <button onClick={() => setShowAuth(false)} className="mt-8 text-zinc-800 text-xs">Abort Operation</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}