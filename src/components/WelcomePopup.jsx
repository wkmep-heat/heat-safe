import { useState, useEffect } from 'react';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'อรุณสวัสดิ์',      emoji: '🌅' };
  if (h >= 12 && h < 17) return { text: 'สวัสดีตอนบ่าย',   emoji: '☀️' };
  if (h >= 17 && h < 20) return { text: 'สวัสดีตอนเย็น',   emoji: '🌇' };
  return                         { text: 'สวัสดีตอนกลางคืน', emoji: '🌙' };
}

function getWeatherSummary(tmdData, tambons, forecast) {
  const temp = tmdData?.temperature ?? (tambons?.length
    ? Math.round(tambons.reduce((s, d) => s + d.temperature, 0) / tambons.length)
    : null);
  const humidity  = tmdData?.humidity  != null ? Math.round(tmdData.humidity) : null;
  const uv        = forecast?.[0]?.uvIndex ?? null;
  const prob      = forecast?.[0]?.precipProbability ?? 0;

  const condition = prob >= 65 ? '🌧️ มีฝนตก'
                  : prob >= 40 ? '🌦️ อาจมีฝน'
                  : uv >= 8   ? '☀️ แดดจัด'
                  : uv >= 6   ? '🌤️ แดดแรง'
                  : '😊 อากาศดี';

  const message = prob >= 65
    ? 'วันนี้มีฝนตก อย่าลืมพกร่มออกไปด้วยนะ ☂️'
    : prob >= 40
    ? 'อาจมีฝนระหว่างวัน เตรียมร่มไว้ด้วยก็ดีนะ 🌂'
    : temp != null && temp >= 38
    ? 'อากาศร้อนมากวันนี้ ดื่มน้ำบ่อยๆ และหลีกเลี่ยงออกแดดช่วงกลางวันนะ 🥵'
    : temp != null && temp >= 35
    ? 'อากาศร้อนจัด ถ้าต้องออกไปข้างนอกอย่าลืมครีมกันแดดด้วยนะ ☀️'
    : uv >= 8
    ? 'แดดแรงมากวันนี้ ใส่หมวกและครีมกันแดดก่อนออกจากบ้านนะ 🧴'
    : temp != null && temp <= 24
    ? 'อากาศเย็นสบาย เหมาะกับการออกไปทำกิจกรรมข้างนอกมากเลย 🌿'
    : 'วันนี้อากาศดี เหมาะกับการออกไปทำกิจกรรมข้างนอกนะ 😊';

  return { temp, humidity, uv, prob, condition, message };
}

export default function WelcomePopup({ tmdData, tambons, forecast }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const key = `welcome_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    // Delay slightly so the app loads first
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => close(), 6000);
    return () => clearTimeout(t);
  }, [visible]);

  function close() {
    setClosing(true);
    setTimeout(() => setVisible(false), 350);
  }

  if (!visible) return null;

  const greeting = getGreeting();
  const { temp, humidity, uv, prob, condition, message } = getWeatherSummary(tmdData, tambons, forecast);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4 pointer-events-none"
    >
      <div
        onClick={close}
        className="pointer-events-auto w-full max-w-sm rounded-3xl p-5 cursor-pointer"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          transform: closing ? 'translateY(120%) scale(0.95)' : 'translateY(0) scale(1)',
          opacity: closing ? 0 : 1,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
          animation: closing ? 'none' : 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(80px) scale(0.95); opacity: 0; }
            to   { transform: translateY(0)    scale(1);    opacity: 1; }
          }
        `}</style>

        {/* Greeting */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl leading-none">{greeting.emoji}</span>
          <div>
            <p className="text-slate-800 font-black text-lg leading-none">{greeting.text}</p>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-none">ขอนแก่น · วันนี้</p>
          </div>
        </div>

        {/* Contextual message */}
        <p className="text-slate-700 text-[14px] font-medium leading-relaxed text-center mt-1">{message}</p>

        {/* Tap to dismiss */}
        <p className="text-slate-300 text-[10px] text-center mt-3 leading-none">แตะเพื่อปิด</p>
      </div>
    </div>
  );
}
