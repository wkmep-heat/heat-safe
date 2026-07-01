import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function StreamLayer({ opacity = 1, basemap = 'satellite' }) {
  const map = useMap();
  const layerRef = useRef(null);
  const color  = basemap === 'dem' ? '#1d4ed8' : '#38bdf8';
  const weight = basemap === 'dem' ? 2.5 : 2;

  useEffect(() => {
    let cancelled = false;

    fetch('/geo.geojson')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const layer = L.geoJSON(data, {
          style: {
            color,
            weight,
            opacity,
            fillOpacity: 0,
            lineCap: 'round',
            lineJoin: 'round',
          },
          onEachFeature: (feature, l) => {
            const name = feature.properties?.Name;
            const desc = feature.properties?.descriptio;
            if (name || desc) {
              l.bindTooltip(
                `<b>${desc ?? 'ร่องน้ำ'}</b><br/>${name ? `พื้นที่: ${name}` : ''}`,
                { sticky: true }
              );
            }
          },
        });
        layer.addTo(map);
        layerRef.current = layer;
      })
      .catch(err => console.error('StreamLayer fetch error:', err));

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, color, weight]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setStyle({ color, weight, opacity, fillOpacity: 0 });
    }
  }, [opacity, color, weight]);

  return null;
}
