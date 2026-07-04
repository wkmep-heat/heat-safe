import { useState } from 'react';
import { FaTimes, FaSearch, FaBars, FaMapMarkerAlt, FaLayerGroup, FaClock,
         FaChevronDown, FaChevronUp } from 'react-icons/fa';

const SECTIONS = [
  {
    id: 'controls',
    icon: FaSearch,
    color: '#3b82f6',
    title: 'แถบควบคุมด้านบน',
    desc: 'ค้นหา สลับเลเยอร์ และหาตำแหน่งตัวเอง',
    items: [
      { icon: FaBars, iconColor: '#3b82f6', title: 'ปุ่ม ☰', desc: 'เปิด/ปิดแผงเลเยอร์ข้อมูล แผงจะแสดงทับแถบค้นหาเมื่อเปิดอยู่ แตะที่ไหนก็ได้บนแผนที่เพื่อปิด' },
      { icon: FaSearch, iconColor: '#3b82f6', title: 'ช่องค้นหา', desc: 'พิมพ์ชื่อตำบลหรือสถานที่ทั่วไทย แล้วแตะผลลัพธ์เพื่อบินไปยังตำแหน่งนั้นทันที' },
      { icon: FaMapMarkerAlt, iconColor: '#3b82f6', title: 'ปุ่ม 📍 (ตำแหน่งของฉัน)', desc: 'ขอสิทธิ์ GPS แล้วบินแผนที่ไปยังตำแหน่งปัจจุบันของคุณ' },
    ],
  },
  {
    id: 'basemap',
    icon: FaLayerGroup,
    color: '#10b981',
    title: 'สลับพื้นแผนที่ & ซูม',
    desc: 'ปุ่มลอยมุมขวาล่างของแผนที่',
    items: [
      { title: 'แผนที่ / ดาวเทียม', desc: 'ปุ่ม 2 อันเรียงแนวตั้งเหนือปุ่มซูม สลับพื้นหลังแผนที่ระหว่างเส้นถนน (OSM) กับภาพถ่ายดาวเทียม' },
      { title: 'ปุ่มซูม + / -', desc: 'อยู่ล่างสุดขวา ใช้ซูมเข้า-ออก หรือจะซูมด้วยการ pinch/scroll บนแผนที่ก็ได้' },
    ],
  },
  {
    id: 'layers-weather',
    icon: FaLayerGroup,
    color: '#f97316',
    title: 'เลเยอร์: สภาพอากาศ',
    desc: 'ข้อมูลอุณหภูมิ ฝุ่น และภาพถ่ายดาวเทียม',
    items: [
      { title: 'อุณหภูมิ', desc: 'สีของแต่ละตำบลตามอุณหภูมิพยากรณ์ เลือกช่วงเวลาได้จากแถบเลื่อนด้านล่างจอเมื่อเปิดเลเยอร์นี้' },
      { title: 'ฝุ่น PM2.5', desc: 'สีตามระดับฝุ่นละอองรายตำบล แตะตำบลเพื่อดูค่า AQI ละเอียด' },
      { title: 'การสะสมความร้อน', desc: 'Heatmap แสดงพื้นที่สะสมความร้อนสูง ทั้งระดับตำบลและแหล่งพาณิชยกรรม' },
      { title: 'ร่องน้ำ', desc: 'เส้นทางลำน้ำ/ร่องน้ำสำคัญในเขตอำเภอเมืองขอนแก่น' },
      { title: 'อุณหภูมิ MODIS รายเดือน', desc: 'ภาพอุณหภูมิพื้นผิวจากดาวเทียม MODIS เลือกเดือนได้จากแถบด้านล่างจอ' },
      { title: 'ติดตามสภาวะอากาศ (Himawari)', desc: 'ภาพถ่ายดาวเทียมเมฆแบบเคลื่อนไหวจาก JMA ย้อนหลัง 2 ชั่วโมง' },
    ],
  },
  {
    id: 'layers-safety',
    icon: FaLayerGroup,
    color: '#ef4444',
    title: 'เลเยอร์: ความปลอดภัย & แจ้งเหตุ',
    desc: 'กล้อง จุดแจ้งเหตุ และจุดเฝ้าระวัง',
    items: [
      { title: 'กล้อง CCTV จราจร', desc: 'ตำแหน่งกล้องวงจรปิดจาก Longdo Traffic แตะไอคอนเพื่อดูภาพสด' },
      { title: 'จุดแจ้งเหตุประชาชน', desc: 'รายงานจากประชาชนและเจ้าหน้าที่ เมื่อเปิดเลเยอร์นี้จะมีปุ่มย่อย "ฮีทแมพ" และ "จุดปักหมุด" ให้เลือกเปิดแยกกันหรือพร้อมกันก็ได้ แตะหมุดเพื่อดูรายละเอียดเหตุการณ์' },
      { title: 'จุดเฝ้าระวังความร้อน', desc: 'เปิด/ปิดได้จากแผงเลเยอร์ (ปัจจุบันยังไม่มีจุดแสดงบนแผนที่)' },
    ],
  },
  {
    id: 'layers-infra',
    icon: FaLayerGroup,
    color: '#8b5cf6',
    title: 'เลเยอร์: ผังเมือง & โครงสร้างพื้นฐาน',
    desc: 'ถนน อาคาร สวน และหมู่บ้าน',
    items: [
      { title: 'พื้นที่แนะนำสวนสาธารณะ', desc: 'จุดที่ระบบแนะนำให้พัฒนาเป็นพื้นที่สีเขียวเพิ่มเติม' },
      { title: 'ถนนรายละเอียด / ถนนหลัก', desc: 'เส้นทางถนนซอยและถนนสายหลักในเขตเมือง' },
      { title: 'โรงเรียน / หมู่บ้าน', desc: 'ตำแหน่งโรงเรียนและหมู่บ้านจากข้อมูล GIS' },
      { title: 'ความหนาแน่นอาคาร / อาคาร', desc: 'แสดงระดับความหนาแน่นของสิ่งปลูกสร้างในแต่ละพื้นที่' },
    ],
  },
  {
    id: 'district',
    icon: FaClock,
    color: '#6366f1',
    title: 'ดูข้อมูลรายตำบล',
    desc: 'แตะจุดหรือพื้นที่บนแผนที่',
    items: [
      { title: 'แตะตำบล', desc: 'แตะพื้นที่/จุดสีของตำบลเพื่อเปิดการ์ดข้อมูล แสดงอุณหภูมิ ฝุ่น PM2.5 และความชื้นของตำบลนั้น' },
      { title: 'ปิดการ์ด', desc: 'แตะปุ่มปิดที่การ์ด หรือแตะพื้นที่ว่างบนแผนที่เพื่อยกเลิกการเลือก' },
    ],
  },
];

function SectionCard({ section, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${section.color}25`, background: `${section.color}08` }}>
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left" onClick={onToggle}>
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
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: section.color }} />
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

export default function MapGuideModal({ onClose }) {
  const [openId, setOpenId] = useState('controls');

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
          style={{ background: 'linear-gradient(135deg,rgba(16,185,129,1),rgba(59,130,246,1))' }}>
          <div>
            <p className="text-white font-black text-base leading-none">คู่มือหน้าแผนที่</p>
            <p className="text-blue-100 text-[11px] mt-0.5">วิธีใช้งานแผนที่แบบละเอียด</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <FaTimes size={13} color="white" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-4 space-y-2.5" style={{ maxHeight: 'calc(88dvh - 68px)' }}>
          <div className="rounded-2xl px-4 py-3 flex gap-3 items-start"
            style={{ background: 'linear-gradient(135deg,#ecfdf5,#dbeafe)', border: '1px solid #a7f3d0' }}>
            <span className="text-xl mt-0.5">🗺️</span>
            <div>
              <p className="text-xs font-bold text-emerald-800">ยินดีต้อนรับสู่หน้าแผนที่</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                แตะหัวข้อด้านล่างเพื่อดูรายละเอียดแต่ละส่วน เปิดดูภายหลังได้จากปุ่ม ? มุมล่างขวา
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

          <div className="text-center pt-2 pb-1">
            <p className="text-[10px] text-slate-400">KKMap Heat · ระบบติดตามสภาพอากาศขอนแก่น</p>
          </div>
        </div>
      </div>
    </div>
  );
}
