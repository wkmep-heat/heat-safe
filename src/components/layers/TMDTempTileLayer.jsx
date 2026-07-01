import { TileLayer } from 'react-leaflet';

export default function TMDTempTileLayer({ datetime, opacity = 0.72 }) {
  return (
    <TileLayer
      key={datetime}
      url={`https://wxmap.tmd.go.th/api/fcst/tiled/${datetime}/t2m/{z}/{x}/{y}/`}
      attribution='&copy; <a href="https://www.tmd.go.th" target="_blank">กรมอุตุนิยมวิทยา (TMD)</a>'
      opacity={opacity}
      zIndex={300}
    />
  );
}
