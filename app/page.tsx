"use client";
import React, { useState, useEffect } from 'react';

export default function SnippetsApp() {
  const [user, setUser] = useState({ name: "Writer_User", credits: 12, isStudent: true, hasAcceptedToS: false });
  const [view, setView] = useState('feed'); 

  // Protection: Disable Right-Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-slate-900 font-sans selection:bg-transparent">
      
      {/* TOOS MODAL */}
      {!user.hasAcceptedToS && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-8 rounded-2xl max-w-md shadow-2xl border border-slate-200">
            <h2 className="text-3xl font-serif font-bold mb-4">Terms of Access</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              By entering the Snippets Hub, you agree that all manuscripts are the <span className="font-bold text-black underline">exclusive property of the author</span>. Plagiarism or unauthorized screen-recording is a legal violation.
            </p>
            <button 
              onClick={() => setUser({...user, hasAcceptedToS: true})}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200"
            >
              I Agree & Enter Hub
            </button>
          </div>
        </div>
      )}

      {/* MODERN NAVIGATION */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs italic">S</span>
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">SNIPPETS</h1>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-500">
            <button onClick={() => setView('feed')} className={view === 'feed' ? "text-orange-600" : "hover:text-black"}>Library</button>
            <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? "text-orange-600" : "hover:text-black"}>Shop</button>
            <button onClick={() => setView('profile')} className={view === 'profile' ? "text-orange-600" : "hover:text-black"}>Account</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-16 pb-24 px-6">
        {view === 'feed' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
              <h2 className="text-5xl font-serif font-medium mb-2 tracking-tight">The Feed</h2>
              <p className="text-slate-500 text-lg">Critique the latest 500-word excerpts from the community.</p>
            </div>

            {/* SNIPPET CARD */}
            <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Script Draft</span>
                <span className="text-slate-400 text-xs font-mono italic">#29481</span>
              </div>
              
              <p className="text-2xl font-serif leading-[1.8] text-slate-800 italic select-none">
                "The rain didn't just fall in Sector 4; it hammered against the glass like a thousand skeletal fingers demanding entry. Kaelen watched the steam rise from his synthetic tea, wondering if the sky remembered being blue."
              </p>

              <div className="mt-10 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold">A. Vance</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sci-Fi Writer</p>
                  </div>
                </div>
                <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform active:scale-95">
                  Suggest Edit
                </button>
              </div>

              {/* ANTI-THEFT WATERMARK */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] rotate-[-15deg]">
                <span className="text-8xl font-black select-none uppercase tracking-tighter text-slate-900">
                  {user.name} viewing
                </span>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl shadow-xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6 shadow-inner border-4 border-white"></div>
              <h2 className="text-4xl font-serif font-bold">{user.name}</h2>
              <p className="text-orange-600 font-black uppercase tracking-widest text-xs mt-2">Verified Student Editor</p>
              
              <div className="grid grid-cols-2 gap-6 w-full mt-10">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Earned Credits</p>
                  <p className="text-4xl font-serif font-bold mt-2">{user.credits}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level</p>
                  <p className="text-4xl font-serif font-bold mt-2">Expert</p>
                </div>
              </div>

              <button className="mt-8 w-full bg-white border-2 border-slate-900 py-4 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2">
                <span>Export for College Credit</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 