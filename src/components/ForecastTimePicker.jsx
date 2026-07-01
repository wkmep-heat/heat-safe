import { useState, useMemo, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaThermometerHalf } from 'react-icons/fa';

const TZ_MS = 7 * 3600 * 1000; // Bangkok = UTC+7

const DAY_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function makeSlots() {
  const now = new Date();
  const h = Math.floor(now.getUTCHours() / 3) * 3;
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h));
  // 7 days × 8 slots/day = 56 slots
  return Array.from({ length: 56 }, (_, i) => new Date(base.getTime() + i * 10800000));
}

export function toApiStr(d) {
  return (
    d.getUTCFullYear() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0') +
    String(d.getUTCHours()).padStart(2, '0') +
    '00'
  );
}

function toBKK(d) {
  return new Date(d.getTime() + TZ_MS);
}

function dayKey(bkkDate) {
  return `${bkkDate.getUTCFullYear()}-${bkkDate.getUTCMonth()}-${bkkDate.getUTCDate()}`;
}

function dayLabel(bkkDate) {
  return `${DAY_TH[bkkDate.getUTCDay()]} ${bkkDate.getUTCDate()} ${MONTH_TH[bkkDate.getUTCMonth()]}`;
}

export default function ForecastTimePicker({ datetime, onChange, sidebarOpen }) {
  const slots = useMemo(makeSlots, []);

  const days = useMemo(() => {
    const map = new Map();
    slots.forEach(utc => {
      const b = toBKK(utc);
      const k = dayKey(b);
      if (!map.has(k)) map.set(k, { b, utcSlots: [] });
      map.get(k).utcSlots.push(utc);
    });
    return [...map.values()];
  }, [slots]);

  const [dayIdx, setDayIdx] = useState(() => {
    const found = days.findIndex(day =>
      day.utcSlots.some(s => toApiStr(s) === datetime)
    );
    return found >= 0 ? found : 0;
  });

  const scrollRef = useRef(null);

  const todaySlots = days[dayIdx]?.utcSlots ?? [];

  // Scroll selected chip into view when day or selection changes
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [dayIdx, datetime]);

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
      {/* Icon */}
      <FaThermometerHalf className="text-orange-400 shrink-0" size={14} />

      {/* Day navigation */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setDayIdx(i => Math.max(0, i - 1))}
          disabled={dayIdx === 0}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-all"
        >
          <FaChevronLeft size={9} />
        </button>
        <span className="text-white text-xs font-medium w-[88px] text-center whitespace-nowrap select-none">
          {days[dayIdx] ? dayLabel(days[dayIdx].b) : '—'}
        </span>
        <button
          onClick={() => setDayIdx(i => Math.min(days.length - 1, i + 1))}
          disabled={dayIdx === days.length - 1}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-all"
        >
          <FaChevronRight size={9} />
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Time chips — horizontally scrollable */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 flex-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {todaySlots.map(utc => {
          const api = toApiStr(utc);
          const bkkTime = toBKK(utc);
          const hour = String(bkkTime.getUTCHours()).padStart(2, '0');
          const selected = api === datetime;
          return (
            <button
              key={api}
              data-selected={selected}
              onClick={() => onChange(api)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150"
              style={{
                background: selected ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selected ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.07)'}`,
                color: selected ? '#FB923C' : '#64748b',
                fontWeight: selected ? 600 : 400,
                boxShadow: selected ? '0 0 8px rgba(249,115,22,0.3)' : 'none',
              }}
            >
              {hour}:00
            </button>
          );
        })}
      </div>

      {/* UTC note */}
      <span className="text-[10px] text-slate-600 shrink-0 select-none">เวลาไทย</span>
    </div>
  );
}
