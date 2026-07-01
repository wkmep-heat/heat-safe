import { useState, useEffect, useRef } from 'react';
import { FaWind, FaTint, FaMapMarkerAlt, FaThermometerHalf, FaSun, FaCrosshairs, FaCloudRain } from 'react-icons/fa';
import { getTemperatureColor, getPM25Color, getPM25Level } from '../data/mockData';

function useGeolocationName() {
  const [name, setName]   = useState(null);
  const [state, setState] = useState('idle');

  function request() {
    if (!navigator.geolocation) { setState('error'); return; }
    setState('requesting');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`,
            { headers: { 'Accept-Language': 'th' } }
          );
          const data = await res.json();
          const a    = data.address ?? {};
          const road = a.road ? (a.house_number ? `${a.road} ${a.house_number}` : a.road) : null;
          const best = a.tourism || a.amenity || a.building || a.leisure
                    || a.shop    || a.office  || a.man_made
                    || road
                    || a.neighbourhood || a.suburb
                    || data.display_name?.split(',')[0];
          setName(best ?? 'ตำแหน่งปัจจุบัน');
          setState('ok');
        } catch {
          setName('ตำแหน่งปัจจุบัน');
          setState('ok');
        }
      },
      () => setState('denied'),
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  useEffect(() => { request(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { name, state, retry: request };
}

function getUVLevel(uv) {
  if (uv <= 2)  return { label: 'ต่ำ',      color: '#10b981', bg: 'linear-gradient(135deg,#d1fae5,#6ee7b7)' };
  if (uv <= 5)  return { label: 'ปานกลาง', color: '#d97706', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)' };
  if (uv <= 7)  return { label: 'สูง',       color: '#ea580c', bg: 'linear-gradient(135deg,#ffedd5,#fdba74)' };
  if (uv <= 10) return { label: 'สูงมาก',   color: '#dc2626', bg: 'linear-gradient(135deg,#fee2e2,#fca5a5)' };
  return               { label: 'อันตราย', color: '#7c3aed', bg: 'linear-gradient(135deg,#ede9fe,#c4b5fd)' };
}

const DAY_TH   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

/* ── Animated sun illustration ── */
function SunCloud() {
  return (
    <svg width="88" height="72" viewBox="0 0 88 72" fill="none" aria-hidden="true">
      {/* Sun glow */}
      <circle cx="62" cy="22" r="20" fill="#FDE68A" opacity="0.35" />
      <circle cx="62" cy="22" r="14" fill="#FBBF24" opacity="0.6" />
      <circle cx="62" cy="22" r="9"  fill="#F59E0B" />
      {/* Sun rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return <line key={i}
          x1={62+Math.cos(r)*12} y1={22+Math.sin(r)*12}
          x2={62+Math.cos(r)*17} y2={22+Math.sin(r)*17}
          stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />;
      })}
      {/* Cloud */}
      <ellipse cx="26" cy="52" rx="20" ry="13" fill="white" opacity="0.95" />
      <ellipse cx="42" cy="45" rx="18" ry="13" fill="white" opacity="0.9" />
      <ellipse cx="57" cy="53" rx="15" ry="11" fill="white" opacity="0.85" />
      <ellipse cx="40" cy="56" rx="22" ry="10" fill="white" opacity="0.92" />
    </svg>
  );
}

/* ── Radar iframe (scale-to-fit, no distortion) ── */
const RADAR_URL    = 'https://weather.tmd.go.th/kkn240_HQ_Loop_edit2.php';
const RADAR_ORIG_W = 980;
const RADAR_ORIG_H = 780;

function RadarFrame() {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setScale(e.contentRect.width / RADAR_ORIG_W);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-2xl"
      style={{ height: `${RADAR_ORIG_H * scale}px` }}>
      <iframe
        src={RADAR_URL}
        title="เรดาร์ฝนขอนแก่น"
        scrolling="no"
        loading="lazy"
        style={{
          width:           `${RADAR_ORIG_W}px`,
          height:          `${RADAR_ORIG_H}px`,
          border:          'none',
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          display:         'block',
        }}
      />
    </div>
  );
}

/* ── Weather icon SVG — changes by condition ── */
function WeatherIcon({ weatherCode = 0, hour = 12, prob = 0, isActive }) {
  const isNight = hour >= 20 || hour < 6;
  const code    = weatherCode ?? 0;

  const isThunder     = code >= 95;
  const isRain        = code >= 51 || prob >= 30;
  const isOvercast    = code >= 3  && code < 51;
  const isPartly      = code >= 1  && code < 3;

  const w = isActive ? 'rgba(255,255,255,0.95)' : 'white';
  const cloudCol  = isActive ? w : (isRain ? '#60a5fa' : isOvercast ? '#94a3b8' : '#bfdbfe');
  const sunCol    = isActive ? w : '#fbbf24';
  const moonCol   = isActive ? w : '#fde68a';
  const dropCol   = isActive ? 'rgba(186,230,253,0.9)' : '#3b82f6';
  const boltCol   = isActive ? '#fef08a' : '#fbbf24';

  const intensity  = prob < 30 ? 1 : prob < 70 ? 2 : 3;
  const dropCount  = isRain ? intensity + 1 : 0;
  const dur        = ['1.8s','1.4s','0.9s'][intensity - 1] ?? '1.4s';
  const dropXs     = [8, 14, 20, 26];

  /* Cloud path (reused) */
  const cloudPath = 'M9 19 Q5 19 5 15 Q5 11 9 11 Q10 7 14 7 Q17 4 21 6 Q25 4 28 8 Q32 8 32 12 Q35 12 35 16 Q35 19 31 19 Z';

  /* ── Overcast / rainy / thunder ── all have the cloud prominent */
  if (isThunder || isRain || (isOvercast && prob >= 30)) {
    return (
      <svg width="36" height="32" viewBox="0 0 36 32" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
        <path d={cloudPath} fill={cloudCol}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.25))' }} />
        {/* Rain drops */}
        {dropXs.slice(0, dropCount).map((x, i) => (
          <rect key={i} x={x} y={20} width="2" height="5" rx="1" fill={dropCol}
            className="rain-drop"
            style={{ animationDuration: dur, animationDelay: `${i * (parseFloat(dur) / dropCount)}s` }} />
        ))}
        {/* Lightning bolt */}
        {isThunder && (
          <polygon points="19,20 16,27 19,25 17,32 22,24 19,26" fill={boltCol} />
        )}
      </svg>
    );
  }

  /* ── Partly cloudy ── sun/moon + small cloud */
  if (isPartly || (isOvercast && prob < 30)) {
    return (
      <svg width="36" height="30" viewBox="0 0 36 30" fill="none" aria-hidden="true">
        {isNight ? (
          /* Moon top-right */
          <path d="M27 4 Q22 6 22 11 Q22 16 27 18 Q22 18 19 14 Q17 11 19 7 Q22 3 27 4 Z"
            fill={moonCol} />
        ) : (
          /* Sun top-right */
          <>
            <circle cx="26" cy="10" r="6" fill={sunCol} opacity="0.9" />
            {[0,60,120,180,240,300].map((deg, i) => {
              const r = (Math.PI * deg) / 180;
              return <line key={i} x1={26+Math.cos(r)*8} y1={10+Math.sin(r)*8}
                x2={26+Math.cos(r)*10} y2={10+Math.sin(r)*10}
                stroke={sunCol} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />;
            })}
          </>
        )}
        {/* Cloud covering lower-left */}
        <path d="M4 22 Q2 22 2 19 Q2 16 5 16 Q6 13 9 13 Q11 11 14 12 Q17 10 19 13 Q22 13 22 16 Q24 16 24 19 Q24 22 21 22 Z"
          fill={isActive ? w : '#dbeafe'} />
      </svg>
    );
  }

  /* ── Night clear ── crescent moon */
  if (isNight) {
    return (
      <svg width="36" height="30" viewBox="0 0 36 30" fill="none" aria-hidden="true">
        <path d="M20 6 Q12 8 12 15 Q12 22 20 24 Q13 24 9 19 Q6 15 9 10 Q13 5 20 6 Z"
          fill={moonCol} />
        <circle cx="24" cy="8" r="1.2" fill={moonCol} opacity="0.6" />
        <circle cx="27" cy="14" r="0.8" fill={moonCol} opacity="0.4" />
      </svg>
    );
  }

  /* ── Default: clear day ── sun */
  return (
    <svg width="36" height="30" viewBox="0 0 36 30" fill="none" aria-hidden="true">
      <circle cx="18" cy="15" r="7" fill={sunCol} />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return <line key={i} x1={18+Math.cos(r)*9} y1={15+Math.sin(r)*9}
          x2={18+Math.cos(r)*12} y2={15+Math.sin(r)*12}
          stroke={sunCol} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />;
      })}
    </svg>
  );
}

/* ── Forecast strip ── */
function ForecastStrip({ forecast, tmdData }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="rounded-3xl p-4" style={{
        background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(147,197,253,0.5)',
        boxShadow: '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'white' }}>
          พยากรณ์รายชั่วโมง
        </p>
        <p className="text-xs text-blue-300 animate-pulse text-center py-3">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden" style={{
      background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(147,197,253,0.5)',
      boxShadow: '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: 'white' }}>
          พยากรณ์รายชั่วโมง
        </p>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
          <span className="flex items-center gap-0.5"><FaCloudRain size={7} className="text-blue-400" /> ฝน %</span>
          <span className="flex items-center gap-0.5"><FaThermometerHalf size={7} className="text-orange-400" /> °C</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-3 px-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1.5" style={{ width: 'max-content' }}>
          {forecast.slice(0, 20).map((h) => {
            const tc   = getTemperatureColor(h.temperature);
            const rain = h.isCurrent && tmdData?.rainfall != null
              ? tmdData.rainfall
              : (h.precipitation ?? 0);
            const prob    = h.precipProbability ?? 0;
            const hasRain = prob > 0;
            return (
              <div key={h.time}
                className="flex-shrink-0 rounded-2xl flex flex-col items-center gap-1 py-2.5 px-1.5"
                style={{
                  width: '56px',
                  background: h.isCurrent
                    ? 'linear-gradient(160deg,#f97316,#db2777,#8b5cf6)'
                    : 'linear-gradient(135deg,rgba(219,234,254,0.55) 0%,rgba(191,219,254,0.55) 55%,rgba(186,230,253,0.55) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border:    h.isCurrent ? 'none' : '1px solid rgba(147,197,253,0.5)',
                  boxShadow: h.isCurrent ? '0 4px 16px rgba(219,39,119,0.3)' : 'none',
                }}>
                {/* เวลา */}
                <span className="text-[10px] font-bold leading-none"
                  style={{ color: h.isCurrent ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>
                  {String(h.hour).padStart(2,'0')}:00
                </span>
                {/* ไอคอนสภาพอากาศ */}
                <WeatherIcon weatherCode={h.weatherCode} hour={h.hour} prob={prob} isActive={h.isCurrent} />
                {/* โอกาสฝน % */}
                <span className="text-[9px] font-bold leading-none -mt-0.5"
                  style={{ color: h.isCurrent ? (hasRain ? '#bae6fd' : 'rgba(255,255,255,0.4)') : (hasRain ? '#2563eb' : '#94a3b8') }}>
                  {prob > 0 ? `${prob}%` : '0%'}
                </span>
                {/* เส้นคั่น */}
                <div className="w-full h-px my-0.5" style={{ background: h.isCurrent ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }} />
                {/* อุณหภูมิ */}
                <span className="text-[17px] font-black leading-none text-white">
                  {h.temperature}°
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Clothing recommendation ── */
function getClothingAdvice(temp) {
  const t = parseFloat(temp);
  if (t >= 38) return { icon: '🩱', outfit: 'เสื้อผ้าบางมาก สีอ่อน', tip: 'สวมหมวก + ครีมกันแดด หลีกเลี่ยงออกแดด' };
  if (t >= 35) return { icon: '👚', outfit: 'เสื้อแขนสั้นบาง สีอ่อน', tip: 'สวมหมวกและแว่นกันแดด' };
  if (t >= 32) return { icon: '👕', outfit: 'เสื้อแขนสั้น ระบายอากาศดี', tip: 'หลีกเลี่ยงเสื้อสีเข้ม' };
  if (t >= 28) return { icon: '👕🕶️', outfit: 'เสื้อแขนสั้นสบาย', tip: 'อากาศดี เหมาะออกกิจกรรม' };
  if (t >= 24) return { icon: '🧥', outfit: 'เสื้อแขนสั้น หรือแขนยาวเบา', tip: 'อากาศเย็นสบาย' };
  if (t >= 20) return { icon: '🥼🧦', outfit: 'เสื้อแขนยาว หรือแจ็กเก็ตบาง', tip: 'เตรียมเสื้อกันหนาวบางไว้' };
  return          { icon: '🧥🧣', outfit: 'เสื้อกันหนาว + แจ็กเก็ต', tip: 'อากาศหนาว ใส่เสื้อหนาหลายชั้น' };
}

/* ── Weather activity assessment (กลางวันอิง temp+UV, กลางคืนอิง temp) ── */
function getWeatherAlert(temp, humidity, uv, pm25, hour) {
  const t      = parseFloat(temp);
  const u      = parseFloat(uv ?? 0);
  const isDay  = hour >= 6 && hour < 18;

  if (isDay) {
    if (t >= 40 || u >= 11)
      return { title: 'อันตรายมาก', desc: 'ห้ามออกแดด เสี่ยงโรคลมแดด',       color: '#ef4444' };
    if (t >= 37 || u >= 8)
      return { title: 'ร้อนจัด',    desc: 'จำกัดเวลากลางแจ้ง ดื่มน้ำมากๆ',  color: '#f97316' };
    if (t >= 34 || u >= 6)
      return { title: 'ร้อน',       desc: 'ทาครีมกันแดด สวมหมวก',            color: '#eab308' };
    if (t >= 30 || u >= 3)
      return { title: 'อุ่น',       desc: 'ดื่มน้ำสม่ำเสมอ',                 color: '#84cc16' };
    if (t >= 25)
      return { title: 'สบาย',       desc: 'เหมาะสำหรับกิจกรรมกลางแจ้ง',     color: '#22c55e' };
    return   { title: 'เย็นสบาย',  desc: 'อากาศดี เหมาะออกกำลังกาย',        color: '#10b981' };
  }

  // กลางคืน — UV ไม่มีผล อิงอุณหภูมิอย่างเดียว
  if (t >= 32)
    return { title: 'คืนร้อนอบอ้าว', desc: 'เปิดแอร์/พัดลม นอนหลับยาก',    color: '#f97316' };
  if (t >= 28)
    return { title: 'คืนร้อน',        desc: 'อากาศอุ่น ดื่มน้ำก่อนนอน',     color: '#eab308' };
  if (t >= 24)
    return { title: 'คืนอุ่น',        desc: 'อากาศพอดี นอนหลับสบาย',        color: '#22c55e' };
  if (t >= 20)
    return { title: 'คืนเย็น',        desc: 'อากาศเย็นสบาย เหมาะพักผ่อน',   color: '#10b981' };
  return     { title: 'คืนหนาว',      desc: 'อากาศเย็น ห่มผ้าเพิ่ม',         color: '#06b6d4' };
}

/* ── Cloud SVG shape ── */
function CloudShape({ width, color, opacity, top, left, dur, del }) {
  const h = Math.round(width * 0.45);
  return (
    <div className="cloud-float absolute" style={{ top, left, opacity, color, animationDuration: `${dur}s`, animationDelay: `${del}s` }}>
      <svg width={width} height={h} viewBox="0 0 160 70" fill="none">
        <ellipse cx="80"  cy="58" rx="72" ry="16" fill="currentColor" />
        <ellipse cx="52"  cy="47" rx="36" ry="24" fill="currentColor" />
        <ellipse cx="90"  cy="38" rx="34" ry="28" fill="currentColor" />
        <ellipse cx="118" cy="51" rx="27" ry="20" fill="currentColor" />
      </svg>
    </div>
  );
}

const SKY_CLOUDS = {
  sunny:       [
    { width: 130, color: 'white',   opacity: 0.72, top:  28, left: '7%',  dur:  9, del: 0 },
    { width:  90, color: 'white',   opacity: 0.52, top:  58, left: '57%', dur: 12, del: 4 },
  ],
  hot:         [
    { width: 110, color: 'white',   opacity: 0.58, top:  22, left: '9%',  dur: 11, del: 1 },
    { width:  75, color: 'white',   opacity: 0.38, top:  62, left: '60%', dur: 14, del: 6 },
  ],
  cloudy:      [
    { width: 190, color: '#cbd5e1', opacity: 0.88, top:   8, left: '1%',  dur: 10, del: 0 },
    { width: 155, color: '#e2e8f0', opacity: 0.82, top:  48, left: '40%', dur: 13, del: 3 },
    { width: 125, color: '#cbd5e1', opacity: 0.78, top:  22, left: '67%', dur: 11, del: 7 },
  ],
  rainy:       [
    { width: 210, color: '#475569', opacity: 0.92, top:   3, left: '-2%', dur: 14, del: 0 },
    { width: 165, color: '#334155', opacity: 0.88, top:  42, left: '37%', dur: 12, del: 4 },
    { width: 135, color: '#475569', opacity: 0.82, top:  18, left: '64%', dur: 10, del: 8 },
  ],
  dawn:        [
    { width: 145, color: '#fde68a', opacity: 0.55, top:  32, left: '4%',  dur: 10, del: 0 },
    { width: 105, color: '#fdba74', opacity: 0.45, top:  62, left: '54%', dur: 13, del: 5 },
  ],
  dusk:        [
    { width: 155, color: '#fca5a5', opacity: 0.52, top:  22, left: '2%',  dur: 11, del: 0 },
    { width: 115, color: '#fdba74', opacity: 0.48, top:  58, left: '48%', dur: 14, del: 4 },
    { width:  85, color: '#f9a8d4', opacity: 0.42, top:  38, left: '72%', dur: 12, del: 8 },
  ],
  'night-rain': [
    { width: 210, color: '#1e293b', opacity: 0.95, top:   0, left: '-3%', dur: 18, del: 0 },
    { width: 165, color: '#0f172a', opacity: 0.90, top:  32, left: '38%', dur: 20, del: 7 },
  ],
};

/* ── Deterministic star positions for night sky ── */
const STARS = Array.from({ length: 32 }, (_, i) => ({
  top:  `${(i * 71 + 13) % 62}%`,
  left: `${(i * 37 + 11) % 100}%`,
  w:    ((i * 13 + 5) % 2) + 1.2,
  op:   ((i *  7 + 2) % 5) * 0.1 + 0.25,
  dur:  ((i * 11 + 4) % 3) + 2,
}));

function getSkyStyle(hour, temp, precipProb, humidity) {
  const h  = hour      ?? 12;
  const pp = precipProb ?? 0;
  const hu = humidity   ?? 50;
  const t  = temp       ?? 30;
  const isNight  = h >= 20 || h < 5;
  const isDusk   = h >= 18 && h < 20;
  const isDawn   = h >= 5  && h < 7;
  const isRainy  = pp >= 65;
  const isCloudy = pp >= 40;
  const isHot    = t  >= 35;
  if (isNight)  return { gradient: isRainy
    ? 'linear-gradient(180deg,#0c1120 0%,#162032 55%,#1e2d42 100%)'
    : 'linear-gradient(180deg,#020617 0%,#0b1829 40%,#0f2242 72%,#1a3458 100%)',
    type: isRainy ? 'night-rain' : 'night', dark: true };
  if (isDusk)   return { gradient: 'linear-gradient(180deg,#1a2744 0%,#5b21b6 22%,#be185d 44%,#ea580c 65%,#f59e0b 82%,#fde68a 100%)', type: 'dusk',   dark: true  };
  if (isDawn)   return { gradient: 'linear-gradient(180deg,#0f1f3d 0%,#6d28d9 28%,#db2777 52%,#f97316 72%,#fbbf24 100%)',             type: 'dawn',   dark: true  };
  if (isRainy)  return { gradient: 'linear-gradient(180deg,#0f1923 0%,#1c2b3a 32%,#2d3f50 62%,#3d5268 100%)',                        type: 'rainy',  dark: true  };
  if (isCloudy) return { gradient: 'linear-gradient(180deg,#334155 0%,#475569 35%,#64748b 65%,#94a3b8 100%)',                        type: 'cloudy', dark: true  };
  if (isHot)    return { gradient: 'linear-gradient(180deg,#1e40af 0%,#2563eb 28%,#60a5fa 58%,#bae6fd 80%,#fef3c7 100%)',            type: 'hot',    dark: false };
  return               { gradient: 'linear-gradient(180deg,#1e3a8a 0%,#1d4ed8 25%,#3b82f6 55%,#7dd3fc 80%,#dbeafe 100%)',            type: 'sunny',  dark: false };
}

function SkyDecorations({ type }) {
  const isNight = type === 'night' || type === 'night-rain';
  return (
    <div className="sticky top-0 z-0 pointer-events-none" style={{ height: 0 }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: 260 }}>
        {/* Stars */}
        {isNight && STARS.slice(0, type === 'night' ? 32 : 10).map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ top: s.top, left: s.left, width: s.w, height: s.w, opacity: s.op,
              animation: `livePulse ${s.dur}s ease-in-out infinite` }} />
        ))}
        {/* Moon */}
        {type === 'night' && (
          <div className="absolute" style={{ top: 18, right: 60 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%,#fef9c3,#fde68a 60%,#ca8a04)',
              boxShadow: '0 0 40px rgba(253,230,138,0.35),0 0 80px rgba(253,230,138,0.15)' }} />
          </div>
        )}
        {/* Sun */}
        {(type === 'sunny' || type === 'hot') && (
          <div className="absolute" style={{ top: -20, right: 50 }}>
            <div style={{ width: 130, height: 130, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(253,246,178,0.95) 0%,rgba(251,191,36,0.5) 45%,transparent 70%)',
              filter: 'blur(8px)' }} />
          </div>
        )}
        {/* Dawn/dusk horizon glow */}
        {(type === 'dawn' || type === 'dusk') && (
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: 100, background: type === 'dusk'
              ? 'linear-gradient(0deg,rgba(234,88,12,0.4) 0%,transparent 100%)'
              : 'linear-gradient(0deg,rgba(249,115,22,0.38) 0%,transparent 100%)' }} />
        )}
        {/* Clouds */}
        {(SKY_CLOUDS[type] ?? []).map((c, i) => <CloudShape key={i} {...c} />)}

        {/* Rain streaks */}
        {(type === 'rainy' || type === 'night-rain') && [...Array(14)].map((_, i) => (
          <div key={i} className="rain-drop absolute rounded-full"
            style={{ background: type === 'night-rain' ? 'rgba(148,163,184,0.22)' : 'rgba(186,230,253,0.28)',
              width: 1.5, height: 10, left: `${(i * 7.14 + 3) % 100}%`, top: -10,
              animationDuration: `${0.7 + (i % 3) * 0.25}s`,
              animationDelay:    `${(i % 5) * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════ */
export default function HomeView({ tambons, forecast, weatherStatus, lastUpdated, tmdTempMax, tmdTempMin, tmdData, onTambonClick, needsNotifyBanner = false, onEnableNotify }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const dateStr = `วัน${DAY_TH[now.getDay()]} ${now.getDate()} ${MONTH_TH[now.getMonth()]} ${now.getFullYear() + 543}`;
  const geo     = useGeolocationName();

  if (!tambons || tambons.length === 0) {
    return (
      <div className="absolute top-0 right-0 flex items-center justify-center"
        style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(160deg,#cffafe,#e0e7ff,#fce7f3)' }}>
        <div className="text-indigo-400 text-sm animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  /* ── Derived data (fallback from tambons) ── */
  const temps  = tambons.map(d => d.temperature);
  const pm25s  = tambons.map(d => d.pm25);
  const humids = tambons.map(d => d.humidity ?? 0);
  const winds  = tambons.map(d => d.windSpeed ?? 0);

  const avgTemp     = Math.round(temps.reduce((s,v)=>s+v,0) / temps.length);
  const minTemp     = Math.min(...temps);
  const maxTemp     = Math.max(...temps);
  const avgPM25     = (pm25s.reduce((s,v)=>s+v,0) / pm25s.length).toFixed(1);
  const avgHumidity = Math.round(humids.reduce((s,v)=>s+v,0) / humids.length);
  const avgWind     = (winds.reduce((s,v)=>s+v,0) / winds.length).toFixed(1);
  const pm25Level   = getPM25Level(parseFloat(avgPM25));

  /* ── TMD station 48381 overrides (use when available) ── */
  const displayTemp     = tmdData?.temperature != null ? Math.round(tmdData.temperature) : avgTemp;
  const displayHumidity = tmdData?.humidity     != null ? Math.round(tmdData.humidity) : avgHumidity;
  const displayWind     = tmdData?.windSpeed    != null ? tmdData.windSpeed.toFixed(1)  : avgWind;
  const displayRainfall = tmdData?.rainfall     != null ? tmdData.rainfall : null;
  const hasTMDLive      = tmdData != null;
  const pm25Color   = getPM25Color(parseFloat(avgPM25));

  const displayMin    = tmdTempMin ?? minTemp;
  const displayMax    = tmdTempMax ?? maxTemp;
  const hasTMD      = tmdTempMax != null && tmdTempMin != null;
  const tempPct     = Math.max(0, Math.min(100, ((parseFloat(displayTemp) - displayMin) / (displayMax - displayMin || 1)) * 100));
  const currentUV   = forecast?.[0]?.uvIndex ?? null;
  const uvLevel     = currentUV !== null ? getUVLevel(currentUV) : null;
  const weatherAlert   = getWeatherAlert(displayTemp, displayHumidity, currentUV, avgPM25, now.getHours());
  const clothingAdvice = getClothingAdvice(displayTemp);
  const skyStyle       = getSkyStyle(now.getHours(), parseFloat(displayTemp), forecast?.[0]?.precipProbability ?? 0, displayHumidity);

  /* Live dot */
  const dotCfg = {
    loading:    { cls: 'bg-violet-400 animate-pulse', label: 'กำลังโหลด...',  col: '#8b5cf6' },
    refreshing: { cls: 'bg-violet-400 animate-pulse', label: 'กำลังรีเฟรช...', col: '#8b5cf6' },
    ok:         { cls: 'bg-emerald-400 live-dot',     label: 'เรียลไทม์',       col: '#10b981' },
    error:      { cls: 'bg-rose-400',                 label: 'ออฟไลน์',         col: '#f43f5e' },
  }[weatherStatus] ?? { cls: 'bg-slate-400', label: '—', col: '#94a3b8' };

  return (
    <div className="absolute right-0 overflow-y-auto overflow-x-hidden"
      style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: skyStyle.gradient, transition: 'background 1.5s ease' }}>

      <SkyDecorations type={skyStyle.type} />

      <div className="relative z-10 max-w-md md:max-w-xl lg:max-w-5xl mx-auto px-4 md:px-5 lg:px-8 pt-5 pb-8 space-y-4">

        {/* ── Notification permission banner ── */}
        {needsNotifyBanner && (
          <button
            onClick={onEnableNotify}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">เปิดรับการแจ้งเตือนสภาพอากาศ</p>
              <p className="text-indigo-200 text-xs mt-0.5">แตะเพื่อรับแจ้งเตือนเมื่อสภาพอากาศเปลี่ยนแปลง</p>
            </div>
            <span className="text-white text-lg">›</span>
          </button>
        )}

        {/* ══ HEADER ══ */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Location pin chip */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}>
                <FaMapMarkerAlt size={10} color="white" />
                {geo.state === 'requesting' ? (
                  <span className="text-white text-xs font-semibold animate-pulse">กำลังระบุ...</span>
                ) : geo.state === 'ok' ? (
                  <span className="text-white text-xs font-semibold">{geo.name}</span>
                ) : geo.state === 'denied' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-semibold">อ.เมืองขอนแก่น</span>
                    <button onClick={geo.retry} title="ขอตำแหน่ง"
                      className="flex items-center gap-0.5 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-1.5 py-0.5">
                      <FaCrosshairs size={8} color="white" />
                    </button>
                  </div>
                ) : (
                  <span className="text-white text-xs font-semibold">อ.เมืองขอนแก่น</span>
                )}
              </div>
            </div>
            <p className={`text-xs pl-0.5 ${skyStyle.dark ? 'text-white/55' : 'text-slate-500'}`}>{dateStr}</p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${dotCfg.col}30`, backdropFilter: 'blur(8px)' }}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCfg.cls}`} />
            <span className="text-[11px] font-semibold" style={{ color: dotCfg.col }}>{dotCfg.label}</span>
            {lastUpdated && weatherStatus === 'ok' && (
              <span className="text-[10px] text-slate-400">
                · {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* ══ TWO-COLUMN ══ */}
        <div className="lg:flex lg:gap-5 lg:items-start">

          {/* ── Left column ── */}
          <div className="lg:flex-1 min-w-0 space-y-3">

            {/* Hero temperature card */}
            <div className="rounded-3xl p-5 relative overflow-hidden" style={{
              background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(147,197,253,0.5)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)',
            }}>
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40"
                style={{ background: 'radial-gradient(circle,#93c5fd,transparent)' }} />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-25"
                style={{ background: 'radial-gradient(circle,#a5f3fc,transparent)' }} />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium tracking-wide mb-1">
                    {hasTMDLive ? 'สถานีขอนแก่น (กรมอุตุฯ)' : 'อุณหภูมิปัจจุบัน'}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-6xl md:text-7xl font-black text-white leading-none">{displayTemp}</span>
                    <span className="text-2xl font-bold text-white/80 mb-2">°C</span>
                  </div>
                  {/* Weather alert — inline, no box */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-xs font-black leading-none text-white">{weatherAlert.title}</span>
                    <span className="text-[11px] text-white/60 leading-none">· {weatherAlert.desc}</span>
                    {parseFloat(displayTemp) >= 35 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>ร้อนจัด</span>}
                    {parseFloat(displayHumidity) >= 85 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>ชื้นมาก</span>}
                    {parseFloat(avgPM25) >= 50 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>ฝุ่นสูง</span>}
                    {currentUV >= 6 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>UV สูง</span>}
                  </div>
                  <p className="text-white/50 text-[10px] mt-1.5">
                    {hasTMDLive ? `อัปเดต ${tmdData.observedAt ?? ''}` : `${tambons.length} ตำบล · ขอนแก่น`}
                  </p>
                </div>
                <SunCloud />
              </div>

              {/* Max / Min row */}
              <div className="relative flex items-center gap-3 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/80 text-xs font-black">↑</span>
                  <div>
                    <p className="text-white/50 text-[9px] leading-none">สูงสุด</p>
                    <p className="text-white text-lg font-black leading-tight">
                      {displayMax != null ? displayMax : '--'}°<span className="text-xs">C</span>
                    </p>
                  </div>
                </div>
                <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="flex items-center gap-1.5">
                  <span className="text-white/80 text-xs font-black">↓</span>
                  <div>
                    <p className="text-white/50 text-[9px] leading-none">ต่ำสุด</p>
                    <p className="text-white text-lg font-black leading-tight">
                      {displayMin != null ? displayMin : '--'}°<span className="text-xs">C</span>
                    </p>
                  </div>
                </div>
                <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-lg leading-none flex-shrink-0">{clothingAdvice.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white/50 text-[9px] leading-none">แนะนำ</p>
                    <p className="text-white text-xs font-bold leading-tight truncate">{clothingAdvice.outfit}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Hourly forecast ── */}
            <ForecastStrip forecast={forecast} tmdData={tmdData} />

            {/* ── 6 stat cards ── */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  icon: <FaThermometerHalf color="white" size={13} />,
                  iconBg: 'linear-gradient(135deg,#ef4444,#f97316)',
                  label: 'อุณหภูมิอากาศ',
                  value: displayTemp,
                  unit: '°C',
                },
                {
                  icon: <FaCloudRain color="white" size={13} />,
                  iconBg: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  label: 'ปริมาณฝนสะสม',
                  value: displayRainfall != null ? displayRainfall : '--',
                  unit: 'mm',
                },
                {
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                  </svg>,
                  iconBg: 'linear-gradient(135deg,#10b981,#059669)',
                  label: 'ความเร็วลม',
                  value: displayWind,
                  unit: 'km/h',
                },
                {
                  icon: <FaTint color="white" size={13} />,
                  iconBg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                  label: 'ความชื้นสัมพัทธ์',
                  value: displayHumidity,
                  unit: '%',
                  extra: <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${displayHumidity}%`, background: 'linear-gradient(90deg,#22d3ee,#6366f1)' }} />
                  </div>,
                },
                {
                  icon: <FaSun color="white" size={13} />,
                  iconBg: uvLevel ? `linear-gradient(135deg,${uvLevel.color}cc,${uvLevel.color})` : 'linear-gradient(135deg,#eab308,#ca8a04)',
                  label: 'UV Index',
                  value: currentUV ?? '--',
                  unit: uvLevel?.label ?? '',
                },
                {
                  icon: <FaWind color="white" size={13} />,
                  iconBg: 'linear-gradient(135deg,#f97316,#fb923c)',
                  label: 'ฝุ่น PM2.5',
                  value: avgPM25,
                  unit: 'µg/m³',
                  extra: <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${pm25Color}20`, color: pm25Color, border: `1px solid ${pm25Color}40` }}>
                    {pm25Level.label}
                  </span>,
                },
              ].map(({ icon, iconBg, label, value, unit, extra }) => (
                <div key={label} className="rounded-2xl p-3 flex flex-col items-center gap-1.5" style={{
                  background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(147,197,253,0.5)',
                  boxShadow: '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg, boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                    {icon}
                  </div>
                  <p className="text-[10px] text-white/70 font-medium leading-none text-center">{label}</p>
                  <p className="text-xl font-black text-white leading-none">{value}</p>
                  <p className="text-[9px] text-white/60 leading-none">{unit}</p>
                  {extra}
                </div>
              ))}
            </div>

            {/* ── Radar ── */}
            <div className="rounded-3xl overflow-hidden" style={{
              background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(147,197,253,0.5)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: '#3b82f6' }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                      style={{ background: '#2563eb' }} />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold tracking-wide text-white leading-none">เรดาร์ฝนขอนแก่น</p>
                    <p className="text-[9px] text-white/60 mt-0.5 leading-none">Khon Kaen Doppler Radar · TMD</p>
                  </div>
                </div>
                <a href="https://weather.tmd.go.th/kkn240_HQ_Loop_edit2.php"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.5)', color: 'white' }}>
                  เต็มจอ
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
              <div className="px-4 pb-5">
                <div className="rounded-2xl overflow-hidden" style={{
                  boxShadow: '0 0 0 1px rgba(147,197,253,0.4), 0 4px 16px rgba(0,0,0,0.1)',
                }}>
                  <RadarFrame />
                </div>
              </div>
            </div>


          </div>

          {/* ── Right column: tambon list ── */}
          <div className="mt-3 lg:mt-0 lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-0">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#6366f1,transparent)' }} />
              <p className="text-[10px] font-extrabold uppercase tracking-widest px-1"
                style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {tambons.length} ตำบล
              </p>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,#8b5cf6)' }} />
            </div>

            <div className="space-y-1.5 lg:max-h-[calc(100dvh-180px)] lg:overflow-y-auto lg:pr-1">
              {[...tambons].sort((a,b) => b.temperature - a.temperature).map((d, idx) => {
                const tc = getTemperatureColor(d.temperature);
                const pc = getPM25Color(d.pm25);
                return (
                  <div key={d.id}
                    className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5 transition-transform hover:scale-[1.01] cursor-pointer active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(191,219,254,0.65) 55%,rgba(186,230,253,0.65) 100%)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(147,197,253,0.5)',
                      boxShadow: idx === 0 ? '0 8px 32px rgba(59,130,246,0.12), 0 2px 8px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onClick={() => onTambonClick?.(d)}>
                    {/* Temp badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${tc}22,${tc}44)`, border: `1.5px solid ${tc}50` }}>
                      <span className="text-xs font-black" style={{ color: tc }}>{d.temperature}°</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">ต.{d.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-white/70 flex items-center gap-0.5">
                          <FaTint size={7} className="text-cyan-300" />{d.humidity}%
                        </span>
                        <span className="text-[9px] text-white/40">·</span>
                        <span className="text-[9px] font-semibold" style={{ color: pc }}>PM{d.pm25}µg</span>
                        <span className="text-[9px] text-white/40">·</span>
                        <span className="text-[9px] text-white/70">{d.windSpeed}km</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>



      </div>
    </div>
  );
}
