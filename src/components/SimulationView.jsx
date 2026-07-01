import { useState } from 'react';
import { FaFireAlt, FaExternalLinkAlt, FaRedo } from 'react-icons/fa';

const SIM_URL = 'https://web-page-rose-six.vercel.app/';

export default function SimulationView() {
  const [key, setKey] = useState(0);

  return (
    <div className="absolute right-0 flex flex-col"
      style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e0eaff',
        }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
        >
          <FaFireAlt className="text-white" size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-tight truncate">
            Heat Safe
          </p>
          <p className="text-[10px] text-slate-400 leading-none">Heat Safe · Khon Kaen</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setKey(k => k + 1)}
            title="รีโหลด"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <FaRedo size={13} />
          </button>
          <a
            href={SIM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="เปิดในแท็บใหม่"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <FaExternalLinkAlt size={12} />
          </a>
        </div>
      </div>

      {/* iframe */}
      <iframe
        key={key}
        src={SIM_URL}
        title="Heat Safe"
        className="flex-1 w-full"
        style={{ border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      />
    </div>
  );
}
