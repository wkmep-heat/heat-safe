import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const IMGBB_KEY = 'b48174b520f12cf5eb763cff034282cd';

const REPORT_TYPES = [
  { id: 'flood',    label: 'น้ำท่วม',     icon: '🌊', color: '#3b82f6' },
  { id: 'accident', label: 'อุบัติเหตุ',  icon: '🚨', color: '#ef4444' },
  { id: 'complain', label: 'ร้องเรียน',   icon: '📢', color: '#f97316' },
  { id: 'rain',     label: 'ฝนตก',        icon: '🌧️', color: '#0ea5e9' },
  { id: 'weather',  label: 'สภาพอากาศ',  icon: '⛅', color: '#64748b' },
];

async function uploadToImgBB(blob) {
  const form = new FormData();
  form.append('image', blob, 'report.jpg');
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw new Error('upload failed');
  return json.data.url;
}

/* ย่อรูปเป็น Blob ก่อนอัปโหลด — จำกัด 800px quality 0.75 */
function resizeToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else                { width  = Math.round(width  * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('blob failed')), 'image/jpeg', 0.75);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportView() {
  const [location,  setLocation]  = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoError,  setGeoError]  = useState('');
  const [detail,    setDetail]    = useState('');
  const [image,     setImage]     = useState(null); // { blob, preview }
  const [imgLoading, setImgLoading] = useState(false);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [reportType,  setReportType]  = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [trackingId,  setTrackingId]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef(null);

  const canSubmit = location && detail.trim() && image && reportType;

  const getLocation = () => {
    if (!navigator.geolocation) { setGeoError('อุปกรณ์นี้ไม่รองรับ GPS'); setGeoStatus('error'); return; }
    setGeoStatus('loading'); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`,
            { headers: { 'User-Agent': 'KKMapHeat/1.0' } }
          );
          const data = await res.json();
          if (data.display_name) address = data.display_name.split(',').slice(0, 3).join(',').trim();
        } catch {}
        setLocation({ lat, lng, address }); setGeoStatus('ok');
      },
      (err) => {
        const msg = err.code === 1 ? 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง'
                  : err.code === 2 ? 'ไม่พบสัญญาณ GPS' : 'หมดเวลา กรุณาลองใหม่';
        setGeoError(msg); setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    try {
      const blob = await resizeToBlob(file);
      const preview = URL.createObjectURL(blob);
      setImage({ blob, preview });
    } catch {
      setError('โหลดรูปภาพไม่สำเร็จ');
    } finally {
      setImgLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const imageUrl = await uploadToImgBB(image.blob);

      const docRef = await addDoc(collection(db, 'reports'), {
        lat:       location.lat,
        lng:       location.lng,
        address:   location.address,
        detail:    detail.trim(),
        image:     imageUrl,
        name:      name.trim() || 'ไม่ระบุ',
        phone:     phone.trim() || 'ไม่ระบุ',
        type:      reportType,
        status:    'new',
        createdAt: serverTimestamp(),
      });

      // แจ้ง LINE OA ทันที (ไม่รอ — ไม่ให้ error กระทบผู้ใช้)
      const locationLine = `📍 ${location.address}\n🗺️ https://www.google.com/maps?q=${location.lat},${location.lng}`;
      fetch('/api/line-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin:      '2569',
          title:    `🆕 แจ้งเหตุใหม่ · ${location.address?.split(',')[0] ?? 'ขอนแก่น'}`,
          body:     `${detail.trim()}\n\n${locationLine}`,
          imageUrl: imageUrl,
        }),
      }).catch(() => {});

      setTrackingId(docRef.id);
      setSubmitted(true);
    } catch (e) {
      setError('ส่งไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleAgain = () => {
    if (image?.preview) URL.revokeObjectURL(image.preview);
    setLocation(null); setGeoStatus('idle'); setGeoError('');
    setDetail(''); setImage(null); setName(''); setPhone('');
    setReportType(''); setSubmitted(false); setError('');
  };

  /* ── Success screen ── */
  if (submitted) {
    const trackUrl = `${window.location.origin}/?track&id=${trackingId}`;
    return (
      <div style={{ height: '100dvh', overflowY: 'auto', background: 'linear-gradient(160deg,#f0fdf4 0%,#ecfdf5 60%,#f8faff 100%)' }}
        className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>✓</div>
          <div>
            <p className="text-xl font-black text-slate-800">แจ้งเหตุสำเร็จ</p>
            <p className="text-sm text-slate-500 mt-1">ข้อมูลของคุณถูกส่งไปยังเจ้าหน้าที่แล้ว ขอบคุณที่ช่วยดูแลชุมชน</p>
          </div>

          {/* Tracking code */}
          <div className="rounded-2xl p-4 text-left space-y-2"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1.5px solid rgba(59,130,246,0.25)' }}>
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wide">รหัสติดตามสถานะ</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 font-mono text-sm text-slate-700 break-all">{trackingId}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(trackingId)}
                className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                คัดลอก
              </button>
            </div>
            <p className="text-[10px] text-slate-400">เก็บรหัสนี้ไว้เพื่อตรวจสอบสถานะในภายหลัง</p>
          </div>

          <div className="rounded-2xl p-4 text-left space-y-1"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <p className="text-xs text-slate-500 font-mono">📍 {location?.lat?.toFixed(5)}, {location?.lng?.toFixed(5)}</p>
            <p className="text-sm text-slate-700">{location?.address}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a href={trackUrl}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-center block transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', boxShadow: '0 6px 20px rgba(59,130,246,0.35)' }}>
              ติดตามสถานะ
            </a>
            <button onClick={handleAgain}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: 'white', color: '#059669', border: '1.5px solid rgba(16,185,129,0.4)' }}>
              แจ้งเหตุอีกครั้ง
            </button>
            <a href="/" className="w-full py-3.5 rounded-2xl text-sm font-bold text-center block"
              style={{ background: 'white', color: '#475569', border: '1.5px solid #e0eaff' }}>
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div style={{ height: '100dvh', overflowY: 'auto', background: 'linear-gradient(160deg,#fff7ed 0%,#fef3c7 30%,#f8faff 100%)' }}>
      <div className="max-w-md mx-auto px-4 pt-8 pb-12 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/" className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid #e0eaff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </a>
          <div>
            <p className="font-black text-slate-800 text-lg leading-tight">แจ้งเหตุ</p>
            <p className="text-xs text-slate-400">ระบบติดตามสภาพแวดล้อม จ.ขอนแก่น</p>
          </div>
        </div>

        {/* Report type */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
            ประเภทการแจ้งเตือน <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {REPORT_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setReportType(t.id)}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background:  reportType === t.id ? t.color + '18' : 'white',
                  border:      reportType === t.id ? `2px solid ${t.color}` : '1.5px solid #e0eaff',
                  color:       reportType === t.id ? t.color : '#94a3b8',
                  boxShadow:   reportType === t.id ? `0 2px 8px ${t.color}30` : 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* GPS Location */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
            ตำแหน่งที่เกิดเหตุ <span className="text-red-400">*</span>
          </p>
          {geoStatus !== 'ok' ? (
            <button onClick={getLocation} disabled={geoStatus === 'loading'}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: geoStatus === 'loading' ? 'rgba(59,130,246,0.08)' : 'white',
                border: `1.5px solid ${geoStatus === 'error' ? '#fca5a5' : '#bfdbfe'}`,
                color: geoStatus === 'error' ? '#ef4444' : '#3b82f6',
              }}>
              {geoStatus === 'loading' ? (
                <><div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />กำลังระบุตำแหน่ง...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                  {geoStatus === 'error' ? 'ลองอีกครั้ง' : 'รับพิกัดปัจจุบัน'}
                </>
              )}
            </button>
          ) : (
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-blue-500">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                  <p className="text-sm text-slate-700 mt-0.5 leading-tight">{location.address}</p>
                </div>
                <button onClick={() => { setLocation(null); setGeoStatus('idle'); }}
                  className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>เปลี่ยน</button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] text-emerald-600 font-medium">ระบุตำแหน่งสำเร็จ</p>
              </div>
            </div>
          )}
          {geoStatus === 'error' && <p className="text-xs text-red-500 mt-1.5 text-center">{geoError}</p>}
        </div>

        {/* Detail */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">รายละเอียด <span className="text-red-400">*</span></p>
          <textarea
            value={detail} onChange={e => setDetail(e.target.value)}
            placeholder="อธิบายสิ่งที่พบ เช่น อุณหภูมิสูงมาก ผู้คนหน้ามืด มีควันสีดำ..."
            rows={4} maxLength={300}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
            style={{
              background: 'white',
              border: `1.5px solid ${detail ? '#fb923c60' : '#e0eaff'}`,
              fontFamily: 'Noto Sans Thai, sans-serif',
              color: '#1e293b', lineHeight: 1.6,
            }}
          />
          <p className="text-[10px] text-slate-400 text-right mt-0.5">{detail.length}/300</p>
        </div>

        {/* Image */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">รูปภาพประกอบ <span className="text-red-400">*</span></p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handleImageChange} className="hidden" />
          {!image?.preview ? (
            <button onClick={() => fileRef.current?.click()} disabled={imgLoading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-dashed text-sm font-medium transition-all"
              style={{ borderColor: '#cbd5e1', color: '#94a3b8', background: 'rgba(255,255,255,0.5)' }}>
              {imgLoading ? (
                <><div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />กำลังโหลด...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  ถ่ายภาพ / เลือกรูปจากคลัง
                </>
              )}
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ border: '1.5px solid #e0eaff' }}>
              <img src={image.preview} alt="preview" className="w-full object-cover" style={{ maxHeight: '220px' }} />
              <button onClick={() => { URL.revokeObjectURL(image.preview); setImage(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Optional fields */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #e0eaff' }}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ข้อมูลผู้แจ้ง (ไม่บังคับ)</p>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="ชื่อ-นามสกุล" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'white', border: '1.5px solid #e0eaff', fontFamily: 'Noto Sans Thai, sans-serif', color: '#1e293b' }} />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="เบอร์โทรติดต่อกลับ" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'white', border: '1.5px solid #e0eaff', color: '#1e293b' }} />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-semibold text-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit || loading}
          className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all active:scale-95"
          style={{
            background: canSubmit && !loading ? 'linear-gradient(135deg,#f97316,#ef4444)' : 'rgba(148,163,184,0.4)',
            boxShadow: canSubmit && !loading ? '0 8px 24px rgba(249,115,22,0.35)' : 'none',
            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
          }}>
          {loading ? '⏳ กำลังส่ง...' : '📢 ส่งการแจ้งเหตุ'}
        </button>

        <p className="text-[10px] text-slate-400 text-center">ข้อมูลที่ส่งจะถูกส่งตรงถึงเจ้าหน้าที่ผู้รับผิดชอบ</p>
      </div>
    </div>
  );
}
