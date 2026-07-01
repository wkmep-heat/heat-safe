import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_INFO = {
  new:      { label: 'รอดำเนินการ', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '⏳' },
  read:     { label: 'รับทราบแล้ว', color: '#f97316', bg: 'rgba(251,146,60,0.1)',  icon: '👁️' },
  resolved: { label: 'ดำเนินการแล้ว', color: '#059669', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

export default function TrackView() {
  const params = new URLSearchParams(window.location.search);
  const initId = params.get('id') ?? '';

  const [inputId, setInputId]   = useState(initId);
  const [report,  setReport]    = useState(null);
  const [status,  setStatus]    = useState('idle'); // idle | loading | found | notfound | error
  const [copied,  setCopied]    = useState(false);

  /* ถ้ามี id ใน URL ให้โหลดทันที */
  useEffect(() => {
    if (initId) search(initId);
  }, []); // eslint-disable-line

  function search(id = inputId) {
    const clean = id.trim();
    if (!clean) return;
    setStatus('loading');
    setReport(null);

    const unsub = onSnapshot(
      doc(db, 'reports', clean),
      (snap) => {
        if (snap.exists()) {
          setReport({ id: snap.id, ...snap.data() });
          setStatus('found');
        } else {
          setStatus('notfound');
        }
      },
      () => setStatus('error'),
    );
    return unsub;
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(report?.id ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const st = report ? (STATUS_INFO[report.status] ?? STATUS_INFO.new) : null;

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', background: 'linear-gradient(160deg,#eff6ff 0%,#f0f9ff 50%,#f8faff 100%)' }}>
      <div className="max-w-md mx-auto px-4 pt-8 pb-12 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/?report"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #e0eaff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </a>
          <div>
            <p className="font-black text-slate-800 text-lg leading-tight">ติดตามสถานะ</p>
            <p className="text-xs text-slate-400">ระบบติดตามสภาพแวดล้อม จ.ขอนแก่น</p>
          </div>
        </div>

        {/* Search box */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">รหัสติดตาม</p>
          <div className="flex gap-2">
            <input
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="วางรหัสที่ได้รับหลังแจ้งเหตุ"
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-mono outline-none"
              style={{ background: 'white', border: '1.5px solid #bfdbfe', color: '#1e293b' }}
            />
            <button
              onClick={() => search()}
              disabled={!inputId.trim() || status === 'loading'}
              className="px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{
                background: inputId.trim() ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(148,163,184,0.3)',
                color: inputId.trim() ? 'white' : '#94a3b8',
                boxShadow: inputId.trim() ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
              }}>
              {status === 'loading' ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : 'ค้นหา'}
            </button>
          </div>
        </div>

        {/* Not found */}
        {status === 'notfound' && (
          <div className="rounded-2xl p-5 text-center space-y-2"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
            <p className="text-2xl">🔍</p>
            <p className="text-sm font-bold text-slate-700">ไม่พบรายการแจ้งเหตุ</p>
            <p className="text-xs text-slate-400">กรุณาตรวจสอบรหัสให้ถูกต้อง</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm font-semibold text-red-500">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
          </div>
        )}

        {/* Result card */}
        {status === 'found' && report && st && (
          <div className="space-y-3">

            {/* Status banner */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: st.bg, border: `1.5px solid ${st.color}40` }}>
              <div className="text-3xl">{st.icon}</div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: st.color }}>สถานะ</p>
                <p className="text-lg font-black" style={{ color: st.color }}>{st.label}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl p-4 space-y-3 bg-white" style={{ border: '1.5px solid #e0eaff' }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ความคืบหน้า</p>

              {[
                { key: 'new',      label: 'ส่งการแจ้งเหตุ',      time: report.createdAt, always: true },
                { key: 'read',     label: 'เจ้าหน้าที่รับทราบ',  time: report.readAt,    always: false },
                { key: 'resolved', label: 'ดำเนินการเสร็จสิ้น',  time: report.resolvedAt, always: false },
              ].map((step, i) => {
                const ORDER = ['new', 'read', 'resolved'];
                const done = ORDER.indexOf(report.status) >= ORDER.indexOf(step.key);
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: done ? (step.key === 'resolved' ? '#059669' : '#3b82f6') : 'rgba(148,163,184,0.2)',
                          border: done ? 'none' : '1.5px dashed #cbd5e1',
                        }}>
                        {done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      {i < 2 && <div className="w-px flex-1 mt-1" style={{ background: done ? '#bfdbfe' : '#e2e8f0', minHeight: '16px' }} />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-semibold" style={{ color: done ? '#1e293b' : '#94a3b8' }}>{step.label}</p>
                      {done && step.time && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(step.time)}</p>
                      )}
                      {!done && <p className="text-[10px] text-slate-300 mt-0.5">รอดำเนินการ</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail */}
            <div className="rounded-2xl p-4 space-y-3 bg-white" style={{ border: '1.5px solid #e0eaff' }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">รายละเอียดที่แจ้ง</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.detail}</p>
              {report.address && (
                <div className="flex items-start gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <p className="text-xs text-slate-500">{report.address}</p>
                </div>
              )}
              {report.image && (
                <img src={report.image} alt="รูปประกอบ"
                  className="w-full rounded-xl object-cover cursor-pointer"
                  style={{ maxHeight: '160px', border: '1px solid #e0eaff' }}
                  onClick={() => window.open(report.image, '_blank')}
                />
              )}
            </div>

            {/* Admin reply */}
            {report.adminReply?.text && (
              <div className="rounded-2xl p-4 space-y-1.5"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.05))', border: '1.5px solid rgba(99,102,241,0.25)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">📩</span>
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wide">ข้อความจากเจ้าหน้าที่</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{report.adminReply.text}</p>
                {report.adminReply.sentAt && (
                  <p className="text-[10px] text-slate-400">{fmtDate(report.adminReply.sentAt)}</p>
                )}
              </div>
            )}

            {/* Tracking code */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="flex-1 font-mono text-xs text-slate-500 truncate">{report.id}</p>
              <button onClick={handleCopy}
                className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
              </button>
            </div>
          </div>
        )}

        {/* Link to report */}
        <div className="pt-2 text-center">
          <a href="/?report" className="text-xs text-blue-400 hover:underline">แจ้งเหตุใหม่ →</a>
        </div>
      </div>
    </div>
  );
}
