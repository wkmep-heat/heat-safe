import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SUGGESTED_PARKS } from '../../data/suggestedParkData';

const icon = L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:#f0fdf4;border:2.5px dashed #16a34a;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:16px;">🌿</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function SuggestedParkLayer() {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.layerGroup();
    SUGGESTED_PARKS.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon });
      m.bindTooltip(`พื้นที่แนะนำสวนสาธารณะ #${p.id}`, { direction: 'top', offset: [0, -15] });
      lyr.addLayer(m);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map]);

  return null;
}
