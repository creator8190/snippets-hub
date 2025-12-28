"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SnippetsApp() {
  const [view, setView] = useState('hub'); 
  const [user, setUser] = useState({ name: "User", role: "writer", rep: 0 });
  const [snippets, setSnippets] = useState<any[]>([]);
  const [myDrafts, setMyDrafts] = useState<string>(""); 
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('snippets_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const fetchData = async () => {
    const { data: snaps } = await supabase.from('snippets').select('*, reviews(*)').order('created_at', { ascending: false });
    if (snaps) setSnippets(snaps);
  };

  const handleReview = async () => {
    await supabase.from('reviews').insert([
      { snippet_id: selectedSnippet.id, reviewer_name: user.name, content: reviewText, rating: 5 }
    ]);
    alert("Review Saved! Reputation +10");
    setReviewText("");
    setSelectedSnippet(null);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] text-slate-900 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-white border-r flex flex-col items-center py-8 gap-10 shadow-sm z-50">
        <div className="text-2xl font-serif font-black text-orange-600 underline">S.</div>
        <button onClick={() => setView('hub')} className={`p-3 rounded-xl ${view === 'hub' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>🏛️</button>
        <button onClick={() => setView('editor')} className={`p-3 rounded-xl ${view === 'editor' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>✍️</button>
        <button onClick={() => setView('profile')} className={`p-3 rounded-xl ${view === 'profile' ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>👤</button>
      </nav>

      <main className="pl-28 pr-8 py-12 max-w-6xl mx-auto">
        
        {/* VIEW 1: THE PUBLIC HUB */}
        {view === 'hub' && (
          <div className="animate-in fade-in duration-700">
            <h1 className="text-5xl font-serif font-bold mb-2">The Global Hub</h1>
            <p className="text-slate-400 mb-12 uppercase tracking-tighter font-bold">Discover & Protect Original Voices</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {snippets.map(s => (
                <div key={s.id} onClick={() => setSelectedSnippet(s)} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:scale-[1.01] transition-all cursor-pointer group">
                  <p className="text-2xl font-serif italic mb-8 leading-relaxed">"{s.content}"</p>
                  <div className="flex justify-between items-center border-t pt-6">
                    <span className="text-xs font-bold text-slate-400">By {s.author_name}</span>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-50 rounded-full">{s.reviews?.length || 0} Reviews</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: THE WRITING ROOM (DRAFT YOUR BOOK) */}
        {view === 'editor' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-serif font-bold mb-8 italic">The Private Drafting Room</h1>
            <textarea 
              value={myDrafts}
              onChange={(e) => setMyDrafts(e.target.value)}
              placeholder="Write your full book here. This is private and auto-saves to your local session..."
              className="w-full h-[60vh] bg-white p-12 rounded-[3rem] shadow-inner border-none text-xl font-serif leading-loose outline-none"
            />
            <div className="mt-8 flex justify-between items-center">
              <p className="text-slate-400 text-sm">Highlight a section to "Push to Hub" as a snippet.</p>
              <button onClick={() => alert("Snippet pushed to Global Hub!")} className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl">Push to Hub</button>
            </div>
          </div>
        )}

        {/* VIEW 3: PROFILE & RATINGS */}
        {view === 'profile' && (
          <div className="text-center py-20 bg-white rounded-[4rem] shadow-sm border border-slate-100">
            <div className="w-32 h-32 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">👑</div>
            <h2 className="text-4xl font-serif font-bold">{user.name}</h2>
            <p className="text-orange-600 font-black uppercase tracking-widest text-xs mt-2">{user.role}</p>
            
            <div className="flex justify-center gap-12 mt-12">
              <div className="text-center">
                <p className="text-3xl font-bold">4.9</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Reviewer Rating</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{user.rep || 150}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Trust Points</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REVIEW OVERLAY */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] p-12 overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-serif font-bold mb-8">Manuscript Feedback</h2>
            <div className="bg-slate-50 p-8 rounded-3xl italic font-serif text-xl mb-10">"{selectedSnippet.content}"</div>
            
            <div className="space-y-6 mb-10">
              <h4 className="font-bold text-sm uppercase text-slate-400">Past Editorial Notes</h4>
              {selectedSnippet.reviews?.map((r: any) => (
                <div key={r.id} className="border-l-4 border-orange-500 pl-6 py-2">
                  <p className="text-sm font-bold">{r.reviewer_name}</p>
                  <p className="text-slate-600 italic">"{r.content}"</p>
                </div>
              ))}
            </div>

            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full h-32 p-6 border-2 border-slate-100 rounded-2xl mb-6 outline-none focus:border-orange-500"
              placeholder="Leave a professional review..."
            />
            <div className="flex justify-end gap-6">
              <button onClick={() => setSelectedSnippet(null)} className="font-bold text-slate-400">Close</button>
              <button onClick={handleReview} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}