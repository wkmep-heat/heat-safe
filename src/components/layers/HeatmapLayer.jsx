import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// จุดข้อมูล [lat, lng, intensity 0-1]
// intensity = ระดับความเสี่ยงความร้อน / 5
const HEAT_POINTS = [
  [16.4503, 102.8420, 1.00],  // ตลาดจอมพล           — high 4.6
  [16.4295, 102.8346, 0.95],  // ตลาดบางลำภู          — high 4.5
  [16.4151, 102.8196, 1.00],  // ตลาดศรีเมืองทอง      — high 5.0
  [16.4132, 102.8315, 0.60],  // ร.ร.เทศบาลวัดกลาง   — mid 3.2
  [16.4423, 102.8360, 0.58],  // ศาลากลางจังหวัด      — mid 3.0
  [16.4297, 102.8297, 0.62],  // สำนักงานเทศบาล       — mid 3.3
  [16.4171, 102.8351, 0.18],  // บึงแก่นนคร           — low 1.2
  [16.4515, 102.8556, 0.20],  // บึงทุ่งสร้าง         — low 1.3
  [16.4200, 102.8386, 0.28],  // สวนสาธารณะ 200 ปี   — low 2.0
  // จุดเสี่ยงน้ำท่วม (ความเสี่ยงปานกลาง)
  [16.4400, 102.8330, 0.55],  // ทางลอดถนนมิตรภาพ
  [16.4300, 102.8120, 0.50],  // ถนนศรีจันทร์
];

export default function HeatmapLayer({ opacity = 0.75 }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!L.heatLayer) return;

    layerRef.current = L.heatLayer(HEAT_POINTS, {
      radius: 55,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.65,
      gradient: {
        0.0:  '#2c7bb6',
        0.2:  '#1a9aa8',
        0.4:  '#74c476',
        0.6:  '#f6c945',
        0.75: '#f08a24',
        1.0:  '#d7191c',
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOptions({ opacity });
    }
  }, [opacity]);

  return null;
}
