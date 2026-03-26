import React from 'react';

// Brand Guide Colors:
// Navy: #020554
// Gold: #A67D00

export const Logo = ({ className = "w-full h-auto" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" className={className}>
    {/* 
      Design based on "Additional Option" (Dark Background) from Brand Guide:
      - White Lines for Roofs
      - Gold Windows
      - White Text
    */}

    {/* TOP ROOF */}
    {/* Chimney */}
    <rect x="120" y="35" width="12" height="20" fill="white" />
    
    {/* Roof Line */}
    <path d="M60 90 L150 40 L240 90" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Top Window (Gold 4-pane) */}
    <g transform="translate(141, 65)">
        <rect x="0" y="0" width="18" height="18" fill="#A67D00" />
        <line x1="9" y1="0" x2="9" y2="18" stroke="#1f2937" strokeWidth="2" />
        <line x1="0" y1="9" x2="18" y2="9" stroke="#1f2937" strokeWidth="2" />
    </g>

    {/* TEXT */}
    <text x="150" y="140" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="42" fill="white">WE FLIP</text>
    
    {/* Separator Line */}
    <line x1="60" y1="155" x2="240" y2="155" stroke="#020554" strokeWidth="2" /> {/* Dark line on light bg, or invisible on dark? Let's make it subtle or match branding */}
    <line x1="60" y1="155" x2="240" y2="155" stroke="white" strokeWidth="2" />

    <text x="150" y="185" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="20" letterSpacing="12" fill="white">HOUSES</text>

    {/* BOTTOM ROOF (Inverted) */}
    <path d="M60 200 L150 250 L240 200" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Bottom Window (Gold 4-pane) */}
    <g transform="translate(141, 215)">
        <rect x="0" y="0" width="18" height="18" fill="#A67D00" />
        <line x1="9" y1="0" x2="9" y2="18" stroke="#1f2937" strokeWidth="2" />
        <line x1="0" y1="9" x2="18" y2="9" stroke="#1f2937" strokeWidth="2" />
    </g>
    
    {/* Small Chimney bottom? The logo seems to have a small notch on the right side of the bottom roof in some versions, 
        but looking at the PDF page 1, it looks like a mirror of the top but with the chimney on the right/bottom.
        Let's add the bottom chimney-like extension if visible in the brand guide.
        Page 1: Yes, bottom right has a vertical line extending down.
    */}
    <rect x="168" y="240" width="12" height="20" fill="white" />

  </svg>
);

export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
        {/* Simplified Icon: Top Roof + Window + Initials */}
        <path d="M10 40 L50 15 L90 40" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="30" y="20" width="8" height="12" fill="white" /> {/* Chimney */}
        
        {/* Window */}
        <g transform="translate(44, 30)">
            <rect x="0" y="0" width="12" height="12" fill="#A67D00" />
            <line x1="6" y1="0" x2="6" y2="12" stroke="#020554" strokeWidth="1" />
            <line x1="0" y1="6" x2="12" y2="6" stroke="#020554" strokeWidth="1" />
        </g>

        <text x="50" y="80" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="30" fill="white">WFH</text>
    </svg>
);