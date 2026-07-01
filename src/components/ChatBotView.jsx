import { useRef } from 'react';

const CHAT_URL = 'https://gemini.google.com/gem/1uGmDnZ2dxkNLG9mKkwLTWd17I75taz8G?usp=sharing';
const WIN_W = 420;
const WIN_H = 720;

const SUGGESTIONS = [
  'อุณหภูมิในขอนแก่นวันนี้เป็นอย่างไร?',
  'พื้นที่ไหนเสี่ยงน้ำท่วมในช่วงนี้?',
  'ค่าฝุ่น PM2.5 มีผลต่อสุขภาพอย่างไร?',
  'วิธีรับมือเมื่อเกิดน้ำท่วมฉับพลัน',
];

function GeminiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2C14 8.627 8.627 14 2 14C8.627 14 14 19.373 14 26C14 19.373 19.373 14 26 14C19.373 14 14 8.627 14 2Z"
        fill="url(#gemini-grad)"/>
      <defs>
        <linearGradient id="gemini-grad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f8ef7"/>
          <stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ChatBotView() {
  const winRef = useRef(null);

  function openChat() {
    if (winRef.current && !winRef.current.closed) {
      winRef.current.focus();
      return;
    }
    const left = Math.max(0, window.screen.width  - WIN_W - 24);
    const top  = Math.max(0, window.screen.height - WIN_H - 60);
    winRef.current = window.open(
      CHAT_URL,
      'ai-assistant',
      `width=${WIN_W},height=${WIN_H},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  return (
    <div
      className="absolute right-0 overflow-y-auto overflow-x-hidden"
      style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(180deg,#eff6ff 0%,#f5f0ff 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8 pb-6 flex flex-col items-center">

        {/* ── Avatar ── */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg,#4f8ef7 0%,#8b5cf6 100%)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
          }}
        >
          <GeminiIcon />
        </div>

        {/* ── Title ── */}
        <h1 className="text-2xl font-black text-slate-800 mb-1">AI Assistant</h1>
        <p className="text-sm text-slate-400 mb-6">Powered by Google Gemini</p>

        {/* ── Open chat button ── */}
        <button
          onClick={openChat}
          className="w-full py-4 rounded-3xl text-white font-bold text-base transition-all duration-200 active:scale-95 hover:shadow-xl mb-6"
          style={{
            background: 'linear-gradient(135deg,#4f8ef7 0%,#8b5cf6 100%)',
            boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
          }}
        >
          <div className="flex items-center justify-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            เริ่มแชทกับ AI
          </div>
        </button>

        {/* ── Suggestion chips ── */}
        <div className="w-full mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
            คำถามที่พบบ่อย
          </p>
          <div className="space-y-2">
            {SUGGESTIONS.map((text, i) => (
              <button
                key={i}
                onClick={openChat}
                className="w-full text-left px-4 py-3 rounded-2xl text-sm text-slate-600 transition-all duration-150 active:scale-98 hover:bg-indigo-50"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #e0eaff',
                  boxShadow: '0 1px 6px rgba(59,130,246,0.06)',
                }}
              >
                <span className="text-indigo-400 mr-2">›</span>
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="w-full">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
            ความสามารถ
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🌡️', title: 'สภาพอากาศ',    desc: 'วิเคราะห์ข้อมูลอุณหภูมิ' },
              { icon: '💧', title: 'น้ำท่วม',       desc: 'คาดการณ์และแจ้งเตือน' },
              { icon: '🌫️', title: 'คุณภาพอากาศ',  desc: 'PM2.5 และมลพิษ' },
              { icon: '🗺️', title: 'พื้นที่เสี่ยง', desc: 'ข้อมูลเชิงพื้นที่' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-3 bg-white text-center"
                style={{ border: '1px solid #e0eaff' }}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs font-bold text-slate-700">{f.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Note ── */}
        <p className="text-[10px] text-slate-300 text-center mt-5">
          จะเปิดในหน้าต่างใหม่ · ต้องการการเข้าสู่ระบบ Google
        </p>
      </div>
    </div>
  );
}
