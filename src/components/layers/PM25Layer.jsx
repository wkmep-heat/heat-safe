import { CircleMarker, Tooltip } from 'react-leaflet';
import { getPM25Color, getPM25Level } from '../../data/mockData';

export default function PM25Layer({ districts, onDistrictClick, selectedId, opacity = 1 }) {
  return (
    <>
      {districts.map((district) => {
        const color = getPM25Color(district.pm25);
        const level = getPM25Level(district.pm25);
        const isSelected = selectedId === district.id;

        return (
          <CircleMarker
            key={district.id}
            center={[district.lat, district.lng]}
            radius={isSelected ? 22 : 18}
            pathOptions={{
              fillColor: color,
              fillOpacity: (isSelected ? 0.95 : 0.78) * opacity,
              color: isSelected ? '#fff' : color,
              weight: isSelected ? 2.5 : 1.2,
              opacity,
            }}
            eventHandlers={{ click: () => onDistrictClick(district) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              className="custom-tooltip"
            >
              <div className="font-medium">{district.name}</div>
              <div style={{ color }}>
                PM2.5: <strong>{district.pm25} AQI</strong>
              </div>
              <div style={{ color: level.color, fontSize: '12px', fontWeight: 600 }}>
                คุณภาพอากาศ: {level.label}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
