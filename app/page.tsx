"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- DATABASE CORE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthorEditorTerminal() {
  // --- AUTH & PROFILE STATE ---
  const [view, setView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  
  // --- REVIEW BRIDGE STATE ---
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingReviews, setPendingReviews] = useState<any[]>([]); // Author's submitted reviews
  const [newItemPulse, setNewItemPulse] = useState<string | null>(null); // Track newly arrived items for animation
  
  // --- REFINERY STATE ---
  const [selectedText, setSelectedText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  // --- EDITOR & COMMERCE STATE ---
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('49.99');
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('author'); 
  const [isBusy, setIsBusy] = useState(false);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

  // --- DATA LIFECYCLE ---
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        loadUserCloudData(session.user.id);
      }
      loadMarketRegistry();
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserCloudData(session.user.id);
    });
    return () => authListener?.subscription.unsubscribe();
  }, []);

  // --- REALTIME SUBSCRIPTION FOR REVIEW QUEUE (Students Only) ---
  useEffect(() => {
    // Only subscribe if user is a student editor
    if (!user || profile?.role !== 'editor') return;

    // Set up Realtime subscription for new review_queue entries
    const channel = supabase
      .channel('review_queue_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'review_queue',
          filter: 'status=eq.pending'
        },
        async (payload) => {
          // New snippet extracted! Fetch full data with relations
          const newReview = payload.new as any;
          
          // Fetch snippet and author data
          const [snippetRes, authorRes] = await Promise.all([
            supabase
              .from('snippets')
              .select('*, profiles!snippets_user_id_fkey(full_name)')
              .eq('id', newReview.snippet_id)
              .single(),
            supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newReview.author_id)
              .single()
          ]);

          if (snippetRes.data && authorRes.data) {
            const enrichedReview = {
              ...newReview,
              snippets: snippetRes.data,
              profiles: authorRes.data
            };
            
            // Add to review queue (prepend for newest first, but we'll sort)
            setReviewQueue(prev => {
              const updated = [enrichedReview, ...prev];
              // Sort by submitted_at ascending (oldest first)
              return updated.sort((a, b) => 
                new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
              );
            });
            
            // Trigger pulse animation for new item
            setNewItemPulse(enrichedReview.id);
            setTimeout(() => setNewItemPulse(null), 3000); // Remove pulse after 3 seconds
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'review_queue',
          filter: 'status=eq.in_progress'
        },
        (payload) => {
          // Review was claimed by another editor, remove from queue
          setReviewQueue(prev => prev.filter(r => r.id !== payload.new.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'review_queue',
          filter: 'status=eq.approved'
        },
        (payload) => {
          // Review was approved, remove from queue
          setReviewQueue(prev => prev.filter(r => r.id !== payload.new.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role]);

  async function loadUserCloudData(uid: string) {
    const [p, s, reviews] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('snippets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('review_queue').select('*, snippets(*)').eq('author_id', uid).order('submitted_at', { ascending: false })
    ]);
    if (p.data) setProfile(p.data);
    if (s.data) setSnippets(s.data);
    if (reviews.data) setPendingReviews(reviews.data);
    
    // Load review queue if user is a student editor
    if (p.data?.role === 'editor') {
      loadReviewQueue();
    }
  }

  async function loadReviewQueue() {
    const { data } = await supabase
      .from('review_queue')
      .select(`
        *,
        snippets(*, profiles!snippets_user_id_fkey(full_name))
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    
    // Enrich with author profile data
    if (data) {
      const enrichedData = await Promise.all(data.map(async (review) => {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', review.author_id)
          .single();
        return { ...review, profiles: authorData };
      }));
      setReviewQueue(enrichedData);
    }
  }

  async function loadMarketRegistry() {
    const { data } = await supabase
      .from('snippets')
      .select(`
        *,
        profiles!snippets_user_id_fkey(full_name),
        verified_editor:profiles!snippets_verified_by_editor_id_fkey(full_name)
      `)
      .eq('status', 'public')
      .eq('verified', true)
      .order('created_at', { ascending: false });
    if (data) setMarketItems(data);
  }

  // --- SYSTEM ACTIONS ---
  const handleAuthProtocol = async () => {
    setIsBusy(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, password, options: { data: { full_name: email.split('@')[0], role: role, credits: 0, balance: 0 } } 
      });
      if (error) alert(error.message); else alert("Identity encryption complete. Check email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setShowAuth(false);
    }
    setIsBusy(false);
  };

  // --- REVIEW BRIDGE ACTIONS ---
  const saveDraft = async () => {
    if (!user) return setShowAuth(true);
    if (!title.trim() && !content.trim()) return;
    
    setIsBusy(true);
    const snippetData: any = {
      title: title || 'Untitled Draft',
      content,
      user_id: user.id,
      status: 'draft',
      verification_status: 'draft',
      price: parseFloat(price) || 0,
      preview_text: content.slice(0, 150) + (content.length > 150 ? "..." : ""),
      verified: false
    };

    if (editingSnippetId) {
      const { data, error } = await supabase
        .from('snippets')
        .update(snippetData)
        .eq('id', editingSnippetId)
        .select()
        .single();
      
      if (data) {
        setSnippets(snippets.map(s => s.id === editingSnippetId ? data : s));
        setEditingSnippetId(null);
      } else if (error) alert(error.message);
    } else {
      const { data, error } = await supabase.from('snippets').insert([snippetData]).select();
      if (data) {
        setSnippets([data[0], ...snippets]);
        setEditingSnippetId(data[0].id);
      } else if (error) alert(error.message);
    }
    setIsBusy(false);
  };

  const submitForReview = async (snippetId: string) => {
    if (!user) return;
    setIsBusy(true);
    
    // Update snippet to pending_review status
    const { error: snippetError } = await supabase
      .from('snippets')
      .update({ verification_status: 'pending_review' })
      .eq('id', snippetId);
    
    if (snippetError) {
      alert(snippetError.message);
      setIsBusy(false);
      return;
    }
    
    // Create review_queue entry
    const { data, error } = await supabase
      .from('review_queue')
      .insert([{
        snippet_id: snippetId,
        author_id: user.id,
        status: 'pending'
      }])
      .select('*, snippets(*)')
      .single();
    
    if (data) {
      setPendingReviews([data, ...pendingReviews]);
      setSnippets(snippets.map(s => s.id === snippetId ? { ...s, verification_status: 'pending_review' } : s));
      // Reload review queue for editors
      if (profile?.role === 'editor') {
        loadReviewQueue();
      }
      alert('Manuscript submitted for review. Student editors will verify your work.');
    } else if (error) alert(error.message);
    setIsBusy(false);
  };

  const claimReview = async (reviewId: string) => {
    if (!user) return;
    setIsBusy(true);
    
    const { data: reviewData, error } = await supabase
      .from('review_queue')
      .update({ 
        editor_id: user.id, 
        status: 'in_progress' 
      })
      .eq('id', reviewId)
      .select('*, snippets(*)')
      .single();
    
    if (reviewData) {
      // Fetch author profile
      const { data: authorData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reviewData.author_id)
        .single();
      
      const enrichedReview = { ...reviewData, profiles: authorData };
      setSelectedReview(enrichedReview);
      setReviewContent(reviewData.snippets?.content || '');
      setReviewNotes('');
      setReviewQueue(reviewQueue.filter(r => r.id !== reviewId));
      setView('review_terminal');
      
      // Update snippet status
      await supabase
        .from('snippets')
        .update({ verification_status: 'in_review' })
        .eq('id', reviewData.snippet_id);
    } else if (error) alert(error.message);
    setIsBusy(false);
  };

  const approveReview = async () => {
    if (!selectedReview || !user) return;
    setIsBusy(true);
    
    const { error } = await supabase
      .from('review_queue')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        editor_notes: reviewNotes,
        edited_content: reviewContent !== selectedReview.snippets?.content ? reviewContent : null
      })
      .eq('id', selectedReview.id);
    
    if (!error) {
      // Update snippet content if edited
      if (reviewContent !== selectedReview.snippets?.content) {
        await supabase
          .from('snippets')
          .update({ content: reviewContent })
          .eq('id', selectedReview.snippet_id);
      }
      
      // Credit and verification are handled by database trigger
      // Reload data
      await loadUserCloudData(user.id);
      await loadMarketRegistry();
      setSelectedReview(null);
      setReviewContent('');
      setReviewNotes('');
      setView(profile?.role === 'editor' ? 'review_queue' : 'profile');
      alert('Review approved! Author receives verified badge. You earned +1 Credit.');
    } else {
      alert(error.message);
    }
    setIsBusy(false);
  };

  // --- REFINERY ACTIONS ---
  const handleTextSelection = () => {
    const textarea = document.querySelector('textarea[placeholder*="Initialize your text"]') as HTMLTextAreaElement;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setSelectedText(selected);
    }
  };

  const extractToReview = async () => {
    if (!selectedText.trim() || !user) {
      alert('Please select text to extract.');
      return;
    }
    setIsBusy(true);
    
    // Create a new snippet from selected text
    const { data: snippetData, error: snippetError } = await supabase
      .from('snippets')
      .insert([{
        title: `Extracted: ${title || 'Untitled'}`,
        content: selectedText,
        user_id: user.id,
        status: 'draft',
        verification_status: 'draft',
        price: parseFloat(price) || 0,
        preview_text: selectedText.slice(0, 150) + (selectedText.length > 150 ? "..." : ""),
        verified: false
      }])
      .select()
      .single();
    
    if (snippetError) {
      alert(snippetError.message);
      setIsBusy(false);
      return;
    }
    
    // Immediately submit to review queue
    const { data: reviewData, error: reviewError } = await supabase
      .from('review_queue')
      .insert([{
        snippet_id: snippetData.id,
        author_id: user.id,
        status: 'pending'
      }])
      .select('*, snippets(*)')
      .single();
    
    if (reviewData) {
      await supabase
        .from('snippets')
        .update({ verification_status: 'pending_review' })
        .eq('id', snippetData.id);
      
      setPendingReviews([reviewData, ...pendingReviews]);
      setSnippets([snippetData, ...snippets]);
      setSelectedText('');
      if (profile?.role === 'editor') {
        loadReviewQueue();
      }
      alert('Text extracted and submitted for review!');
    } else if (reviewError) {
      alert(reviewError.message);
    }
    setIsBusy(false);
  };

  const refineWithAI = async () => {
    if (!content.trim()) {
      alert('Please write some content first.');
      return;
    }
    setIsRefining(true);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, mode: 'refine' })
      });
      
      const data = await response.json();
      if (data.refined) {
        setContent(data.refined);
        alert('Content professionalized! Review and adjust as needed.');
      } else {
        alert('Refinement failed. Please try again.');
      }
    } catch (error) {
      alert('Error refining content. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const rejectReview = async () => {
    if (!selectedReview || !user) return;
    if (!reviewNotes.trim()) {
      alert('Please provide rejection notes for the author.');
      return;
    }
    setIsBusy(true);
    
    const { error } = await supabase
      .from('review_queue')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        editor_notes: reviewNotes
      })
      .eq('id', selectedReview.id);
    
    if (!error) {
      // Update snippet status back to draft
      await supabase
        .from('snippets')
        .update({ verification_status: 'draft' })
        .eq('id', selectedReview.snippet_id);
      
      await loadUserCloudData(user.id);
      setSelectedReview(null);
      setReviewContent('');
      setReviewNotes('');
      setView(profile?.role === 'editor' ? 'review_queue' : 'profile');
      alert('Review rejected. Author has been notified with your notes.');
    } else {
      alert(error.message);
    }
    setIsBusy(false);
  };

  const commitAssetToMarket = async () => {
    if (!user) return setShowAuth(true);
    setIsBusy(true);
    
    // First save as draft, then submit for review
    if (!editingSnippetId) {
      await saveDraft();
      // Small delay to ensure draft is saved
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const targetId = editingSnippetId || snippets[0]?.id;
    if (targetId) {
      await submitForReview(targetId);
      setContent('');
      setTitle('');
      setEditingSnippetId(null);
      setView('profile');
    }
    setIsBusy(false);
  };

  // --- COMPONENT: STAT CARD ---
  const StatBox = ({ label, val, color = "text-white" }: any) => (
    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[40px] text-center backdrop-blur-md">
      <p className={`text-5xl font-bold mb-2 ${color}`}>{val}</p>
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">{label}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-300 font-sans overflow-hidden selection:bg-red-600/30">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-24 bg-black border-r border-white/5 flex flex-col items-center py-12 gap-12 z-50">
        <div onClick={() => setView('landing')} className="text-3xl font-serif font-black text-red-600 cursor-pointer hover:rotate-90 transition-transform duration-500">S.</div>
        <nav className="flex flex-col gap-10 text-2xl">
          <button onClick={() => setView('write')} className={view === 'write' ? 'text-red-600' : 'text-zinc-800 hover:text-white transition'}>✍️</button>
          {profile?.role === 'editor' && (
            <button onClick={() => { loadReviewQueue(); setView('review_queue'); }} className={view === 'review_queue' ? 'text-red-600' : 'text-zinc-800 hover:text-white transition'} title="Review Queue">📋</button>
          )}
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'text-red-600' : 'text-zinc-800 hover:text-white transition'}>🛍️</button>
          <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-red-600' : 'text-zinc-800 hover:text-white transition'}>👤</button>
        </nav>
        <div className="mt-auto flex flex-col items-center gap-4 italic opacity-20 hover:opacity-100 transition">
          <span className="text-[8px] font-black uppercase tracking-widest vertical-text">Encrypted</span>
          <div className="w-px h-12 bg-red-600" />
        </div>
      </aside>

      {/* 2. CORE VIEWPORT */}
      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_10%_10%,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent">
        
        {/* VIEW: LANDING */}
        {view === 'landing' && (
          <div className="h-full flex flex-col justify-center px-24 max-w-7xl animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-6 mb-8">
              <span className="bg-red-600 text-white text-[10px] font-black tracking-[0.5em] px-4 py-1 rounded-full">EST. 2025</span>
              <span className="text-zinc-700 text-[10px] font-black tracking-[0.5em] uppercase">Executive Writing Protocol</span>
            </div>
            <h1 className="font-serif font-bold tracking-tighter leading-[0.8] mb-12 text-white drop-shadow-2xl" style={{ fontSize: 'clamp(3rem, 10vw, 8.75rem)' }}>
              Write. <br/>Protect. <br/><span className="text-red-600 italic">Earn.</span>
            </h1>
            <p className="text-3xl text-zinc-500 max-w-3xl font-light leading-relaxed mb-16 border-l-4 border-red-600 pl-12">
              The high-fidelity terminal for <span className="text-white">Authors</span> to monetize IP and <span className="text-white">Students</span> to earn degree credits via verified editing.
            </p>
            <div className="flex gap-10 items-center">
              {!user ? (
                <>
                  <button onClick={() => { setIsSignUp(true); setShowAuth(true); }} className="px-16 py-6 bg-red-600 text-white rounded-full font-black text-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:translate-y-[-4px] transition-all duration-500">Get Started</button>
                  <button onClick={() => { setIsSignUp(false); setShowAuth(true); }} className="text-2xl font-bold border-b-2 border-white/10 pb-2 hover:text-red-600 hover:border-red-600 transition-all">Sign In</button>
                </>
              ) : (
                <button onClick={() => setView('write')} className="px-16 py-6 bg-red-600 text-white rounded-full font-black text-2xl shadow-2xl">Open Workspace</button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: WRITE (Unified Terminal) */}
        {view === 'write' && (
          <div className="p-16 h-full flex flex-col animate-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end mb-12">
              <div className="w-2/3">
                <input 
                  value={title} onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Untitled Manuscript..." 
                  className="bg-transparent font-serif font-bold text-white outline-none placeholder:text-zinc-900 w-full" style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}
                />
              </div>
              <div className="flex items-center gap-8">
                <div className="bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                  <span className="text-zinc-600 font-mono text-2xl">$</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-transparent outline-none font-mono text-2xl text-white w-24" />
                </div>
                <div className="flex gap-4">
                  <button onClick={saveDraft} disabled={isBusy} className="px-8 py-5 bg-zinc-900/50 text-zinc-400 rounded-full font-black text-sm uppercase tracking-widest border border-white/5 hover:bg-zinc-800 hover:text-white transition-all">
                    {isBusy ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button onClick={refineWithAI} disabled={isRefining || !content.trim()} className="px-8 py-5 bg-purple-600/20 text-purple-400 rounded-full font-black text-sm uppercase tracking-widest border border-purple-600/30 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50">
                    {isRefining ? 'Refining...' : 'Refine'}
                  </button>
                  <button onClick={commitAssetToMarket} disabled={isBusy || (!title.trim() && !content.trim())} className="px-12 py-5 bg-red-600 text-white rounded-full font-black text-lg uppercase tracking-widest shadow-xl hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isBusy ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            </header>
            
            <div className="flex-1 bg-zinc-900/20 rounded-[60px] border border-white/5 p-12 relative shadow-inner overflow-hidden">
               <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  onSelect={handleTextSelection}
                  placeholder="Initialize your text... Students earn credits for reviewing this."
                  className="w-full h-full bg-transparent outline-none text-4xl font-serif leading-relaxed text-zinc-300 placeholder:text-zinc-900 resize-none scrollbar-hide"
               />
               <div className="absolute bottom-10 right-16 flex items-center gap-6">
                  {selectedText.trim() && (
                    <button
                      onClick={extractToReview}
                      disabled={isBusy}
                      className="px-6 py-3 bg-blue-600/20 text-blue-400 rounded-full font-black text-xs uppercase tracking-widest border border-blue-600/30 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                    >
                      Extract to Review
                    </button>
                  )}
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">Words: {content.split(/\s+/).filter(Boolean).length}</span>
               </div>
            </div>
          </div>
        )}

        {/* VIEW: REVIEW QUEUE (Student Editor View) */}
        {view === 'review_queue' && profile?.role === 'editor' && (
          <div className="p-16 h-full overflow-y-auto max-w-7xl mx-auto scrollbar-hide">
            <div className="flex justify-between items-baseline border-b border-white/5 pb-12 mb-16">
              <div className="flex items-center gap-4">
                <h2 className="font-serif font-bold italic text-white tracking-tighter" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)' }}>Review Queue</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Realtime Active" />
                  <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">LIVE</span>
                </div>
              </div>
              <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">Earn Credits • Verify IP</p>
            </div>
            
            {reviewQueue.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {reviewQueue.map((review, i) => (
                  <div 
                    key={review.id || i} 
                    className={`relative bg-zinc-900/30 border p-12 rounded-[60px] hover:border-red-600/30 transition-all duration-500 group ${
                      newItemPulse === review.id 
                        ? 'border-green-500/50 animate-pulse shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
                        : 'border-white/5'
                    }`}
                  >
                    {newItemPulse === review.id && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-bounce z-10">
                        NEW
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex-1">
                        <h4 className="text-4xl font-serif font-bold text-white mb-4 leading-tight">
                          {review.snippets?.title || 'Untitled Manuscript'}
                        </h4>
                        <div className="flex items-center gap-6 mb-6">
                          <span className="bg-red-600/10 text-red-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                            Protocol {review.snippets?.id?.slice(0, 4) || 'N/A'}
                          </span>
                          <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
                            By {review.profiles?.full_name || 'Author'}
                          </span>
                          <span className="text-zinc-700 text-xs font-black uppercase tracking-widest">
                            ${review.snippets?.price || '0.00'}
                          </span>
                        </div>
                        <p className="text-zinc-500 italic text-xl leading-relaxed mb-8 border-l-4 border-red-600/20 pl-6">
                          "{review.snippets?.preview_text || review.snippets?.content?.slice(0, 150) + '...'}"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                      <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                        Submitted {new Date(review.submitted_at).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => claimReview(review.id)} 
                        className="px-10 py-5 bg-red-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:bg-white hover:text-black transition-all"
                      >
                        Claim Review (+1 Credit)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[60px]">
                <p className="text-4xl font-serif italic text-zinc-800 mb-4">Review Queue Empty</p>
                <p className="text-xl text-zinc-700">No pending manuscripts awaiting verification.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: REVIEW TERMINAL (Student Editor Review Interface) */}
        {view === 'review_terminal' && selectedReview && profile?.role === 'editor' && (
          <div className="p-16 h-full flex flex-col animate-in zoom-in-95 duration-500">
            <header className="flex justify-between items-end mb-12">
              <div className="w-2/3">
                <h2 className="font-serif font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}>
                  {selectedReview.snippets?.title || 'Untitled Manuscript'}
                </h2>
                <div className="flex items-center gap-6">
                  <span className="bg-red-600/10 text-red-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                    Reviewing Protocol {selectedReview.snippets?.id?.slice(0, 4)}
                  </span>
                  <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
                    Author: {selectedReview.profiles?.full_name}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setSelectedReview(null); setView('review_queue'); }}
                  className="px-8 py-5 bg-zinc-900/50 text-zinc-400 rounded-full font-black text-sm uppercase tracking-widest border border-white/5 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  ← Back
                </button>
                <button 
                  onClick={rejectReview} 
                  disabled={isBusy}
                  className="px-10 py-5 bg-zinc-900/50 text-zinc-400 rounded-full font-black text-sm uppercase tracking-widest border border-white/5 hover:bg-red-600/20 hover:text-red-600 hover:border-red-600/50 transition-all disabled:opacity-50"
                >
                  Reject
                </button>
                <button 
                  onClick={approveReview} 
                  disabled={isBusy}
                  className="px-12 py-5 bg-red-600 text-white rounded-full font-black text-lg uppercase tracking-widest shadow-xl hover:bg-white hover:text-black transition-all disabled:opacity-50"
                >
                  {isBusy ? 'Processing...' : 'Approve (+1 Credit)'}
                </button>
              </div>
            </header>
            
            <div className="flex-1 bg-zinc-900/20 rounded-[60px] border border-white/5 p-12 relative shadow-inner overflow-hidden mb-8">
              <textarea 
                value={reviewContent} 
                onChange={(e) => setReviewContent(e.target.value)} 
                placeholder="Edit and verify the manuscript content..."
                className="w-full h-full bg-transparent outline-none text-4xl font-serif leading-relaxed text-zinc-300 placeholder:text-zinc-900 resize-none scrollbar-hide"
              />
              <div className="absolute bottom-10 right-16 flex items-center gap-6">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-zinc-800" />
                </div>
                <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                  Words: {reviewContent.split(/\s+/).filter(Boolean).length}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/30 rounded-[40px] border border-white/5 p-8">
              <label className="block text-white text-sm font-black uppercase tracking-widest mb-4">
                Editor Notes {selectedReview.status === 'in_progress' && '(Required for rejection)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes, suggestions, or rejection reasons..."
                className="w-full h-32 bg-black/50 border border-white/10 rounded-[30px] p-6 text-white outline-none focus:border-red-600 text-lg font-serif resize-none"
              />
            </div>
          </div>
        )}

        {/* VIEW: MARKETPLACE */}
        {view === 'marketplace' && (
          <div className="p-16 h-full overflow-y-auto max-w-7xl mx-auto scrollbar-hide">
            <div className="flex justify-between items-baseline border-b border-white/5 pb-12 mb-16">
              <h2 className="font-serif font-bold italic text-white tracking-tighter" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)' }}>Exchange</h2>
              <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">Verified Assets Only</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {marketItems.map((item, i) => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 p-12 rounded-[60px] hover:border-red-600/30 transition-all duration-500 group relative">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-3 items-center">
                      <span className="bg-red-600/10 text-red-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Protocol {item.id.slice(0,4)}</span>
                      {item.verified && (
                        <span className="bg-green-600/20 text-green-400 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-green-600/30">✓ Verified</span>
                      )}
                    </div>
                    <span className="text-4xl font-mono font-bold text-white tracking-tighter">${item.price}</span>
                  </div>
                  <h4 className="text-3xl font-serif font-bold text-white mb-6 leading-tight">{item.title}</h4>
                  <p className="text-zinc-500 italic text-xl leading-relaxed mb-10 h-36 overflow-hidden border-t border-white/5 pt-6">"{item.preview_text}"</p>
                  <button className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-xl">Acquire License</button>
                  <div className="mt-6 flex justify-between items-center px-4">
                    <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">By {item.profiles?.full_name}</span>
                    {item.verified_editor?.full_name ? (
                      <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">✓ Verified by {item.verified_editor.full_name}</span>
                    ) : (
                      <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">✓ Student-Verified IP</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROFILE (The Multi-Persona Dashboard) */}
        {view === 'profile' && (
          <div className="p-16 h-full overflow-y-auto max-w-6xl mx-auto space-y-12 scrollbar-hide animate-in slide-in-from-bottom-10">
            {/* Persona Header */}
            <div className="bg-zinc-900/50 p-16 rounded-[80px] border border-white/10 flex items-center gap-16 relative">
              <div className="w-48 h-48 bg-red-600 rounded-[50px] flex items-center justify-center text-8xl shadow-[0_0_60px_rgba(220,38,38,0.4)] rotate-2">👤</div>
              <div>
                <h2 className="font-serif font-bold text-white tracking-tighter mb-4 italic" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.375rem)' }}>{profile?.full_name || 'Member'}</h2>
                <div className="flex items-center gap-6">
                  <p className="text-zinc-500 font-mono text-xl uppercase tracking-widest">{user?.email}</p>
                  <span className="bg-white/5 text-red-600 px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-red-600/20">
                    {profile?.role === 'editor' ? 'Elite Student Editor' : 'Professional Author'}
                  </span>
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="absolute top-12 right-12 text-zinc-800 hover:text-red-600 text-3xl transition">🚪</button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatBox label="Active Snippets" val={snippets.length} />
              <StatBox 
                label={profile?.role === 'editor' ? "Degree Credits" : "Net Revenue"} 
                val={profile?.role === 'editor' ? (profile?.credits || 0) : `$${profile?.balance || '0.00'}`} 
                color="text-red-600" 
              />
              <StatBox label="Reputation Score" val="9.8" color="text-zinc-500" />
            </div>

            {/* Inventory Vault */}
            <div className="bg-zinc-900/20 p-12 rounded-[60px] border border-white/5">
              <div className="flex justify-between items-center mb-10 px-4">
                <h3 className="text-4xl font-serif font-bold italic text-white">Private Vault</h3>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic underline">Manage All Assets</span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {snippets.length > 0 ? snippets.map((s, i) => {
                  const reviewStatus = pendingReviews.find(r => r.snippet_id === s.id);
                  const getStatusBadge = () => {
                    if (s.verified) return { text: '✓ Verified', color: 'bg-green-600/20 text-green-400 border-green-600/30' };
                    if (reviewStatus?.status === 'approved') return { text: 'Approved', color: 'bg-green-600/10 text-green-500 border-green-600/20' };
                    if (reviewStatus?.status === 'rejected') return { text: 'Rejected', color: 'bg-red-600/10 text-red-500 border-red-600/20' };
                    if (reviewStatus?.status === 'in_progress') return { text: 'In Review', color: 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20' };
                    if (reviewStatus?.status === 'pending' || s.verification_status === 'pending_review') return { text: 'Pending Review', color: 'bg-blue-600/10 text-blue-500 border-blue-600/20' };
                    return { text: 'Draft', color: 'bg-zinc-900/50 text-zinc-600 border-white/10' };
                  };
                  const status = getStatusBadge();
                  
                  return (
                    <div key={i} className="flex justify-between items-center p-8 bg-black/40 rounded-[40px] border border-white/5 hover:border-red-600/40 transition-all group">
                      <div className="flex items-center gap-8 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl text-zinc-600">📄</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <p className="text-2xl font-bold text-white">{s.title}</p>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest italic">{new Date(s.created_at).toDateString()}</p>
                          {reviewStatus?.editor_notes && (
                            <p className="text-xs text-zinc-600 italic mt-2 max-w-md">{reviewStatus.editor_notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {!s.verified && s.verification_status === 'draft' && (
                          <button 
                            onClick={() => {
                              setEditingSnippetId(s.id);
                              setTitle(s.title);
                              setContent(s.content);
                              setPrice(s.price?.toString() || '49.99');
                              setView('write');
                            }}
                            className="px-6 py-3 bg-zinc-900 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition"
                          >
                            Edit
                          </button>
                        )}
                        {!s.verified && (s.verification_status === 'draft' || !s.verification_status) && (
                          <button 
                            onClick={() => submitForReview(s.id)}
                            className="px-6 py-3 bg-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition border border-red-600/30"
                          >
                            Submit for Review
                          </button>
                        )}
                        {s.verified && (
                          <span className="px-6 py-3 bg-green-600/20 text-green-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-600/30">
                            Listed in Exchange
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                    <p className="text-2xl font-serif italic text-zinc-800">No assets currently secured in cloud vault.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AUTH OVERLAY */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-8">
            <div className="bg-[#080808] p-16 rounded-[100px] w-full max-w-2xl border border-white/5 text-center relative shadow-[0_0_100px_rgba(220,38,38,0.1)]">
              <h2 className="font-serif font-bold mb-10 italic text-white tracking-tighter" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.375rem)' }}>{isSignUp ? 'Create' : 'Entry'}</h2>
              
              {isSignUp && (
                <div className="flex gap-4 mb-10 justify-center">
                  <button onClick={() => setRole('author')} className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${role === 'author' ? 'bg-red-600 border-red-600 shadow-xl' : 'border-white/10 text-zinc-700'}`}>Author</button>
                  <button onClick={() => setRole('editor')} className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${role === 'editor' ? 'bg-red-600 border-red-600 shadow-xl' : 'border-white/10 text-zinc-700'}`}>Student Editor</button>
                </div>
              )}

              <div className="space-y-4 mb-12 max-w-md mx-auto">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Identity" className="w-full p-8 bg-black border border-white/10 rounded-[40px] text-white outline-none focus:border-red-600 text-2xl transition-all" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Key" className="w-full p-8 bg-black border border-white/10 rounded-[40px] text-white outline-none focus:border-red-600 text-2xl transition-all" />
              </div>

              <button onClick={handleAuthProtocol} disabled={isBusy} className="w-full max-w-md py-8 bg-red-600 rounded-[40px] font-black text-3xl hover:bg-white hover:text-black transition-all shadow-2xl">
                {isBusy ? '...' : 'EXECUTE'}
              </button>
              <button onClick={() => setShowAuth(false)} className="mt-10 text-zinc-800 text-[10px] font-black uppercase tracking-[0.5em] block mx-auto hover:text-white transition">Abort</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}