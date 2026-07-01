import { CircleMarker, Tooltip } from 'react-leaflet';
import { getTemperatureColor } from '../../data/mockData';

export default function TemperatureLayer({ districts, onDistrictClick, selectedId, opacity = 1 }) {
  return (
    <>
      {districts.map((district) => {
        const color = getTemperatureColor(district.temperature);
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
                อุณหภูมิ: <strong>{district.temperature}°C</strong>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                ความชื้น: {district.humidity}% | ลม: {district.windSpeed} กม./ชม.
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
