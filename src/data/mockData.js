// ขอบเขตข้อมูลอำเภอเมืองขอนแก่น (ครอบคลุมทั้ง 17 ตำบล)
export const KK_BOUNDS = [
  [16.24, 102.64], // SW
  [16.66, 103.00], // NE
];

// ขอบเขตแผนที่สำหรับ navigation ทั่วประเทศไทย
export const THAILAND_BOUNDS = [
  [5.5, 97.5],    // SW
  [20.5, 105.7],  // NE
];

export const KK_CENTER = [16.445, 102.820];
export const KK_DEFAULT_ZOOM = 11;

// ข้อมูลจำลอง 26 อำเภอ จังหวัดขอนแก่น (เก็บไว้สำหรับ reference)
export const districts = [
  { id: 1, name: "เมืองขอนแก่น", lat: 16.4419, lng: 102.8359, temperature: 37, pm25: 58, heatValue: 0.92, humidity: 62, windSpeed: 7, type: "urban" },
  { id: 2, name: "บ้านฝาง", lat: 16.6289, lng: 102.7322, temperature: 33, pm25: 22, heatValue: 0.38, humidity: 71, windSpeed: 13, type: "rural" },
  { id: 3, name: "พระยืน", lat: 16.3411, lng: 102.9208, temperature: 34, pm25: 35, heatValue: 0.50, humidity: 68, windSpeed: 10, type: "rural" },
  { id: 4, name: "หนองเรือ", lat: 16.7892, lng: 102.7847, temperature: 32, pm25: 18, heatValue: 0.28, humidity: 76, windSpeed: 15, type: "rural" },
  { id: 5, name: "ชุมแพ", lat: 16.5431, lng: 102.1011, temperature: 35, pm25: 55, heatValue: 0.72, humidity: 64, windSpeed: 9, type: "semi-urban" },
  { id: 6, name: "สีชมพู", lat: 16.6936, lng: 101.9561, temperature: 29, pm25: 15, heatValue: 0.20, humidity: 80, windSpeed: 17, type: "rural" },
  { id: 7, name: "น้ำพอง", lat: 16.7294, lng: 102.8339, temperature: 34, pm25: 48, heatValue: 0.68, humidity: 65, windSpeed: 11, type: "industrial" },
  { id: 8, name: "อุบลรัตน์", lat: 16.7847, lng: 102.7603, temperature: 33, pm25: 28, heatValue: 0.42, humidity: 73, windSpeed: 12, type: "rural" },
  { id: 9, name: "กระนวน", lat: 16.6578, lng: 103.0917, temperature: 35, pm25: 40, heatValue: 0.56, humidity: 67, windSpeed: 10, type: "semi-urban" },
  { id: 10, name: "บ้านไผ่", lat: 16.0631, lng: 102.7247, temperature: 36, pm25: 62, heatValue: 0.78, humidity: 60, windSpeed: 8, type: "semi-urban" },
  { id: 11, name: "เปือยน้อย", lat: 16.0947, lng: 102.5550, temperature: 33, pm25: 30, heatValue: 0.40, humidity: 70, windSpeed: 12, type: "rural" },
  { id: 12, name: "พล", lat: 15.9767, lng: 102.6183, temperature: 35, pm25: 48, heatValue: 0.62, humidity: 65, windSpeed: 9, type: "semi-urban" },
  { id: 13, name: "แวงใหญ่", lat: 16.1597, lng: 103.0825, temperature: 34, pm25: 38, heatValue: 0.52, humidity: 68, windSpeed: 11, type: "rural" },
  { id: 14, name: "แวงน้อย", lat: 15.9161, lng: 103.0719, temperature: 33, pm25: 32, heatValue: 0.45, humidity: 70, windSpeed: 12, type: "rural" },
  { id: 15, name: "หนองสองห้อง", lat: 15.8317, lng: 102.8408, temperature: 35, pm25: 50, heatValue: 0.66, humidity: 64, windSpeed: 9, type: "semi-urban" },
  { id: 16, name: "ภูเวียง", lat: 16.3931, lng: 102.4239, temperature: 31, pm25: 20, heatValue: 0.30, humidity: 75, windSpeed: 14, type: "rural" },
  { id: 17, name: "มัญจาคีรี", lat: 16.1019, lng: 102.1950, temperature: 30, pm25: 18, heatValue: 0.25, humidity: 77, windSpeed: 15, type: "rural" },
  { id: 18, name: "ชนบท", lat: 16.1844, lng: 102.6017, temperature: 34, pm25: 42, heatValue: 0.55, humidity: 67, windSpeed: 10, type: "rural" },
  { id: 19, name: "เขาสวนกวาง", lat: 16.8608, lng: 102.6464, temperature: 31, pm25: 16, heatValue: 0.22, humidity: 78, windSpeed: 16, type: "rural" },
  { id: 20, name: "ภูผาม่าน", lat: 16.3964, lng: 101.8769, temperature: 28, pm25: 12, heatValue: 0.15, humidity: 82, windSpeed: 18, type: "rural" },
  { id: 21, name: "ซำสูง", lat: 16.6289, lng: 102.9575, temperature: 34, pm25: 35, heatValue: 0.48, humidity: 68, windSpeed: 11, type: "rural" },
  { id: 22, name: "โคกโพธิ์ไชย", lat: 16.0289, lng: 102.5058, temperature: 35, pm25: 44, heatValue: 0.58, humidity: 66, windSpeed: 10, type: "rural" },
  { id: 23, name: "หนองนาคำ", lat: 16.6492, lng: 102.5611, temperature: 33, pm25: 25, heatValue: 0.35, humidity: 72, windSpeed: 13, type: "rural" },
  { id: 24, name: "บ้านแฮด", lat: 16.2531, lng: 102.9375, temperature: 35, pm25: 40, heatValue: 0.55, humidity: 66, windSpeed: 10, type: "rural" },
  { id: 25, name: "โนนศิลา", lat: 16.1319, lng: 103.0558, temperature: 34, pm25: 36, heatValue: 0.50, humidity: 68, windSpeed: 11, type: "rural" },
  { id: 26, name: "เวียงเก่า", lat: 16.5981, lng: 102.0439, temperature: 30, pm25: 18, heatValue: 0.26, humidity: 76, windSpeed: 15, type: "rural" },
];

// ข้อมูลจำลองรายตำบล อำเภอเมืองขอนแก่น (พิกัดจริง)
export const tambons = [
  { id: 1,  name: 'ในเมือง',   lat: 16.4322, lng: 102.8236, temperature: 39, pm25: 72, heatValue: 0.95, humidity: 51, windSpeed: 7,  type: 'urban' },
  { id: 2,  name: 'ศิลา',      lat: 16.4912, lng: 102.8361, temperature: 36, pm25: 46, heatValue: 0.68, humidity: 60, windSpeed: 11, type: 'semi-urban' },
  { id: 3,  name: 'บ้านเป็ด',  lat: 16.4373, lng: 102.7681, temperature: 36, pm25: 44, heatValue: 0.65, humidity: 61, windSpeed: 12, type: 'semi-urban' },
  { id: 4,  name: 'เมืองเก่า', lat: 16.3934, lng: 102.8165, temperature: 38, pm25: 65, heatValue: 0.88, humidity: 53, windSpeed: 8,  type: 'semi-urban' },
  { id: 5,  name: 'พระลับ',    lat: 16.4168, lng: 102.8794, temperature: 36, pm25: 50, heatValue: 0.72, humidity: 59, windSpeed: 10, type: 'rural' },
  { id: 6,  name: 'ท่าพระ',    lat: 16.3345, lng: 102.8084, temperature: 37, pm25: 55, heatValue: 0.79, humidity: 56, windSpeed: 9,  type: 'semi-urban' },
  { id: 7,  name: 'บ้านทุ่ม',  lat: 16.4447, lng: 102.6931, temperature: 35, pm25: 40, heatValue: 0.62, humidity: 63, windSpeed: 13, type: 'rural' },
  { id: 8,  name: 'สำราญ',     lat: 16.5358, lng: 102.8412, temperature: 35, pm25: 38, heatValue: 0.60, humidity: 63, windSpeed: 12, type: 'rural' },
  { id: 9,  name: 'โคกสี',     lat: 16.4735, lng: 102.9468, temperature: 36, pm25: 48, heatValue: 0.70, humidity: 60, windSpeed: 11, type: 'rural' },
  { id: 10, name: 'หนองตูม',   lat: 16.5621, lng: 102.9324, temperature: 35, pm25: 42, heatValue: 0.63, humidity: 62, windSpeed: 12, type: 'rural' },
  { id: 11, name: 'บึงเนียม',  lat: 16.4361, lng: 102.9372, temperature: 36, pm25: 49, heatValue: 0.71, humidity: 59, windSpeed: 10, type: 'rural' },
  { id: 12, name: 'โนนท่อน',   lat: 16.6084, lng: 102.8041, temperature: 34, pm25: 35, heatValue: 0.55, humidity: 65, windSpeed: 14, type: 'rural' },
  { id: 13, name: 'บ้านค้อ',   lat: 16.5412, lng: 102.7534, temperature: 35, pm25: 41, heatValue: 0.64, humidity: 62, windSpeed: 12, type: 'rural' },
  { id: 14, name: 'แดงใหญ่',   lat: 16.4744, lng: 102.7212, temperature: 35, pm25: 40, heatValue: 0.63, humidity: 62, windSpeed: 13, type: 'rural' },
  { id: 15, name: 'ดอนช้าง',   lat: 16.3314, lng: 102.7315, temperature: 37, pm25: 52, heatValue: 0.76, humidity: 57, windSpeed: 10, type: 'rural' },
  { id: 16, name: 'ดอนหัน',    lat: 16.2984, lng: 102.7712, temperature: 37, pm25: 54, heatValue: 0.77, humidity: 56, windSpeed: 9,  type: 'rural' },
  { id: 17, name: 'บ้านหว้า',  lat: 16.3681, lng: 102.7415, temperature: 36, pm25: 46, heatValue: 0.68, humidity: 61, windSpeed: 11, type: 'rural' },
];

// จุดความร้อนสูงในอำเภอเมืองขอนแก่น
export const hotspots = [
  { id: 1, lat: 16.437, lng: 102.835, temperature: 44, intensity: 'extreme', description: 'ตลาดกลางเมือง' },
  { id: 2, lat: 16.430, lng: 102.828, temperature: 43, intensity: 'extreme', description: 'ย่านพาณิชยกรรม' },
  { id: 3, lat: 16.445, lng: 102.841, temperature: 42, intensity: 'high',    description: 'ย่านธุรกิจกลางเมือง' },
  { id: 4, lat: 16.466, lng: 102.784, temperature: 41, intensity: 'high',    description: 'บริเวณสนามบินนานาชาติ' },
  { id: 5, lat: 16.391, lng: 102.875, temperature: 41, intensity: 'high',    description: 'เขตอุตสาหกรรม' },
  { id: 6, lat: 16.413, lng: 102.809, temperature: 42, intensity: 'high',    description: 'เมืองเก่า (ความหนาแน่นสูง)' },
  { id: 7, lat: 16.453, lng: 102.852, temperature: 40, intensity: 'high',    description: 'ชุมชนดอนช้าง' },
];

// ฟังก์ชันสีอุณหภูมิ
export const getTemperatureColor = (temp) => {
  if (temp < 25) return '#60A5FA';
  if (temp < 28) return '#34D399';
  if (temp < 32) return '#FDE047';
  if (temp < 36) return '#FB923C';
  return '#EF4444';
};

// ฟังก์ชันสีฝุ่น PM2.5
export const getPM25Color = (pm25) => {
  if (pm25 < 25) return '#22C55E';
  if (pm25 < 50) return '#A3E635';
  if (pm25 < 75) return '#FBBF24';
  if (pm25 < 100) return '#F97316';
  return '#EF4444';
};

// ฟังก์ชันสีการสะสมความร้อน
export const getHeatColor = (value) => {
  if (value < 0.2) return '#60A5FA';
  if (value < 0.4) return '#34D399';
  if (value < 0.6) return '#FBBF24';
  if (value < 0.8) return '#F97316';
  return '#EF4444';
};

// ระดับ PM2.5
export const getPM25Level = (pm25) => {
  if (pm25 < 25) return { label: 'ดีมาก', color: '#22C55E' };
  if (pm25 < 50) return { label: 'ดี', color: '#A3E635' };
  if (pm25 < 75) return { label: 'ปานกลาง', color: '#FBBF24' };
  if (pm25 < 100) return { label: 'เริ่มมีผลต่อสุขภาพ', color: '#F97316' };
  return { label: 'มีผลต่อสุขภาพ', color: '#EF4444' };
};

// ระดับการสะสมความร้อน
export const getHeatLevel = (value) => {
  if (value < 0.2) return { label: 'ต่ำมาก', color: '#60A5FA' };
  if (value < 0.4) return { label: 'ต่ำ', color: '#34D399' };
  if (value < 0.6) return { label: 'ปานกลาง', color: '#FBBF24' };
  if (value < 0.8) return { label: 'สูง', color: '#F97316' };
  return { label: 'สูงมาก', color: '#EF4444' };
};

// ข้อมูลคำอธิบายแต่ละเลเยอร์
export const layerInfo = {
  temperature: {
    id: 'temperature',
    name: 'อุณหภูมิ',
    description: 'อุณหภูมิอากาศรายตำบลในเขตอำเภอเมืองขอนแก่น ข้อมูลจากสถานีวัดอากาศ อัปเดตทุก 1 ชั่วโมง',
    unit: '°C',
    legend: [
      { color: '#60A5FA', label: '< 25°C', desc: 'เย็น' },
      { color: '#34D399', label: '25–28°C', desc: 'สบาย' },
      { color: '#FDE047', label: '28–32°C', desc: 'อุ่น' },
      { color: '#FB923C', label: '32–36°C', desc: 'ร้อน' },
      { color: '#EF4444', label: '> 36°C', desc: 'ร้อนมาก' },
    ],
  },
  pm25: {
    id: 'pm25',
    name: 'ฝุ่น PM2.5',
    description: 'ระดับความเข้มข้นของฝุ่นละออง PM2.5 วัดในหน่วย AQI แยกตามตำบลในอำเภอเมืองขอนแก่น',
    unit: 'AQI',
    legend: [
      { color: '#22C55E', label: '0–25', desc: 'ดีมาก' },
      { color: '#A3E635', label: '26–50', desc: 'ดี' },
      { color: '#FBBF24', label: '51–75', desc: 'ปานกลาง' },
      { color: '#F97316', label: '76–100', desc: 'เริ่มมีผลต่อสุขภาพ' },
      { color: '#EF4444', label: '> 100', desc: 'มีผลต่อสุขภาพ' },
    ],
  },
  heat: {
    id: 'heat',
    name: 'การสะสมความร้อน',
    description: 'การกระจายและสะสมความร้อนในแต่ละตำบล วิเคราะห์จากความหนาแน่น สิ่งปลูกสร้าง และกิจกรรมในพื้นที่',
    unit: 'ระดับ',
    legend: [
      { color: '#60A5FA', label: 'ต่ำมาก', desc: '< 20%' },
      { color: '#34D399', label: 'ต่ำ', desc: '20–40%' },
      { color: '#FBBF24', label: 'ปานกลาง', desc: '40–60%' },
      { color: '#F97316', label: 'สูง', desc: '60–80%' },
      { color: '#EF4444', label: 'สูงมาก', desc: '> 80%' },
    ],
  },
  stream: {
    id: 'stream',
    name: 'ร่องน้ำ',
    description: 'เส้นทางร่องน้ำและลำน้ำในเขตอำเภอเมืองขอนแก่น ข้อมูลจากไฟล์ GeoJSON',
    unit: 'เส้น',
    legend: [
      { color: '#38bdf8', label: 'ร่องน้ำ / ลำน้ำ', desc: 'Stream' },
    ],
  },
  monthly_temp: {
    id: 'monthly_temp',
    name: 'อุณหภูมิพื้นผิวรายเดือน',
    description: 'อุณหภูมิพื้นผิวดิน (Land Surface Temperature) เฉลี่ยรายเดือน จากดาวเทียม MODIS Terra ของ NASA ความละเอียด 1 กม.',
    unit: '°C',
    legend: [
      { color: '#313695', label: 'เย็นมาก', desc: '< 7°C' },
      { color: '#4575b4', label: 'เย็น', desc: '7–22°C' },
      { color: '#fee090', label: 'ปานกลาง', desc: '22–32°C' },
      { color: '#f46d43', label: 'ร้อน', desc: '32–42°C' },
      { color: '#a50026', label: 'ร้อนมาก', desc: '> 42°C' },
    ],
  },
  hotspot: {
    id: 'hotspot',
    name: 'จุดความร้อนสูง',
    description: 'จุดพื้นที่ที่มีอุณหภูมิสูงผิดปกติในอำเภอเมืองขอนแก่น เกิดจาก Urban Heat Island ย่านพาณิชยกรรม และโรงงาน',
    unit: '°C',
    legend: [
      { color: '#FF3300', label: '> 43°C', desc: 'วิกฤต' },
      { color: '#FF7700', label: '40–43°C', desc: 'สูงมาก' },
    ],
  },
  himawari: {
    id: 'himawari',
    name: 'ภาพ Himawari-9 AHI',
    description: 'ภาพถ่ายดาวเทียม Himawari-9 จาก NASA GIBS แสดงเมฆและสภาพอากาศแบบ Real-time อัพเดตทุก 10 นาที สามารถเลือกดูได้ 3 band: แสงที่มองเห็น, อินฟราเรด, และไอน้ำ',
    unit: 'band',
    legend: [
      { color: '#87ceeb', label: 'แสงที่มองเห็น', desc: '1 km/px' },
      { color: '#ff6b35', label: 'อินฟราเรด',    desc: '2 km/px' },
      { color: '#4299e1', label: 'ไอน้ำ',         desc: '2 km/px' },
    ],
  },
};
