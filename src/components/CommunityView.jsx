import { useState, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, where, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const POST_STATUS = {
  new:      { label: 'แจ้งเหตุใหม่',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  read:     { label: 'กำลังดำเนินการ',     color: '#f97316', bg: 'rgba(251,146,60,0.1)'  },
  resolved: { label: 'ดำเนินการแล้ว',      color: '#059669', bg: 'rgba(16,185,129,0.1)'  },
};

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const s = (Date.now() - d) / 1000;
  if (s < 60)    return 'เมื่อกี้';
  if (s < 3600)  return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  if (s < 604800) return `${Math.floor(s / 86400)} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

/* ── Comment section for one post ─────────────────────────────────────────── */
function CommentSection({ postId }) {
  const [comments,  setComments]  = useState([]);
  const [text,      setText]      = useState('');
  const [author,    setAuthor]    = useState('');
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reports', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, snap =>
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [postId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'reports', postId, 'comments'), {
        text:      text.trim(),
        author:    author.trim() || 'ไม่ระบุชื่อ',
        createdAt: serverTimestamp(),
      });
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-2.5" style={{ borderColor: '#f1f5f9' }}>
      {comments.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-1">ยังไม่มีความคิดเห็น เป็นคนแรกได้เลย</p>
      )}

      {comments.map(c => (
        <div key={c.id} className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
            style={{ background: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', color: '#1d4ed8' }}>
            {(c.author?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full"
              style={{ background: '#f8faff', border: '1px solid #e0eaff' }}>
              <p className="text-[11px] font-bold text-blue-600 mb-0.5">{c.author}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 ml-1">{timeAgo(c.createdAt)}</p>
          </div>
        </div>
      ))}

      <div ref={bottomRef} />

      {/* Comment input */}
      <div className="flex gap-2 pt-1">
        <div className="flex-1 space-y-1.5">
          <input
            value={author} onChange={e => setAuthor(e.target.value)}
            placeholder="ชื่อ (ไม่บังคับ)"
            className="w-full px-3 py-1.5 rounded-xl text-xs outline-none"
            style={{ background: '#f8faff', border: '1px solid #e0eaff', color: '#1e293b' }}
          />
          <div className="flex gap-2">
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="แสดงความคิดเห็น..."
              className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: '#f8faff', border: `1.5px solid ${text ? '#bfdbfe' : '#e0eaff'}`, color: '#1e293b' }}
            />
            <button onClick={send} disabled={!text.trim() || sending}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              style={{
                background: text.trim() ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(148,163,184,0.25)',
                color: text.trim() ? 'white' : '#94a3b8',
              }}>
              {sending ? '...' : 'ส่ง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Single post card ──────────────────────────────────────────────────────── */
function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const st = POST_STATUS[post.status] ?? POST_STATUS.new;

  useEffect(() => {
    const q = query(collection(db, 'reports', post.id, 'comments'), orderBy('createdAt'));
    return onSnapshot(q, snap => setCommentCount(snap.size));
  }, [post.id]);

  return (
    <div className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1.5px solid #e8f0fe', boxShadow: '0 2px 12px rgba(59,130,246,0.06)' }}>

      {/* Post header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#fde68a,#fbbf24)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">
                {post.address?.split(',')[0] ?? 'ไม่ระบุสถานที่'}
              </p>
              <p className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>

        {/* Detail */}
        <p className="text-sm text-slate-800 leading-relaxed">{post.detail}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img src={post.image} alt="ภาพประกอบ"
            className="w-full rounded-xl object-cover cursor-pointer"
            style={{ maxHeight: '220px', border: '1px solid #e0eaff' }}
            onClick={() => window.open(post.image, '_blank')}
          />
        </div>
      )}

      {/* Footer — comment toggle */}
      <div className="px-4 pb-3">
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: expanded ? '#3b82f6' : '#94a3b8' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount > 0 ? `${commentCount} ความคิดเห็น` : 'แสดงความคิดเห็น'}
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>

        {expanded && <CommentSection postId={post.id} />}
      </div>
    </div>
  );
}

/* ── Phone status check ────────────────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { key: 'new',      label: 'ส่งการแจ้งเหตุ' },
  { key: 'read',     label: 'รับทราบแล้ว' },
  { key: 'resolved', label: 'ดำเนินการแล้ว' },
];
const ORDER_MAP = { new: 0, read: 1, resolved: 2 };

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

function StatusCard({ r }) {
  const [open, setOpen] = useState(false);
  const st = POST_STATUS[r.status] ?? POST_STATUS.new;
  const currentStep = ORDER_MAP[r.status] ?? 0;

  return (
    <div className="rounded-2xl bg-white overflow-hidden"
      style={{ border: `1.5px solid ${r.status === 'new' ? 'rgba(239,68,68,0.2)' : '#e8f0fe'}`, boxShadow: '0 2px 10px rgba(59,130,246,0.05)' }}>

      {/* Card header */}
      <button className="w-full px-4 py-3.5 flex items-start gap-3 text-left" onClick={() => setOpen(v => !v)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: st.bg }}>
          {currentStep === 2 ? '✅' : currentStep === 1 ? '👁️' : '⏳'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(r.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium line-clamp-1">{r.detail}</p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            📍 {r.address?.split(',')[0] ?? 'ไม่ระบุ'}
          </p>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"
          className="flex-shrink-0 mt-1 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded timeline */}
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: '#f1f5f9' }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-3 mb-2.5">ความคืบหน้า</p>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done = currentStep >= ORDER_MAP[step.key];
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: done ? (step.key === 'resolved' ? '#059669' : '#3b82f6') : 'rgba(148,163,184,0.15)',
                        border: done ? 'none' : '1.5px dashed #cbd5e1',
                      }}>
                      {done && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px mt-0.5" style={{ height: 18, background: done ? '#bfdbfe' : '#e2e8f0' }} />
                    )}
                  </div>
                  <div className="pb-1 pt-0.5">
                    <p className="text-xs font-semibold leading-tight" style={{ color: done ? '#1e293b' : '#94a3b8' }}>{step.label}</p>
                    {done && step.key === 'new' && r.createdAt && (
                      <p className="text-[10px] text-slate-400">{fmtDate(r.createdAt)}</p>
                    )}
                    {done && step.key === 'read' && r.readAt && (
                      <p className="text-[10px] text-slate-400">{fmtDate(r.readAt)}</p>
                    )}
                    {done && step.key === 'resolved' && r.resolvedAt && (
                      <p className="text-[10px] text-slate-400">{fmtDate(r.resolvedAt)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {r.image && (
            <img src={r.image} alt="รูป"
              className="w-full rounded-xl object-cover mt-3 cursor-pointer"
              style={{ maxHeight: '140px', border: '1px solid #e0eaff' }}
              onClick={() => window.open(r.image, '_blank')}
            />
          )}

          {/* Admin reply */}
          {r.adminReply?.text && (
            <div className="mt-3 rounded-xl p-3 space-y-1"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.25)' }}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📩</span>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wide">ข้อความจากเจ้าหน้าที่</p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{r.adminReply.text}</p>
              {r.adminReply.sentAt && (
                <p className="text-[9px] text-slate-400">{fmtDate(r.adminReply.sentAt)}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhoneStatusCheck() {
  const [phone,   setPhone]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const search = async () => {
    const p = phone.trim();
    if (!p) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const snap = await getDocs(
        query(collection(db, 'reports'), where('phone', '==', p))
      );
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
          const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
          return tb - ta;
        });
      setResults(data);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="rounded-2xl p-4 bg-white space-y-3" style={{ border: '1.5px solid #e8f0fe' }}>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">เบอร์โทรที่ใช้แจ้งเหตุ</p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="เช่น 0812345678"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#f8faff', border: `1.5px solid ${phone ? '#bfdbfe' : '#e0eaff'}`, color: '#1e293b' }}
            />
            <button
              onClick={search}
              disabled={!phone.trim() || loading}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex-shrink-0"
              style={{
                background: phone.trim() ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(148,163,184,0.25)',
                color: phone.trim() ? 'white' : '#94a3b8',
                boxShadow: phone.trim() ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
              }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'ค้นหา'}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400">ใส่เบอร์โทรที่กรอกไว้ตอนแจ้งเหตุ ถ้าไม่ได้กรอกให้ใช้รหัสติดตามแทน</p>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {/* No results */}
      {results !== null && results.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2 text-center">
          <div className="text-3xl opacity-30">🔍</div>
          <p className="text-sm font-bold text-slate-500">ไม่พบรายการแจ้งเหตุ</p>
          <p className="text-xs text-slate-400">กรุณาตรวจสอบเบอร์โทรให้ถูกต้อง</p>
        </div>
      )}

      {/* Results */}
      {results !== null && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 px-1">พบ {results.length} รายการ</p>
          {results.map(r => <StatusCard key={r.id} r={r} />)}
        </div>
      )}

      {/* Link to track by code */}
      <div className="text-center pt-1">
        <a href="/?track" className="text-xs text-blue-400 hover:underline">
          ติดตามด้วยรหัสแทน →
        </a>
      </div>
    </div>
  );
}

/* ── Announcement card ─────────────────────────────────────────────────────── */
function AnnouncementCard({ item }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', border: '1.5px solid rgba(251,146,60,0.35)', boxShadow: '0 2px 12px rgba(249,115,22,0.08)' }}>
      <div className="px-4 py-4 flex gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: 'rgba(239,68,68,0.12)' }}>📢</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>ประกาศจากเจ้าหน้าที่</span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(item.createdAt)}</span>
          </div>
          <p className="text-sm font-black text-slate-800 leading-tight">{item.title}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.body}</p>
        </div>
      </div>
      {item.imageUrl && (
        <div className="px-4 pb-4">
          <img
            src={item.imageUrl}
            alt="ภาพประกอบประกาศ"
            className="w-full rounded-xl object-cover cursor-pointer"
            style={{ maxHeight: '220px', border: '1px solid rgba(251,146,60,0.25)' }}
            onClick={() => window.open(item.imageUrl, '_blank')}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main CommunityView ────────────────────────────────────────────────────── */
export default function CommunityView() {
  const [tab,     setTab]     = useState('feed');
  const [feed,    setFeed]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let reports = [];
    let announcements = [];
    let loadedCount = 0;

    const merge = () => {
      const merged = [
        ...reports.map(r => ({ ...r, _type: 'report' })),
        ...announcements.map(a => ({ ...a, _type: 'announcement' })),
      ].sort((a, b) => {
        const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
        const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
        return tb - ta;
      });
      setFeed(merged);
      if (loadedCount < 2) { loadedCount++; if (loadedCount === 2) setLoading(false); }
    };

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), orderBy('createdAt', 'desc')),
      snap => { reports = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge(); }
    );
    const unsubAnnounce = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
      snap => { announcements = snap.docs.map(d => ({ id: d.id, ...d.data() })); merge(); }
    );

    return () => { unsubReports(); unsubAnnounce(); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg,#eff6ff 0%,#f8faff 100%)' }}>
      <div className="max-w-lg mx-auto px-3 pt-4 pb-6"
        style={{ paddingBottom: 'calc(1.5rem + var(--nav-bottom))' }}>

        {/* Header */}
        <div className="px-1 mb-4">
          <p className="text-lg font-black text-slate-800">ชุมชนข่าว</p>
          <p className="text-xs text-slate-400">รายงานสภาพแวดล้อมจากชาวขอนแก่น</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1 mb-4"
          style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e0eaff' }}>
          {[
            { id: 'feed',   label: 'ฟีดข่าว' },
            { id: 'status', label: 'เช็คสถานะ' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? 'white' : 'transparent',
                color:      tab === t.id ? '#1e293b' : '#94a3b8',
                boxShadow:  tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Feed tab */}
        {tab === 'feed' && (
          <>
            <div className="flex gap-2 mb-4">
              <a href="/?report"
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-95"
                style={{ background: 'white', border: '1.5px dashed #bfdbfe', boxShadow: '0 2px 8px rgba(59,130,246,0.06)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-500">พบเหตุผิดปกติ? แจ้งเหตุ...</p>
              </a>

              <a href="/?traveltime"
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl transition-all active:scale-95 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                  border: '1.5px solid #bfdbfe',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.10)',
                }}>
                <span style={{ fontSize: 22 }}>🗺️</span>
                <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">Travel Map</span>
              </a>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#bfdbfe', borderTopColor: '#3b82f6' }} />
                <p className="text-xs text-slate-400">กำลังโหลด...</p>
              </div>
            )}

            {!loading && feed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="text-4xl opacity-30">📭</div>
                <p className="text-sm font-bold text-slate-500">ยังไม่มีรายงาน</p>
                <p className="text-xs text-slate-400">เป็นคนแรกที่แจ้งเหตุในชุมชนได้เลย</p>
              </div>
            )}

            <div className="space-y-3">
              {feed.map(item =>
                item._type === 'announcement'
                  ? <AnnouncementCard key={`ann-${item.id}`} item={item} />
                  : <PostCard key={`rpt-${item.id}`} post={item} />
              )}
            </div>
          </>
        )}

        {/* Status tab */}
        {tab === 'status' && <PhoneStatusCheck />}
      </div>
    </div>
  );
}
