import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, mode } = await req.json();
  
  // Refinement mode: Professionalize the tone for market-ready IP
  if (mode === 'refine') {
    // Professional refinement: Improve clarity, formality, and market appeal
    let refined = text
      .replace(/\s+/g, ' ') // Fix spacing
      .replace(/\bi\b/g, 'I') // Fix lowercase 'i'
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bit's\b/gi, 'it is')
      .replace(/\bthat's\b/gi, 'that is')
      .trim();
    
    // Capitalize first letter
    if (refined.length > 0) {
      refined = refined.charAt(0).toUpperCase() + refined.slice(1);
    }
    
    // Ensure proper sentence endings
    if (refined.length > 0 && !refined.match(/[.!?]$/)) {
      refined += '.';
    }
    
    return NextResponse.json({ 
      refined,
      mode: 'refine'
    });
  }
  
  // Default mode: Grammar cleanup
  const improvedText = text
    .replace(/\s+/g, ' ') // Fixes spacing
    .replace(/\bi\b/g, 'I'); // Fixes lowercase 'i'
    
  return NextResponse.json({ 
    suggestion: `AI Polish: ${improvedText}\n\n[Tip: Use more active verbs to engage your reader!]` 
  });
}