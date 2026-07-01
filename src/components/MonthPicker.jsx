import { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaSatelliteDish } from 'react-icons/fa';

const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function generateMonths() {
  const now = new Date();
  const months = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear(); y++) {
    const maxM = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = 0; m <= maxM; m++) {
      months.push({
        year: y,
        month: m,
        value: `${y}-${String(m + 1).padStart(2, '0')}`,
        label: MONTH_TH[m],
      });
    }
  }
  return months;
}

export default function MonthPicker({ selectedMonth, onChange, sidebarOpen }) {
  const months = useMemo(generateMonths, []);

  const byYear = useMemo(() => {
    const map = new Map();
    months.forEach(m => {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year).push(m);
    });
    return [...map.values()];
  }, [months]);

  const [yearIdx, setYearIdx] = useState(() => byYear.length - 1);

  const currentMonths = byYear[yearIdx] ?? [];
  const thYear = (currentMonths[0]?.year ?? new Date().getFullYear()) + 543;

  const leftOffset = sidebarOpen
    ? 'calc(var(--nav-x, 0px) + min(340px, 85vw) + 16px)'
    : 'calc(var(--nav-x, 0px) + 16px)';

  return (
    <div
      className="fixed z-[999] flex items-center gap-3 px-4 py-2.5 rounded-2xl"
      style={{
        bottom: 'calc(var(--nav-bottom, 0px) + 16px)',
        left: leftOffset,
        right: '240px',
        background: 'rgba(8,12,26,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <FaSatelliteDish className="text-violet-400 shrink-0" size={13} />

      {/* Year navigation */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setYearIdx(i => Math.max(0, i - 1))}
          disabled={yearIdx === 0}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-all"
        >
          <FaChevronLeft size={9} />
        </button>
        <span className="text-white text-xs font-medium w-14 text-center whitespace-nowrap select-none">
          พ.ศ. {thYear}
        </span>
        <button
          onClick={() => setYearIdx(i => Math.min(byYear.length - 1, i + 1))}
          disabled={yearIdx === byYear.length - 1}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-all"
        >
          <FaChevronRight size={9} />
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Month chips */}
      <div
        className="flex gap-1.5 flex-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {currentMonths.map(m => {
          const selected = m.value === selectedMonth;
          return (
            <button
              key={m.value}
              onClick={() => onChange(m.value)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs transition-all duration-150"
              style={{
                background: selected ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selected ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.07)'}`,
                color: selected ? '#a78bfa' : '#64748b',
                fontWeight: selected ? 600 : 400,
                boxShadow: selected ? '0 0 8px rgba(167,139,250,0.3)' : 'none',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-600 shrink-0 select-none">NASA MODIS</span>
    </div>
  );
}
