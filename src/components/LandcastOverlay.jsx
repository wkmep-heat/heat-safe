import { FaGlobeAsia, FaTimes } from 'react-icons/fa';

export const LANDCAST_URL = 'https://landcast-kk.vercel.app/';

export default function LandcastOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-[3000] flex flex-col" style={{ background: 'rgba(15,23,42,0.6)' }}>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(15,23,42,0.93)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <FaGlobeAsia size={13} color="#38bdf8" />
          <span className="text-[13px] font-bold text-white">Heat Safe</span>
        </div>
        <button
          onClick={onClose}
          title="ปิด"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <FaTimes size={14} />
        </button>
      </div>
      <iframe
        src={LANDCAST_URL}
        title="Heat Safe"
        className="flex-1 w-full"
        style={{ border: 'none' }}
      />
    </div>
  );
}
