import { useState, useCallback, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, addDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import CommunityView from './CommunityView';

const ALERT_COLOR = '#ef4444';
const ALERT_BG    = 'rgba(239,68,68,0.12)';
const ALERT_EMOJI = '🚨';
function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

/* ── PIN pad ─────────────────────────────────────────────────────────────── */
function PinPad({ onSuccess }) {
  const [digits, setDigits] = useState('');
  const [shake,  setShake]  = useState(false);

  const press = useCallback((d) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      if (next === '2569') {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => { setDigits(''); setShake(false); }, 700);
      }
    }
  }, [digits, onSuccess]);

  const del = () => setDigits(d => d.slice(0, -1));

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <p className="text-lg font-black text-slate-800">ระบบแจ้งเตือนฉุกเฉิน</p>
        <p className="text-xs text-slate-400">เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น</p>
      </div>

      <div className={`flex gap-3 transition-all ${shake ? 'animate-bounce' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all duration-150"
            style={{
              background: i < digits.length
                ? shake ? '#ef4444' : '#3b82f6'
                : 'rgba(148,163,184,0.3)',
              transform: i < digits.length ? 'scale(1.2)' : 'scale(1)',
            }} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
          <button
            key={k}
            onClick={() => k === '⌫' ? del() : k !== '' ? press(k) : null}
            disabled={k === ''}
            className="h-14 rounded-2xl text-xl font-bold transition-all duration-100 active:scale-95"
            style={{
              background: k === '' ? 'transparent' : k === '⌫' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.9)',
              color: k === '⌫' ? '#ef4444' : '#1e293b',
              boxShadow: k === '' ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
              border: k === '' ? 'none' : '1px solid rgba(226,232,240,0.8)',
            }}>
            {k}
          </button>
        ))}
      </div>

      {shake && <p className="text-xs text-red-500 font-semibold">รหัสไม่ถูกต้อง</p>}
    </div>
  );
}

/* ── Alert composer ──────────────────────────────────────────────────────── */
const IMGBB_KEY = 'b48174b520f12cf5eb763cff034282cd';

async function uploadImageToImgBB(file) {
  const form = new FormData();
  form.append('image', file);
  const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.success) throw new Error('upload failed');
  return json.data.url;
}

function AlertComposer() {
  const [title,      setTitle]     = useState('');
  const [body,       setBody]      = useState('');
  const [image,      setImage]     = useState(null); // { url, preview }
  const [imgLoading, setImgLoading] = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [result,     setResult]    = useState(null);
  const fileRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    try {
      const url     = await uploadImageToImgBB(file);
      const preview = URL.createObjectURL(file);
      setImage({ url, preview });
    } catch {
      setResult({ ok: false, msg: 'อัปโหลดรูปไม่สำเร็จ' });
    } finally {
      setImgLoading(false);
      e.target.value = '';
    }
  };

  const send = async () => {
    if (!title.trim() || !body.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      // บันทึกลง Firestore เพื่อแสดงในหน้าชุมชน
      await addDoc(collection(db, 'announcements'), {
        title:     title.trim(),
        body:      body.trim(),
        imageUrl:  image?.url ?? null,
        createdAt: serverTimestamp(),
      });

      // ส่ง LINE broadcast + push notification พร้อมกัน
      const [lineRes, pushRes] = await Promise.allSettled([
        fetch('/api/line-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '2569', title, body, imageUrl: image?.url ?? undefined }),
        }).then(r => r.json()),
        fetch('/api/admin-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '2569', title, body }),
        }).then(r => r.json()),
      ]);

      const lineOk = lineRes.status === 'fulfilled' && lineRes.value?.ok;
      const pushOk = pushRes.status === 'fulfilled' && pushRes.value?.ok;
      const parts  = [
        lineOk ? '✓ LINE OA' : '✗ LINE',
        pushOk ? `✓ Push ${pushRes.value?.sent ?? 0} คน` : null,
      ].filter(Boolean);

      setResult({ ok: true, msg: `โพสต์แล้ว · ${parts.join(' · ')}` });
      setTitle(''); setBody('');
      if (image?.preview) URL.revokeObjectURL(image.preview);
      setImage(null);
    } catch {
      setResult({ ok: false, msg: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">หัวข้อการแจ้งเตือน</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">{ALERT_EMOJI}</span>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
            placeholder="เช่น พายุฤดูร้อนกำลังเข้า"
            className="w-full pl-9 pr-3 py-3 rounded-xl text-sm font-medium outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.9)', border: `1.5px solid ${title ? ALERT_COLOR + '50' : 'rgba(226,232,240,0.8)'}`, color: '#1e293b' }}
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">รายละเอียด</p>
        <textarea
          value={body} onChange={e => setBody(e.target.value)} maxLength={200} rows={4}
          placeholder="เช่น มีพายุฤดูร้อนพัดเข้าพื้นที่ขอนแก่น ขอให้ประชาชนระวังอันตราย"
          className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none transition-all"
          style={{ background: 'rgba(255,255,255,0.9)', border: `1.5px solid ${body ? ALERT_COLOR + '50' : 'rgba(226,232,240,0.8)'}`, color: '#1e293b', lineHeight: 1.6 }}
        />
        <p className="text-[10px] text-slate-400 text-right mt-0.5">{body.length}/200</p>
      </div>

      {(title || body) && (
        <div className="rounded-2xl p-3.5 flex gap-3" style={{ background: ALERT_BG, border: `1px solid ${ALERT_COLOR}30` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: ALERT_COLOR + '20' }}>{ALERT_EMOJI}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: ALERT_COLOR }}>{title || '(หัวข้อ)'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{body || '(รายละเอียด)'}</p>
          </div>
        </div>
      )}

      {/* Image for LINE (optional) */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
          รูปภาพสำหรับ LINE <span className="text-slate-300 font-normal normal-case">(ไม่บังคับ)</span>
        </p>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        {!image ? (
          <button onClick={() => fileRef.current?.click()} disabled={imgLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm transition-all"
            style={{ borderColor: '#e0eaff', color: '#94a3b8', background: 'rgba(255,255,255,0.5)' }}>
            {imgLoading
              ? <><div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />กำลังอัปโหลด...</>
              : <>📎 แนบรูปภาพ</>}
          </button>
        ) : (
          <div className="relative rounded-xl overflow-hidden" style={{ border: '1.5px solid #e0eaff' }}>
            <img src={image.preview} alt="preview" className="w-full object-cover" style={{ maxHeight: '160px' }} />
            <button onClick={() => { URL.revokeObjectURL(image.preview); setImage(null); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold text-center"
          style={{ background: result.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: result.ok ? '#059669' : '#dc2626', border: `1px solid ${result.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {result.ok ? '✓ ' : '✗ '}{result.msg}
        </div>
      )}

      <button
        onClick={send}
        disabled={!title.trim() || !body.trim() || loading}
        className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all active:scale-95"
        style={{
          background: (!title.trim() || !body.trim() || loading) ? 'rgba(148,163,184,0.4)' : `linear-gradient(135deg,${ALERT_COLOR},${ALERT_COLOR}cc)`,
          boxShadow:  (!title.trim() || !body.trim() || loading) ? 'none' : `0 8px 24px ${ALERT_COLOR}40`,
          cursor:     (!title.trim() || !body.trim() || loading) ? 'not-allowed' : 'pointer',
        }}>
        {loading ? '⏳ กำลังส่ง...' : `${ALERT_EMOJI} ส่งการแจ้งเตือนฉุกเฉิน`}
      </button>

      <p className="text-[10px] text-slate-400 text-center">การแจ้งเตือนจะถูกส่งทันทีไปยังทุกคนที่เปิดรับการแจ้งเตือนไว้</p>
    </div>
  );
}

/* ── Reports inbox ───────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  new:      { label: 'ใหม่',       bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  read:     { label: 'รับทราบ',    bg: 'rgba(251,146,60,0.1)',  color: '#f97316' },
  resolved: { label: 'แก้ไขแล้ว', bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
};

const TYPE_STYLES = {
  flood:    { label: 'น้ำท่วม',    icon: '🌊', color: '#3b82f6' },
  accident: { label: 'อุบัติเหตุ', icon: '🚨', color: '#ef4444' },
  complain: { label: 'ร้องเรียน',  icon: '📢', color: '#f97316' },
  rain:     { label: 'ฝนตก',       icon: '🌧️', color: '#0ea5e9' },
  weather:  { label: 'สภาพอากาศ', icon: '⛅', color: '#64748b' },
};

function ReportCard({ r, onSetStatus, onDelete }) {
  const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.new;
  const [replyOpen,    setReplyOpen]    = useState(false);
  const [replyText,    setReplyText]    = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replySent,    setReplySent]    = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [channels, setChannels] = useState({ community: true, line: true, push: false });
  const [broadcasting,  setBroadcasting]  = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const toggleChannel = (key) => setChannels(p => ({ ...p, [key]: !p[key] }));

  const broadcastReport = async () => {
    if (broadcasting || (!channels.community && !channels.line && !channels.push)) return;
    setBroadcasting(true);
    try {
      const title = `รายงานจากพื้นที่ ${r.address?.split(',')[0] ?? 'ขอนแก่น'}`;
      const locationLine = r.lat && r.lng
        ? `📍 ${r.address ?? 'ไม่ระบุ'}\n🗺️ https://www.google.com/maps?q=${r.lat},${r.lng}`
        : `📍 ${r.address ?? 'ไม่ระบุตำแหน่ง'}`;
      const body = `${r.detail}\n\n${locationLine}`;

      await Promise.allSettled([
        channels.community && addDoc(collection(db, 'announcements'), {
          title, body, createdAt: serverTimestamp(),
        }),
        channels.line && fetch('/api/line-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '2569', title, body, imageUrl: r.image ?? undefined }),
        }),
        channels.push && fetch('/api/admin-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '2569', title, body }),
        }),
      ]);

      setBroadcastDone(true);
      setBroadcastOpen(false);
      setTimeout(() => setBroadcastDone(false), 2500);
    } finally {
      setBroadcasting(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || replySending) return;
    setReplySending(true);
    try {
      await updateDoc(doc(db, 'reports', r.id), {
        adminReply: { text: replyText.trim(), sentAt: serverTimestamp() },
      });
      setReplyText('');
      setReplySent(true);
      setTimeout(() => { setReplySent(false); setReplyOpen(false); }, 1500);
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="rounded-2xl p-4 bg-white space-y-2.5"
      style={{ border: `1.5px solid ${r.status === 'new' ? 'rgba(239,68,68,0.25)' : '#e0eaff'}` }}>

      {/* Top row */}
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {r.type && TYPE_STYLES[r.type] && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: TYPE_STYLES[r.type].color + '18',
                  color: TYPE_STYLES[r.type].color,
                  border: `1px solid ${TYPE_STYLES[r.type].color}40`,
                }}>
                {TYPE_STYLES[r.type].icon} {TYPE_STYLES[r.type].label}
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-slate-800 leading-tight truncate">{r.address ?? r.location}</p>
          {r.lat && r.lng && (
            <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-mono text-blue-500 hover:underline">
              {r.lat.toFixed(5)}, {r.lng.toFixed(5)} ↗
            </a>
          )}
          <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(r.createdAt)}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>

      {/* Detail */}
      <div className="space-y-2">
        <p className="text-xs text-slate-600 leading-relaxed">{r.detail}</p>
        {r.image && (
          <img src={r.image} alt="รูปประกอบ"
            className="w-full rounded-xl object-cover cursor-pointer"
            style={{ maxHeight: '180px', border: '1px solid #e0eaff' }}
            onClick={() => window.open(r.image, '_blank')}
          />
        )}
        {(r.name !== 'ไม่ระบุ' || r.phone !== 'ไม่ระบุ') && (
          <p className="text-[11px] text-slate-400">
            {r.name !== 'ไม่ระบุ' ? `👤 ${r.name}` : ''}
            {r.phone !== 'ไม่ระบุ' ? `  📞 ${r.phone}` : ''}
          </p>
        )}
      </div>

      {/* Existing admin reply */}
      {r.adminReply?.text && (
        <div className="rounded-xl px-3 py-2.5 flex gap-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="text-sm flex-shrink-0">📩</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-indigo-500 mb-0.5">ข้อความที่ส่งไปแล้ว</p>
            <p className="text-xs text-slate-600 leading-relaxed">{r.adminReply.text}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{fmtDate(r.adminReply.sentAt)}</p>
          </div>
        </div>
      )}

      {/* Reply composer */}
      {replyOpen && (
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: 'rgba(99,102,241,0.04)', border: '1.5px solid rgba(99,102,241,0.2)' }}>
          <p className="text-[10px] font-bold text-indigo-500">ข้อความถึงผู้แจ้ง</p>
          <textarea
            value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="พิมพ์ข้อความที่ต้องการแจ้งกลับ..."
            rows={3} maxLength={300}
            className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
            style={{ background: 'white', border: '1px solid rgba(99,102,241,0.25)', color: '#1e293b', lineHeight: 1.6 }}
          />
          <div className="flex gap-2">
            <button onClick={() => { setReplyOpen(false); setReplyText(''); }}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex-1"
              style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b' }}>
              ยกเลิก
            </button>
            <button onClick={sendReply} disabled={!replyText.trim() || replySending}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg flex-1 transition-all"
              style={{
                background: replyText.trim() ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(148,163,184,0.3)',
                color: replyText.trim() ? 'white' : '#94a3b8',
              }}>
              {replySent ? '✓ ส่งแล้ว' : replySending ? '...' : '📩 ส่ง'}
            </button>
          </div>
        </div>
      )}

      {/* Broadcast channel selector */}
      {broadcastOpen && (
        <div className="rounded-xl p-3 space-y-2.5"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-wide">เลือกช่องทางแจ้งเตือน</p>
          {[
            { key: 'community', label: 'ฟีดชุมชน',         icon: '🏘️', desc: 'โพสต์ขึ้นหน้าชุมชนในแอป' },
            { key: 'line',      label: 'LINE OA',           icon: '💬', desc: 'Broadcast ไปทุกคนที่ Follow' },
            { key: 'push',      label: 'Push Notification', icon: '🔔', desc: 'แจ้งเตือนในแอปผู้ใช้' },
          ].map(ch => (
            <button key={ch.key} onClick={() => toggleChannel(ch.key)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
              style={{
                background: channels[ch.key] ? 'rgba(239,68,68,0.08)' : 'white',
                border: `1.5px solid ${channels[ch.key] ? 'rgba(239,68,68,0.3)' : '#e0eaff'}`,
              }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: channels[ch.key] ? '#ef4444' : 'rgba(148,163,184,0.2)' }}>
                {channels[ch.key] && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <span className="text-base leading-none">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: channels[ch.key] ? '#dc2626' : '#475569' }}>{ch.label}</p>
                <p className="text-[10px] text-slate-400">{ch.desc}</p>
              </div>
            </button>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setBroadcastOpen(false)}
              className="text-[11px] font-semibold px-3 py-2 rounded-lg flex-1"
              style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b' }}>
              ยกเลิก
            </button>
            <button onClick={broadcastReport}
              disabled={broadcasting || (!channels.community && !channels.line && !channels.push)}
              className="text-[11px] font-black px-3 py-2 rounded-lg flex-1 transition-all"
              style={{
                background: (!channels.community && !channels.line && !channels.push)
                  ? 'rgba(148,163,184,0.3)'
                  : 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: (!channels.community && !channels.line && !channels.push) ? '#94a3b8' : 'white',
                boxShadow: (!channels.community && !channels.line && !channels.push) ? 'none' : '0 4px 12px rgba(239,68,68,0.35)',
              }}>
              {broadcasting ? '⏳ กำลังส่ง...' : '📢 ส่งเลย'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 flex-wrap">
        {r.status !== 'read' && r.status !== 'resolved' && (
          <button onClick={() => onSetStatus(r.id, 'read')}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(251,146,60,0.1)', color: '#f97316', border: '1px solid rgba(251,146,60,0.3)' }}>
            รับทราบ
          </button>
        )}
        {r.status !== 'resolved' && (
          <button onClick={() => onSetStatus(r.id, 'resolved')}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }}>
            แก้ไขแล้ว
          </button>
        )}
        <button onClick={() => setReplyOpen(v => !v)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}>
          📩 {r.adminReply?.text ? 'แก้ข้อความ' : 'ส่งข้อความ'}
        </button>
        <button onClick={() => setBroadcastOpen(v => !v)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: broadcastDone ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', color: broadcastDone ? '#059669' : '#ef4444', border: `1px solid ${broadcastDone ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
          {broadcastDone ? '✓ แจ้งเตือนแล้ว' : '📢 แจ้งเตือนชุมชน'}
        </button>
        <button onClick={() => onDelete(r.id)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ml-auto"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          ลบ
        </button>
      </div>
    </div>
  );
}

function ReportsInbox({ onNewCount }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(data);
      onNewCount?.(data.filter(r => r.status === 'new').length);
    });
    return unsub;
  }, [onNewCount]);

  const setStatus = (id, status) => {
    const extra = status === 'read' ? { readAt: serverTimestamp() }
                : status === 'resolved' ? { resolvedAt: serverTimestamp() } : {};
    updateDoc(doc(db, 'reports', id), { status, ...extra });
  };
  const deleteReport = (id) => deleteDoc(doc(db, 'reports', id));
  const newCount = reports.filter(r => r.status === 'new').length;

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl opacity-30">📭</div>
        <p className="text-slate-400 text-sm">ยังไม่มีรายงานจากผู้ใช้</p>
        <p className="text-slate-300 text-xs">รายงานจะปรากฏที่นี่เมื่อมีผู้แจ้งเหตุผ่านลิ้งค์สาธารณะ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {newCount > 0 && (
        <div className="rounded-xl px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold text-red-600">มีรายงานใหม่ {newCount} รายการ</p>
        </div>
      )}
      {reports.map(r => (
        <ReportCard key={r.id} r={r} onSetStatus={setStatus} onDelete={deleteReport} />
      ))}
    </div>
  );
}

/* ── Seed test data ──────────────────────────────────────────────────────── */
const SEED_TYPES = ['flood', 'accident', 'complain', 'rain', 'weather'];
const SEED_DETAILS = {
  flood:    'น้ำท่วมขังบริเวณนี้',
  accident: 'เกิดอุบัติเหตุบนถนน',
  complain: 'ร้องเรียนปัญหาในพื้นที่',
  rain:     'ฝนตกหนักมองไม่เห็นทาง',
  weather:  'อากาศร้อนจัดผิดปกติ',
};
const KK = { lat: 16.432, lng: 102.828 };

function rand(min, max) { return min + Math.random() * (max - min); }

function SeedPanel() {
  const [seeding,  setSeeding]  = useState(false);
  const [clearing, setClearing] = useState(false);
  const [msg,      setMsg]      = useState(null);

  const seed = async () => {
    setSeeding(true); setMsg(null);
    try {
      const batch = writeBatch(db);
      for (let i = 0; i < 50; i++) {
        const type = SEED_TYPES[Math.floor(Math.random() * SEED_TYPES.length)];
        const lat  = rand(KK.lat - 0.06, KK.lat + 0.06);
        const lng  = rand(KK.lng - 0.06, KK.lng + 0.06);
        const ref  = doc(collection(db, 'reports'));
        batch.set(ref, {
          lat, lng,
          type,
          detail:    SEED_DETAILS[type],
          address:   `ทดสอบ (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          name:      'ทดสอบ',
          phone:     'ไม่ระบุ',
          status:    'new',
          _seed:     true,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setMsg({ ok: true, text: 'เพิ่ม 50 จุดแล้ว' });
    } catch {
      setMsg({ ok: false, text: 'เกิดข้อผิดพลาด' });
    } finally {
      setSeeding(false);
    }
  };

  const clear = async () => {
    setClearing(true); setMsg(null);
    try {
      const snap = await getDocs(query(collection(db, 'reports'), where('_seed', '==', true)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setMsg({ ok: true, text: `ลบ ${snap.size} จุดทดสอบแล้ว` });
    } catch {
      setMsg({ ok: false, text: 'เกิดข้อผิดพลาด' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(99,102,241,0.04)', border: '1.5px dashed rgba(99,102,241,0.3)' }}>
      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-wide">🧪 ข้อมูลทดสอบ Heat Map</p>
      <div className="flex gap-2">
        <button onClick={seed} disabled={seeding || clearing}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            color: 'white',
            opacity: (seeding || clearing) ? 0.6 : 1,
          }}>
          {seeding ? '⏳ กำลังเพิ่ม...' : '+ เพิ่ม 50 จุด'}
        </button>
        <button onClick={clear} disabled={seeding || clearing}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)',
            opacity: (seeding || clearing) ? 0.6 : 1,
          }}>
          {clearing ? '⏳ กำลังลบ...' : '🗑️ ลบจุดทดสอบ'}
        </button>
      </div>
      {msg && (
        <p className="text-xs text-center font-semibold"
          style={{ color: msg.ok ? '#059669' : '#ef4444' }}>
          {msg.ok ? '✓' : '✗'} {msg.text}
        </p>
      )}
    </div>
  );
}

/* ── Dashboard (post-login) ──────────────────────────────────────────────── */
function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('reports');
  const [newCount, setNewCount] = useState(0);

  return (
    <div className="flex flex-col gap-4 px-4 py-5 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-black text-slate-800">แผงควบคุม Admin</p>
          <p className="text-[11px] text-slate-400">ระบบติดตามสภาพแวดล้อม จ.ขอนแก่น</p>
        </div>
        <button onClick={onLogout}
          className="text-[11px] text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
          ออก
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl overflow-hidden p-1 gap-1"
        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #e0eaff' }}>
        {[
          { id: 'reports',   label: 'รายงาน',    badge: newCount },
          { id: 'community', label: 'ชุมชน',     badge: 0 },
          { id: 'alert',     label: 'แจ้งเตือน', badge: 0 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: tab === t.id ? 'white' : 'transparent',
              color:      tab === t.id ? '#1e293b' : '#94a3b8',
              boxShadow:  tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
            {t.badge > 0 && (
              <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                style={{ background: '#ef4444', color: 'white' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Share link */}
      {tab === 'reports' && (
        <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-indigo-600">ลิ้งค์แจ้งเหตุสาธารณะ</p>
            <p className="text-[10px] text-slate-500 truncate font-mono">{window.location.origin}/?report</p>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/?report`)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            คัดลอก
          </button>
        </div>
      )}

      {/* Tab content */}
      {tab === 'reports' && (
        <>
          <SeedPanel />
          <ReportsInbox onNewCount={setNewCount} />
        </>
      )}
      {tab === 'community' && (
        <div className="relative" style={{ height: 'calc(100dvh - 160px)', overflow: 'hidden', borderRadius: 16 }}>
          <CommunityView />
        </div>
      )}
      {tab === 'alert' && <AlertComposer />}
    </div>
  );
}

/* ── Main AdminView ──────────────────────────────────────────────────────── */
export default function AdminView() {
  const [authed, setAuthed] = useState(false);

  return (
    <div className="absolute inset-0 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg,#fef2f2 0%,#fff1f2 40%,#fdf4ff 100%)' }}>
      <div className="min-h-full flex flex-col justify-center">
        {authed
          ? <Dashboard onLogout={() => setAuthed(false)} />
          : <PinPad onSuccess={() => setAuthed(true)} />
        }
      </div>
    </div>
  );
}
