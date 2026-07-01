import { TileLayer, useMap } from 'react-leaflet';

export const HIMAWARI_BANDS = [
  {
    id:            'visible',
    label:         'แสงที่มองเห็น',
    gibsLayer:     'Himawari_AHI_Band3_Red_Visible_1km',
    tileMatrix:    'GoogleMapsCompatible_Level7',
    desc:          'Band 3 · 1 km',
    maxNativeZoom: 7,
  },
  {
    id:            'ir',
    label:         'อินฟราเรด',
    gibsLayer:     'Himawari_AHI_Band13_Clean_Infrared',
    tileMatrix:    'GoogleMapsCompatible_Level6',
    desc:          'IR 11µm · 2 km',
    maxNativeZoom: 6,
  },
  {
    id:            'airmass',
    label:         'Air Mass',
    gibsLayer:     'Himawari_AHI_Air_Mass',
    tileMatrix:    'GoogleMapsCompatible_Level6',
    desc:          'Air Mass RGB · 2 km',
    maxNativeZoom: 6,
  },
];

// Generate N frames ending at latest available time (~20 min lag)
export function generateFrames(count = 12) {
  const d = new Date(Date.now() - 20 * 60 * 1000);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(d.getTime() - (count - 1 - i) * 10 * 60 * 1000);
    return t.toISOString().slice(0, 19) + 'Z';
  });
}

export default function HimawariLayer({ band = 'visible', opacity = 0.9, time }) {
  const map = useMap();

  // Create custom pane synchronously — TileLayer.onAdd() needs the pane at mount time.
  if (!map.getPane('himawariPane')) {
    const pane = map.createPane('himawariPane');
    pane.style.zIndex        = '250';
    pane.style.pointerEvents = 'none';
  }

  const meta = HIMAWARI_BANDS.find(b => b.id === band) ?? HIMAWARI_BANDS[0];
  const url  = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${meta.gibsLayer}/default/${time}/${meta.tileMatrix}/{z}/{y}/{x}.png`;

  return (
    <TileLayer
      pane="himawariPane"
      className="himawari-frame"
      url={url}
      attribution="NASA GIBS · Himawari-9 AHI"
      opacity={opacity}
      maxNativeZoom={meta.maxNativeZoom}
      maxZoom={17}
    />
  );
}
