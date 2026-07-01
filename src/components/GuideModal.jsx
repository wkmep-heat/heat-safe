import { useState } from 'react';
import { FaTimes, FaHome, FaMap, FaFireAlt, FaExclamationTriangle, FaUsers,
         FaVideo, FaShieldAlt, FaLayerGroup, FaThermometerHalf, FaWind,
         FaBell, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const SECTIONS = [
  {
    id: 'home',
    icon: FaHome,
    color: '#3b82f6',
    title: 'หน้าหลัก',
    desc: 'ข้อมูลสภาพอากาศเรียลไทม์ของขอนแก่น',
    items: [
      { title: 'อุณหภูมิปัจจุบัน', desc: 'แสดงอุณหภูมิจากสถานีกรมอุตุฯ ขอนแก่น อัปเดตทุก 10 นาที' },
      { title: 'พยากรณ์รายชั่วโมง', desc: 'เลื่อนซ้าย-ขวาเพื่อดูพยากรณ์ล่วงหน้า พร้อมไอคอนสภาพฟ้าและโอกาสฝน' },
      { title: 'เรดาร์ฝน', desc: 'แสดง Doppler Radar แบบ loop จากกรมอุตุฯ แตะ "เต็มจอ" เพื่อดูภาพใหญ่' },
      { title: 'รายชื่อตำบล', desc: 'แสดงอุณหภูมิ ฝุ่น PM2.5 ความชื้น ของแต่ละตำบล แตะเพื่อดูในแผนที่' },
      { title: 'จุดสีบนหัว', desc: '🟢 เรียลไทม์  🟣 กำลังโหลด  🔴 ออฟไลน์' },
    ],
  },
  {
    id: 'map',
    icon: FaMap,
    color: '#10b981',
    title: 'แผนที่',
    desc: 'แผนที่แบบ interactive พร้อม layer ข้อมูลต่างๆ',
    items: [
      { title: 'เปิด-ปิด Layer', desc: 'แตะปุ่มด้านซ้าย (หรือลาก sidebar ออก) เพื่อเปิด/ปิดแต่ละ layer' },
      { title: 'ปรับความโปร่งใส', desc: 'ใช้แถบเลื่อนใต้ชื่อ layer เพื่อปรับความเข้มของสี' },
      { title: 'เลือก Basemap', desc: 'สลับระหว่าง Satellite / Street map ที่ด้านล่าง sidebar' },
      { title: 'แตะตำบล', desc: 'แตะจุดบนแผนที่เพื่อดูอุณหภูมิ ฝุ่น ความชื้น ของตำบลนั้น' },
    ],
  },
  {
    id: 'layers',
    icon: FaLayerGroup,
    color: '#6366f1',
    title: 'Layer บนแผนที่',
    desc: 'ชั้นข้อมูลที่สามารถเปิด-ปิดได้',
    items: [
      { icon: FaThermometerHalf, iconColor: '#ef4444', title: 'อุณหภูมิ (พยากรณ์)', desc: 'แสดงสีตามอุณหภูมิพยากรณ์ของแต่ละตำบล เลือกช่วงเวลาได้' },
      { icon: FaWind, iconColor: '#f97316', title: 'ฝุ่น PM2.5', desc: 'แสดงระดับฝุ่นละออง แตะตำบลเพื่อดูค่า AQI' },
      { title: 'การสะสมความร้อน', iconColor: '#d97706', desc: 'Heatmap แสดงพื้นที่ที่มีความร้อนสะสม ทั้งตำบลและแหล่งพาณิชยกรรม' },
      { icon: FaShieldAlt, iconColor: '#d7191c', title: 'จุดเฝ้าระวังความร้อน', desc: 'จุดเสี่ยงความร้อนสูงในเขตเมือง กรองตามระดับสูง/กลาง/ต่ำ พร้อม Heatmap' },
      { icon: FaVideo, iconColor: '#38bdf8', title: 'กล้อง CCTV จราจร', desc: 'กล้องวงจรปิดจาก Longdo Traffic แตะดูภาพสดได้เลย' },
      { title: 'ดาวเทียม Himawari', iconColor: '#8b5cf6', desc: 'ภาพถ่ายดาวเทียมเมฆแบบ loop จาก JMA' },
    ],
  },
  {
    id: 'heatsafe',
    icon: FaFireAlt,
    color: '#ef4444',
    title: 'Heat Safe',
    desc: 'ประเมินความปลอดภัยจากความร้อน',
    items: [
      { title: 'ประเมินสภาพร่างกาย', desc: 'กรอกข้อมูลส่วนตัว อาชีพ และสถานที่ทำงาน เพื่อประเมินความเสี่ยง' },
      { title: 'ดัชนีความร้อน (Heat Index)', desc: 'คำนวณจากอุณหภูมิ + ความชื้น แสดงระดับอันตรายตามเกณฑ์สากล' },
      { title: 'คำแนะนำเฉพาะบุคคล', desc: 'ระบบให้คำแนะนำการปฏิบัติตัวตามระดับความเสี่ยงที่คำนวณได้' },
    ],
  },
  {
    id: 'risk',
    icon: FaExclamationTriangle,
    color: '#f97316',
    title: 'พื้นที่เสี่ยง',
    desc: 'รายชื่อพื้นที่เสี่ยงภัยในขอนแก่น',
    items: [
      { title: 'จุดเสี่ยงความร้อน', desc: 'รายชื่อพื้นที่ที่มีความเสี่ยง พร้อมสาเหตุและคำแนะนำ' },
      { title: 'แตะเพื่อดูในแผนที่', desc: 'กดที่รายชื่อพื้นที่เพื่อเปิดแผนที่และซูมไปยังตำแหน่งนั้น' },
    ],
  },
  {
    id: 'community',
    icon: FaUsers,
    color: '#8b5cf6',
    title: 'ชุมชน',
    desc: 'ประกาศและรายงานจากภาครัฐและประชาชน',
    items: [
      { title: 'ประกาศจากเจ้าหน้าที่', desc: 'ข้อความและรูปภาพที่เจ้าหน้าที่ส่งผ่านระบบ Admin' },
      { title: 'รายงานจากประชาชน', desc: 'รายงานสภาพอากาศหรือเหตุการณ์จากผู้ใช้ทั่วไป' },
      { title: 'แจ้งปัญหา', desc: 'แตะปุ่ม "รายงาน" เพื่อส่งข้อมูลพิกัดและรูปภาพได้ทันที' },
    ],
  },
  {
    id: 'notify',
    icon: FaBell,
    color: '#6366f1',
    title: 'การแจ้งเตือน',
    desc: 'รับการแจ้งเตือนเมื่อสภาพอากาศเปลี่ยนแปลง',
    items: [
      { title: 'เปิดรับการแจ้งเตือน', desc: 'กดปุ่ม "เปิดรับการแจ้งเตือน" ที่หน้าหลักเพื่อรับ push notification' },
      { title: 'ช่อง LINE', desc: 'ประกาศจากเจ้าหน้าที่จะถูกส่งไปยัง LINE OA ของระบบโดยอัตโนมัติ' },
    ],
  },
];

function SectionCard({ section, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${section.color}25`, background: `${section.color}08` }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${section.color}cc,${section.color})` }}>
          <Icon size={15} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-800 leading-none">{section.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{section.desc}</p>
        </div>
        <div style={{ color: section.color }}>
          {isOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2.5">
          {section.items.map((item, i) => {
            const SubIcon = item.icon;
            return (
              <div key={i} className="flex gap-2.5">
                {SubIcon ? (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.iconColor}18` }}>
                    <SubIcon size={11} color={item.iconColor} />
                  </div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: section.color }} />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-700 leading-none">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GuideModal({ onClose }) {
  const [openId, setOpenId] = useState('home');

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          maxHeight: '88dvh',
          background: 'linear-gradient(160deg,#f8faff 0%,#eff6ff 100%)',
          boxShadow: '0 -8px 48px rgba(59,130,246,0.18), 0 4px 32px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: 'linear-gradient(135deg,rgba(99,102,241,1),rgba(59,130,246,1))',
          }}>
          <div>
            <p className="text-white font-black text-base leading-none">คู่มือการใช้งาน</p>
            <p className="text-blue-100 text-[11px] mt-0.5">KKMap Heat — ขอนแก่น</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <FaTimes size={13} color="white" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-4 space-y-2.5" style={{ maxHeight: 'calc(88dvh - 68px)' }}>
          {/* Quick tip */}
          <div className="rounded-2xl px-4 py-3 flex gap-3 items-start"
            style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe' }}>
            <span className="text-xl mt-0.5">💡</span>
            <div>
              <p className="text-xs font-bold text-blue-800">เริ่มต้นใช้งาน</p>
              <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                แตะแถบเมนูด้านล่าง (มือถือ) หรือแถบด้านซ้าย (คอม) เพื่อสลับระหว่างหน้าต่างๆ
              </p>
            </div>
          </div>

          {SECTIONS.map(s => (
            <SectionCard
              key={s.id}
              section={s}
              isOpen={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            />
          ))}

          {/* Footer */}
          <div className="text-center pt-2 pb-1">
            <p className="text-[10px] text-slate-400">KKMap Heat · ระบบติดตามสภาพอากาศขอนแก่น</p>
          </div>
        </div>
      </div>
    </div>
  );
}
