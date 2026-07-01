import { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const COL = { high: '#d7191c', mid: '#f08a24', low: '#2c7bb6', flood: '#3858c6' };
const RTH = { high: 'เสี่ยงสูง', mid: 'เสี่ยงปานกลาง', low: 'จุดเย็น / เสี่ยงต่ำ' };

const HEAT = [
  { n: 'ตลาดจอมพล', la: 16.4503, lo: 102.8420, r: 'high', s: 4.6, t: 'ย่านการค้า/ตลาด',
    c: 'อาคารหนาแน่น พื้นคอนกรีต ร่มเงาน้อย จราจรหนา', a: 'เลี่ยงช่วงเที่ยง–บ่าย ดื่มน้ำบ่อย หาที่ร่มพัก' },
  { n: 'ตลาดบางลำภู', la: 16.4295, lo: 102.8346, r: 'high', s: 4.5, t: 'ย่านการค้า/ตลาด',
    c: 'ตลาดกลางเมือง พื้นแข็ง ต้นไม้น้อย', a: 'พกร่ม/หมวก สวมเสื้อระบายอากาศ' },
  { n: 'ตลาดศรีเมืองทอง · ถนนมิตรภาพ', la: 16.4151, lo: 102.8196, r: 'high', s: 5.0, t: 'ถนนสายหลัก',
    c: 'จราจรหนาแน่นที่สุด ฝุ่นสูง และเสี่ยงน้ำท่วมขัง', a: 'เสี่ยงซ้ำซ้อน: ระวังทั้งร้อน ฝุ่น และน้ำท่วม' },
  { n: 'ร.ร.เทศบาลวัดกลาง', la: 16.4132, lo: 102.8315, r: 'mid', s: 3.2, t: 'โรงเรียน',
    c: 'อาคารเรียนและลานคอนกรีต มีต้นไม้บางส่วน', a: 'จัดกิจกรรมกลางแจ้งช่วงเช้า เพิ่มจุดร่มเงา' },
  { n: 'ศาลากลางจังหวัดขอนแก่น', la: 16.4423, lo: 102.8360, r: 'mid', s: 3.0, t: 'พื้นที่ราชการ',
    c: 'ลานและอาคารผิวแข็ง มีพื้นที่เปิดโล่ง', a: 'ปลูกไม้ยืนต้นเพิ่มร่มเงาบริเวณลานจอด' },
  { n: 'สำนักงานเทศบาลนครขอนแก่น', la: 16.4297, lo: 102.8297, r: 'mid', s: 3.3, t: 'พื้นที่ราชการ',
    c: 'ย่านราชการกลางเมือง การจราจรปานกลาง', a: 'ส่งเสริมหลังคา/ผิวสีอ่อนลดความร้อน' },
  { n: 'บึงแก่นนคร', la: 16.4171, lo: 102.8351, r: 'low', s: 1.2, t: 'แหล่งน้ำ + พื้นที่สีเขียว',
    c: 'แหล่งน้ำขนาดใหญ่และต้นไม้รอบบึง', a: 'จุดพักผ่อนคลายร้อน อุณหภูมิต่ำกว่าพื้นที่รอบ' },
  { n: 'บึงทุ่งสร้าง', la: 16.4515, lo: 102.8556, r: 'low', s: 1.3, t: 'แหล่งน้ำ + สวนสุขภาพ',
    c: 'แหล่งน้ำและพื้นที่สีเขียว ทำหน้าที่แก้มลิงด้วย', a: 'พื้นที่เย็นและช่วยรับน้ำในฤดูฝน' },
  { n: 'สวนสาธารณะ 200 ปี', la: 16.4200, lo: 102.8386, r: 'low', s: 2.0, t: 'พื้นที่สีเขียว',
    c: 'สวนริมบึงแก่นนคร ต้นไม้ให้ร่มเงา', a: 'ต้นแบบการเพิ่มพื้นที่สีเขียวเพื่อลดความร้อน' },
];

const FLOOD = [
  { n: 'ทางลอด/อุโมงค์ ถนนมิตรภาพ', la: 16.4400, lo: 102.8330,
    d: 'น้ำท่วมขังฉับพลันช่วงฝนตกหนัก ต้องสูบระบายลงบึง' },
  { n: 'ถนนศรีจันทร์ (รอยต่อบึงหนองโคตร)', la: 16.4300, lo: 102.8120,
    d: 'พื้นที่น้ำท่วมซ้ำซาก ระดับ 30–50 ซม. (รอยต่อ ทต.บ้านเป็ด)' },
];

function makeIcon(color, size = 16) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
  });
}

function HeatPopup({ p }) {
  return (
    <div style={{ fontFamily: 'Noto Sans Thai, Sarabun, sans-serif', width: '230px' }}>
      <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 700,
        padding: '3px 10px', borderRadius: '999px', color: '#fff',
        background: COL[p.r], marginBottom: '7px',
      }}>{RTH[p.r]}</span>
      <p style={{ fontWeight: 800, fontSize: '15px', margin: '0 0 2px', color: '#1c2530' }}>{p.n}</p>
      <p style={{ fontSize: '12px', color: '#5b6775', marginBottom: '9px' }}>{p.t}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: '12px', marginBottom: '8px' }}>
        <span style={{ color: '#5b6775' }}>ระดับเสี่ยง</span>
        <span style={{ fontWeight: 700, color: COL[p.r] }}>{RTH[p.r]} ({p.s}/5)</span>
        <span style={{ color: '#5b6775' }}>สาเหตุ</span>
        <span style={{ fontWeight: 500 }}>{p.c}</span>
      </div>
      <div style={{ background: '#f5f7fa', borderRadius: '9px', padding: '8px 10px', fontSize: '12px', lineHeight: 1.5 }}>
        <strong style={{ fontFamily: 'inherit' }}>คำแนะนำ:</strong> {p.a}
      </div>
    </div>
  );
}

function FloodPopup({ p }) {
  return (
    <div style={{ fontFamily: 'Noto Sans Thai, Sarabun, sans-serif', width: '220px' }}>
      <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 700,
        padding: '3px 10px', borderRadius: '999px', color: '#fff',
        background: COL.flood, marginBottom: '7px',
      }}>จุดเสี่ยงน้ำท่วม</span>
      <p style={{ fontWeight: 800, fontSize: '15px', margin: '0 0 6px', color: '#1c2530' }}>{p.n}</p>
      <div style={{ background: '#f5f7fa', borderRadius: '9px', padding: '8px 10px', fontSize: '12px', lineHeight: 1.5 }}>{p.d}</div>
    </div>
  );
}

export default function HeatRiskLayer({ filter = 'all', showFlood = true }) {
  return (
    <>
      {HEAT
        .filter(p => filter === 'all' || p.r === filter)
        .map(p => (
          <Marker
            key={p.n}
            position={[p.la, p.lo]}
            icon={makeIcon(COL[p.r], p.r === 'high' ? 20 : 16)}
          >
            <Popup maxWidth={250} autoPan={false}>
              <HeatPopup p={p} />
            </Popup>
          </Marker>
        ))}

      {showFlood && FLOOD.map(p => (
        <Marker
          key={p.n}
          position={[p.la, p.lo]}
          icon={makeIcon(COL.flood, 15)}
        >
          <Popup maxWidth={240} autoPan={false}>
            <FloodPopup p={p} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export { HEAT, FLOOD, COL, RTH };
