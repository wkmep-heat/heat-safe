import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function NASATempMonthlyLayer({ month, opacity = 0.75 }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = L.tileLayer.wms(
      'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
      {
        layers: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        TIME: `${month}-01T00:00:00Z`,
        opacity,
        attribution: '&copy; <a href="https://earthdata.nasa.gov/" target="_blank">NASA GIBS</a> | MODIS Terra LST Monthly',
        zIndex: 300,
      }
    );

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, month]);

  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  return null;
}
