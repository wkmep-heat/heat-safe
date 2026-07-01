import { useState, useRef } from 'react';
import { FaHome, FaMap, FaFireAlt, FaExclamationTriangle, FaRoute } from 'react-icons/fa';

const TABS = [
  { id: 'map',         label: 'แผนที่',     icon: FaMap },
  { id: 'simulation',  label: 'Heat Safe',  icon: FaFireAlt },
  { id: 'home',        label: 'หน้าหลัก',  icon: FaHome },
  { id: 'risk-areas',  label: 'เสี่ยงภัย', icon: FaExclamationTriangle },
  { id: 'traveltime',  label: 'Travel Map', icon: FaRoute },
];

const TAB_COLORS = {
  home:          ['#60a5fa', '#3b82f6'],
  map:           ['#34d399', '#10b981'],
  simulation:    ['#fb923c', '#ef4444'],
  'risk-areas':  ['#fbbf24', '#f97316'],
  traveltime:    ['#a78bfa', '#8b5cf6'],
};

/* ─── shared animation ─── */
const BUBBLE_ANIM = 'bubblePop 0.22s cubic-bezier(0.34,1.56,0.64,1)';

const styles = `
  @keyframes bubblePop {
    0%   { transform: scale(0.5); opacity: 0.6; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1;   }
  }
`;

export default function BottomNav({ activeTab, onTabChange }) {
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  function handleLogoTap() {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      window.location.href = '/?admin';
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
  }

  return (
    <>
      <style>{styles}</style>

      {/* ══════════════════════════════════════════════════════════
          MOBILE  –  horizontal bottom bar  (hidden on md+)
          ══════════════════════════════════════════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[1001]"
        style={{
          height: 'calc(52px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft:   'env(safe-area-inset-left, 0px)',
          paddingRight:  'env(safe-area-inset-right, 0px)',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #e0eaff',
          boxShadow: '0 -4px 24px rgba(59,130,246,0.08)',
          overflow: 'visible',
        }}
      >
        <div className="flex" style={{ height: '52px' }}>
          {TABS.map(tab => {
            const Icon    = tab.icon;
            const isActive = activeTab === tab.id;
            const [c1, c2] = TAB_COLORS[tab.id] ?? ['#60a5fa','#3b82f6'];
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-end pb-1.5 flex-1 h-full min-w-0"
              >
                {/* Active bubble – floats above bar */}
                {isActive && (
                  <div className="absolute left-1/2"
                    style={{ top: 0, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
                    <div className="absolute inset-0 rounded-full opacity-25 scale-125"
                      style={{ background: `radial-gradient(circle,${c1},transparent 70%)` }} />
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(145deg,${c1},${c2})`,
                        boxShadow: `0 4px 16px ${c2}55`,
                        animation: BUBBLE_ANIM,
                      }}>
                      <Icon size={18} color="white" />
                    </div>
                  </div>
                )}
                {/* Inactive icon */}
                {!isActive && (
                  <div className="flex items-center justify-center mb-0.5" style={{ width:28, height:22 }}>
                    <Icon size={13} color="#94a3b8" />
                  </div>
                )}
                <span className="text-[8px] font-semibold leading-none truncate max-w-full px-0.5"
                  style={{ color: isActive ? c2 : '#94a3b8' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP  –  vertical left rail  (hidden below md)
          ══════════════════════════════════════════════════════════ */}
      <nav
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-[1001] flex-col"
        style={{
          width: '80px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid #e0eaff',
          boxShadow: '2px 0 20px rgba(59,130,246,0.07)',
        }}
      >
        {/* Logo — tap 5× to enter admin */}
        <button
          onClick={handleLogoTap}
          className="flex items-center justify-center flex-shrink-0 w-full"
          style={{ height: '64px', borderBottom: '1px solid #e0eaff' }}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)' }}>
            <span className="text-white font-black text-sm select-none">KK</span>
          </div>
        </button>

        {/* Tab items */}
        <div className="flex-1 flex flex-col items-center justify-evenly py-3">
          {TABS.map(tab => {
            const Icon    = tab.icon;
            const isActive = activeTab === tab.id;
            const [c1, c2] = TAB_COLORS[tab.id] ?? ['#60a5fa','#3b82f6'];
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center gap-1 w-full py-1.5 px-2 transition-all duration-200"
                title={tab.label}
              >
                {/* Pill / circle indicator */}
                <div
                  className="flex items-center justify-center rounded-2xl transition-all duration-200"
                  style={{
                    width:      isActive ? '54px' : '40px',
                    height:     isActive ? '38px' : '34px',
                    background: isActive
                      ? `linear-gradient(145deg,${c1},${c2})`
                      : 'transparent',
                    boxShadow:  isActive ? `0 4px 14px ${c2}45` : 'none',
                    animation:  isActive ? BUBBLE_ANIM : 'none',
                  }}
                >
                  <Icon size={isActive ? 17 : 16} color={isActive ? 'white' : '#94a3b8'} />
                </div>
                {/* Label */}
                <span
                  className="text-[8px] font-semibold leading-none text-center transition-colors duration-200"
                  style={{ color: isActive ? c2 : '#b0bdcc' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
