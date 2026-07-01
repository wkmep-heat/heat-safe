import { FaWater, FaCalendarAlt } from 'react-icons/fa';

const FLOOD_HISTORY = [
  { area: 'ต.ในเมือง',  date: 'ก.ย. 2566', level: 55, duration: 4, severity: 'สูงมาก' },
  { area: 'ต.บ้านทุ่ม', date: 'ต.ค. 2566', level: 42, duration: 3, severity: 'สูง' },
  { area: 'ต.พระลับ',   date: 'ส.ค. 2565', level: 38, duration: 2, severity: 'ปานกลาง' },
  { area: 'ต.ท่าพระ',   date: 'ต.ค. 2564', level: 71, duration: 5, severity: 'สูงมาก' },
  { area: 'ต.ดอนช้าง',  date: 'ก.ย. 2563', level: 29, duration: 2, severity: 'ต่ำ' },
];

const RECURRING_AREAS = [
  { name: 'ต.ในเมือง',  desc: 'บริเวณตลาดกลางเมือง',  count: 4, years: '2562, 2563, 2565, 2566' },
  { name: 'ต.บ้านทุ่ม', desc: 'พื้นที่ลุ่มต่ำ',        count: 3, years: '2562, 2564, 2566' },
  { name: 'ต.ท่าพระ',   desc: 'ริมแม่น้ำพอง',          count: 3, years: '2563, 2565, 2566' },
  { name: 'ต.ดอนหัน',   desc: 'พื้นที่ราบ',            count: 2, years: '2564, 2566' },
  { name: 'ต.เมืองเก่า', desc: 'ย่านชุมชนเก่า',        count: 2, years: '2563, 2565' },
];

const severityColor = {
  'สูงมาก': '#ef4444',
  'สูง':     '#f97316',
  'ปานกลาง': '#f59e0b',
  'ต่ำ':     '#3b82f6',
};

export default function RecurringView() {
  return (
    <div
      className="absolute right-0 overflow-y-auto"
      style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(180deg,#eff6ff 0%,#f8faff 100%)' }}
    >
      <div className="max-w-md md:max-w-2xl mx-auto px-4 md:px-8 pt-5 pb-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)' }}>
            <FaWater className="text-blue-600" size={16} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">พื้นที่น้ำท่วมซ้ำ</h2>
            <p className="text-xs text-slate-400">อ.เมืองขอนแก่น · ข้อมูล 5 ปีย้อนหลัง</p>
          </div>
        </div>

        {/* Recurring areas */}
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
            พื้นที่ท่วมซ้ำบ่อย
          </p>
          <div className="space-y-2">
            {RECURRING_AREAS.map((area, i) => (
              <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #e0eaff' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{area.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{area.desc}</p>
                  </div>
                  <span
                    className="text-sm font-black px-3 py-1 rounded-2xl flex-shrink-0"
                    style={{
                      background: area.count >= 4 ? '#fef2f2' : area.count >= 3 ? '#fff7ed' : '#eff6ff',
                      color: area.count >= 4 ? '#ef4444' : area.count >= 3 ? '#f97316' : '#3b82f6',
                    }}
                  >
                    {area.count} ครั้ง
                  </span>
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: '#f0f7ff' }}>
                  <div className="flex items-center gap-1.5">
                    <FaCalendarAlt size={9} className="text-blue-400 flex-shrink-0" />
                    <p className="text-[10px] text-blue-600">{area.years}</p>
                  </div>
                </div>
                {/* Frequency bar */}
                <div className="mt-2 h-1.5 rounded-full bg-blue-50 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(area.count / 4) * 100}%`,
                      background: 'linear-gradient(90deg,#93c5fd,#3b82f6)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical events */}
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
            ประวัติเหตุการณ์น้ำท่วม
          </p>
          <div className="space-y-2">
            {FLOOD_HISTORY.map((event, i) => {
              const sColor = severityColor[event.severity] ?? '#64748b';
              return (
                <div key={i} className="rounded-2xl px-4 py-3 bg-white flex items-center gap-3"
                  style={{ border: '1px solid #e0eaff' }}>
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: sColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{event.area}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{event.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-blue-700">{event.level} ซม.</p>
                    <p className="text-[10px] text-slate-400">{event.duration} วัน</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${sColor}15`, color: sColor }}>
                    {event.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-xs text-indigo-500">ข้อมูลจำลองเพื่อการพัฒนา · อยู่ระหว่างพัฒนาระบบจริง</p>
        </div>

      </div>
    </div>
  );
}
