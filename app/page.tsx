"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SnippetsApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", role: "writer", credits: 0 });
  const [snippets, setSnippets] = useState<any[]>([]);
  const [newSnippet, setNewSnippet] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null); // For Reviews

  // 1. SAVE LOGIN STATE (Persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('snippets_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    const { data } = await supabase.from('snippets').select('*').order('created_at', { ascending: false });
    if (data) setSnippets(data);
  };

  const handleLogin = (role: string) => {
    const newUser = { name: role === 'student' ? "Editor_Alpha" : "Writer_User", role, credits: 5 };
    localStorage.setItem('snippets_user', JSON.stringify(newUser));
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const handlePost = async () => {
    if (newSnippet.length > 2) {
      await supabase.from('snippets').insert([{ content: newSnippet, author_name: user.name, role: user.role }]);
      setNewSnippet("");
      setIsModalOpen(false);
      fetchSnippets();
    }
  };

  const approveSnippet = async (id: string) => {
    alert("Review Submitted! +1 College Credit Earned.");
    setSelectedSnippet(null);
    // In final phase, we update the DB here
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md w-full text-center border border-slate-200">
          <h1 className="text-4xl font-serif font-bold mb-8 italic underline decoration-orange-500">SNIPPETS</h1>
          <button onClick={() => handleLogin('writer')} className="w-full bg-black text-white py-4 rounded-2xl font-bold mb-4">Enter as Writer</button>
          <button onClick={() => handleLogin('student')} className="w-full border-2 border-black py-4 rounded-2xl font-bold">Enter as Student Editor</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-2xl font-serif font-bold italic">The Hub</h2>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{user.role} Account • {user.credits} Credits</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-xs font-bold text-slate-400 mr-4">Logout</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">+ New Snippet</button>
          </div>
        </div>

        {/* FEED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {snippets.map((s) => (
            <div 
              key={s.id} 
              onClick={() => setSelectedSnippet(s)}
              className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:border-orange-500 transition-all relative overflow-hidden group"
            >
              <p className="text-xl font-serif italic mb-6 leading-relaxed">"{s.content}"</p>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">By {s.author_name}</p>
                <span className="text-[10px] font-black text-orange-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Click to Review →</span>
              </div>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-4xl font-black uppercase rotate-[-15deg]">
                {user.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEW MODAL (FOR STUDENTS) */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-serif font-bold mb-2">Reviewing Manuscript</h3>
            <p className="text-slate-400 text-sm mb-6 border-b pb-4">Author: {selectedSnippet.author_name}</p>
            <div className="bg-slate-50 p-6 rounded-2xl italic font-serif text-lg mb-8 leading-relaxed">
              "{selectedSnippet.content}"
            </div>
            
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Your Editorial Notes</h4>
            <textarea className="w-full h-32 p-4 border rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Suggest improvements or mark as 'Ready for Publication'..."></textarea>
            
            <div className="flex justify-end gap-4">
              <button onClick={() => setSelectedSnippet(null)} className="font-bold text-slate-400">Close</button>
              {user.role === 'student' && (
                <button onClick={() => approveSnippet(selectedSnippet.id)} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold">Approve for Credit</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-xl">
            <h3 className="text-2xl font-serif font-bold mb-6">Submit to Feed</h3>
            <textarea 
              className="w-full h-48 p-6 border rounded-2xl outline-none text-lg font-serif"
              placeholder="Paste your masterpiece here..."
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
            />
            <div className="flex justify-end mt-8 gap-4">
              <button onClick={() => setIsModalOpen(false)} className="font-bold text-slate-400">Cancel</button>
              <button onClick={handlePost} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Post to Hub</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}