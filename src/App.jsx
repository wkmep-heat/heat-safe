import { useState, useCallback, useEffect } from 'react';
import { KK_CENTER, KK_DEFAULT_ZOOM } from './data/mockData';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import SimulationView from './components/SimulationView';
import RiskAreasView from './components/RiskAreasView';
import CommunityView from './components/CommunityView';
import ForecastTimePicker, { toApiStr } from './components/ForecastTimePicker';
import MonthPicker from './components/MonthPicker';
import { useRealtimeWeather } from './hooks/useRealtimeWeather';
import { useTMDWeather } from './hooks/useTMDWeather';
import { useAutoNotify } from './hooks/useAutoNotify';
import AdminView from './components/AdminView';
import ReportView from './components/ReportView';
import TrackView from './components/TrackView';
import TravelTimeView from './components/TravelTimeView';
import WelcomePopup from './components/WelcomePopup';
import GuideModal from './components/GuideModal';
import MapGuideModal from './components/MapGuideModal';

export default function App() {
  const { tambons, forecast, dailyMax: omDailyMax, dailyMin: omDailyMin, status: weatherStatus, lastUpdated, refresh: refreshWeather } = useRealtimeWeather();
  const { data: tmdData } = useTMDWeather();
  const { needsBanner, requestNow } = useAutoNotify();

  // Special routes via URL query params
  const [isAdmin]       = useState(() => new URLSearchParams(window.location.search).has('admin'));
  const [isReport]      = useState(() => new URLSearchParams(window.location.search).has('report'));
  const [isTrack]       = useState(() => new URLSearchParams(window.location.search).has('track'));
  const [isTravelTime]  = useState(() => new URLSearchParams(window.location.search).has('traveltime'));
  const [isMap]         = useState(() => new URLSearchParams(window.location.search).has('map'));

  useEffect(() => {
    if (isMap) document.title = 'Smart Map';
  }, [isMap]);
  const [activeTab, setActiveTab] = useState('home');
  const [activeLayers, setActiveLayers] = useState(new Set());
  const [infoLayer, setInfoLayer] = useState('temperature');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [layerSettings, setLayerSettings] = useState({
    temperature:  { visible: true, opacity: 0.75 },
    pm25:         { visible: true, opacity: 0.78 },
    heat:         { visible: true, opacity: 0.78 },
    stream:       { visible: true, opacity: 0.85 },
    monthly_temp: { visible: true, opacity: 0.80 },
    hotspot:         { visible: true, opacity: 0.90 },
    himawari:        { visible: true, opacity: 0.85 },
    kmz_road_detail:   { visible: true, opacity: 0.80 },
    kmz_road_main:     { visible: true, opacity: 0.85 },
    kmz_school:        { visible: true, opacity: 0.90 },
    kmz_village:       { visible: true, opacity: 0.85 },
    building_density:  { visible: true, opacity: 0.75 },
    old_buildings:     { visible: true, opacity: 0.80 },
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const updateLayerSetting = useCallback((id, key, value) => {
    setLayerSettings(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }, []);
  const [forecastDatetime, setForecastDatetime] = useState(() => {
    const now = new Date();
    const h = Math.floor(now.getUTCHours() / 3) * 3;
    return toApiStr(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h)));
  });

  const [mapPosition, setMapPosition] = useState({ center: KK_CENTER, zoom: KK_DEFAULT_ZOOM });
  const handleMapMove = useCallback((center, zoom) => setMapPosition({ center, zoom }), []);

  const [basemap, setBasemap] = useState('street');
  const [heatRiskFilter, setHeatRiskFilter] = useState('all');
  const [reportHeatView, setReportHeatView] = useState({ heatmap: true, pins: true });
  const toggleReportHeatView = useCallback((key) => {
    setReportHeatView(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [mapPin, setMapPin] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleLayerToggle = useCallback((id) => {
    const beingAdded = !activeLayers.has(id);
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // heatmap เปิด/ปิดพร้อมกับ heatrisk เสมอ
      if (id === 'heatrisk') {
        if (next.has('heatrisk')) next.add('heatmap'); else next.delete('heatmap');
      }
      return next;
    });
    setInfoLayer(id);
    if (id === 'himawari' && beingAdded) {
      setFlyToTarget({ lat: 15.0, lng: 101.0, zoom: 6, ts: Date.now() });
    }
  }, [activeLayers]);
  const handleFlyTo = useCallback(({ lat, lng }) => setFlyToTarget({ lat, lng, ts: Date.now() }), []);
  const handleMapClick = useCallback(() => setSelectedDistrict(null), []);
  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(district);
    if (district) { setSearchQuery(''); setFlyToTarget({ lat: district.lat, lng: district.lng, ts: Date.now() }); }
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'map') setSidebarOpen(true);
  }, []);

  const onMap = !isAdmin && !isReport && activeTab === 'map';

  const [showMapGuide, setShowMapGuide] = useState(false);
  useEffect(() => {
    if (!isMap && !onMap) return;
    const key = 'map_guide_shown';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const t = setTimeout(() => setShowMapGuide(true), 500);
    return () => clearTimeout(t);
  }, [isMap, onMap]);

  if (isReport)     return <ReportView />;
  if (isTrack)      return <TrackView />;
  if (isTravelTime) return <TravelTimeView />;
  if (isMap) return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh', '--nav-bottom': 'env(safe-area-inset-bottom, 0px)', '--nav-x': '0px' }}>
      <div className="absolute right-0" style={{ top: 0, left: 'var(--nav-x)', bottom: 0 }}>
        <MapView
          activeLayers={activeLayers}
          tambons={tambons}
          selectedDistrict={selectedDistrict}
          onDistrictClick={handleDistrictSelect}
          onMapClick={handleMapClick}
          forecastDatetime={forecastDatetime}
          layerSettings={layerSettings}
          selectedMonth={selectedMonth}
          flyToTarget={flyToTarget}
          initialCenter={mapPosition.center}
          initialZoom={mapPosition.zoom}
          onMapMove={handleMapMove}
          mapPin={mapPin}
          basemap={basemap}
          onBasemapChange={setBasemap}
          heatRiskFilter={heatRiskFilter}
          reportHeatView={reportHeatView}
        />
      </div>
      <Sidebar
        activeLayers={activeLayers}
        infoLayer={infoLayer}
        onLayerToggle={handleLayerToggle}
        tambons={tambons}
        weatherStatus={weatherStatus}
        lastUpdated={lastUpdated}
        onRefreshWeather={refreshWeather}
        onFlyTo={handleFlyTo}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={handleDistrictSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        layerSettings={layerSettings}
        onLayerSettingChange={updateLayerSetting}
        heatRiskFilter={heatRiskFilter}
        onHeatRiskFilterChange={setHeatRiskFilter}
        reportHeatView={reportHeatView}
        onReportHeatViewChange={toggleReportHeatView}
      />
      {activeLayers.has('temperature') && (
        <ForecastTimePicker datetime={forecastDatetime} onChange={setForecastDatetime} sidebarOpen={sidebarOpen} />
      )}
      {activeLayers.has('monthly_temp') && (
        <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} sidebarOpen={sidebarOpen} />
      )}
      {showMapGuide && <MapGuideModal onClose={() => setShowMapGuide(false)} />}
      <button
        onClick={() => setShowMapGuide(true)}
        className="fixed z-[1000] flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          right: '14px',
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg,#10b981,#3b82f6)',
          boxShadow: '0 4px 16px rgba(16,185,129,0.45)',
        }}
        title="คู่มือหน้าแผนที่"
      >
        <span className="text-white font-black text-base leading-none select-none">?</span>
      </button>
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden bg-[#f8faff]"
      style={{ height: '100dvh' }}>

      {/* ── Map tab ── */}
      {onMap && (
        <>
          {/* Map area: offset left for desktop rail, bottom for mobile bar */}
          <div className="absolute right-0"
            style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)' }}>
            <MapView
              activeLayers={activeLayers}
              tambons={tambons}
              selectedDistrict={selectedDistrict}
              onDistrictClick={handleDistrictSelect}
              onMapClick={handleMapClick}
              forecastDatetime={forecastDatetime}
              layerSettings={layerSettings}
              selectedMonth={selectedMonth}
              flyToTarget={flyToTarget}
              initialCenter={mapPosition.center}
              initialZoom={mapPosition.zoom}
              onMapMove={handleMapMove}
              mapPin={mapPin}
              basemap={basemap}
              onBasemapChange={setBasemap}
              heatRiskFilter={heatRiskFilter}
              reportHeatView={reportHeatView}
            />
          </div>
          <Sidebar
            activeLayers={activeLayers}
            infoLayer={infoLayer}
            onLayerToggle={handleLayerToggle}
            tambons={tambons}
            weatherStatus={weatherStatus}
            lastUpdated={lastUpdated}
            onRefreshWeather={refreshWeather}
            onFlyTo={handleFlyTo}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={handleDistrictSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
            layerSettings={layerSettings}
            onLayerSettingChange={updateLayerSetting}
            heatRiskFilter={heatRiskFilter}
            onHeatRiskFilterChange={setHeatRiskFilter}
            reportHeatView={reportHeatView}
            onReportHeatViewChange={toggleReportHeatView}
          />
          {activeLayers.has('temperature') && (
            <ForecastTimePicker datetime={forecastDatetime} onChange={setForecastDatetime} sidebarOpen={sidebarOpen} />
          )}
          {activeLayers.has('monthly_temp') && (
            <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} sidebarOpen={sidebarOpen} />
          )}
          {showMapGuide && <MapGuideModal onClose={() => setShowMapGuide(false)} />}
        </>
      )}

      {/* ── Home tab ── */}
      {!isAdmin && activeTab === 'home' && (
        <HomeView
          tambons={tambons}
          forecast={forecast}
          weatherStatus={weatherStatus}
          lastUpdated={lastUpdated}
          onRefresh={refreshWeather}
          tmdTempMax={tmdData?.tempMax ?? omDailyMax}
          tmdTempMin={tmdData?.tempMin ?? omDailyMin}
          tmdData={tmdData}
          needsNotifyBanner={needsBanner}
          onEnableNotify={requestNow}
          onTambonClick={(tambon) => {
            setFlyToTarget({ lat: tambon.lat, lng: tambon.lng, ts: Date.now() });
            setSelectedDistrict(tambon);
            setMapPin({ name: `ต.${tambon.name}`, lat: tambon.lat, lng: tambon.lng, temperature: tambon.temperature, humidity: tambon.humidity, wind: tambon.windSpeed });
            setSidebarOpen(true);
            setActiveTab('map');
          }}
        />
      )}

      {/* ── Simulation tab ── */}
      {!isAdmin && activeTab === 'simulation' && <SimulationView />}

      {/* ── Risk Areas tab ── */}
      {!isAdmin && activeTab === 'risk-areas' && (
        <RiskAreasView
          tambons={tambons}
          onLocationClick={({ lat, lng, name, temperature, humidity, wind }) => {
            setFlyToTarget({ lat, lng, ts: Date.now() });
            setMapPin({ name, lat, lng, temperature, humidity, wind });
            setSidebarOpen(true);
            setActiveTab('map');
          }}
        />
      )}


      {/* ── Travel Time tab ── */}
      {!isAdmin && activeTab === 'traveltime' && (
        <div className="absolute" style={{ top: 0, left: 'var(--nav-x)', right: 0, bottom: 0 }}>
          <TravelTimeView />
        </div>
      )}

      {/* ── Admin (hidden route via ?admin in URL) ── */}
      {isAdmin && <AdminView />}

      {/* ── Welcome popup ── */}
      {!isAdmin && <WelcomePopup tmdData={tmdData} tambons={tambons} forecast={forecast} />}

      {/* ── Guide modal ── */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {/* ── Help button ── */}
      {!isAdmin && activeTab !== 'traveltime' && (
        <button
          onClick={() => onMap ? setShowMapGuide(true) : setShowGuide(true)}
          className="fixed z-[1000] flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{
            bottom: 'calc(52px + env(safe-area-inset-bottom, 0px) + 12px)',
            right: '14px',
            width: '36px',
            height: '36px',
            background: onMap ? 'linear-gradient(135deg,#10b981,#3b82f6)' : 'linear-gradient(135deg,#6366f1,#3b82f6)',
            boxShadow: onMap ? '0 4px 16px rgba(16,185,129,0.45)' : '0 4px 16px rgba(99,102,241,0.45)',
          }}
          title={onMap ? 'คู่มือหน้าแผนที่' : 'คู่มือการใช้งาน'}
        >
          <span className="text-white font-black text-base leading-none select-none">?</span>
        </button>
      )}

      {/* ── Bottom nav (hidden in admin mode) ── */}
      {!isAdmin && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
}
