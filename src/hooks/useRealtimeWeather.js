import { useState, useEffect, useCallback } from 'react';
import { tambons as baseTambons } from '../data/mockData';

const REFRESH_MS = 5 * 60 * 1000;
const KK_LAT = 16.445;
const KK_LNG = 102.820;

function heatFromTemp(temp) {
  return Math.min(1, Math.max(0, (temp - 28) / 15));
}

/* Bangkok local time string "YYYY-MM-DDTHH" for matching Open-Meteo hourly keys */
function bkkHourKey() {
  return new Date()
    .toLocaleString('sv', { timeZone: 'Asia/Bangkok' })
    .slice(0, 13)          // "YYYY-MM-DD HH"
    .replace(' ', 'T');    // "YYYY-MM-DDTHH"
}

export function useRealtimeWeather() {
  const [tambons,    setTambons]    = useState(baseTambons);
  const [forecast,   setForecast]   = useState([]);
  const [dailyMax,   setDailyMax]   = useState(null);
  const [dailyMin,   setDailyMin]   = useState(null);
  const [status,     setStatus]     = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setStatus(prev => prev === 'ok' ? 'refreshing' : 'loading');
    try {
      const lats = baseTambons.map(t => t.lat).join(',');
      const lngs = baseTambons.map(t => t.lng).join(',');

      /* ── 1. Current weather for all tambons ── */
      const wxPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
        `&timezone=Asia%2FBangkok&wind_speed_unit=kmh`
      ).then(r => r.json());

      /* ── 2. Current PM2.5 for all tambons ── */
      const aqPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}` +
        `&current=pm2_5&timezone=Asia%2FBangkok`
      ).then(r => r.json());

      /* ── 3. Hourly + daily forecast for KK center (next 2 days) ── */
      const fcstWxPromise = fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${KK_LAT}&longitude=${KK_LNG}` +
        `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index,precipitation,precipitation_probability` +
        `&daily=temperature_2m_max,temperature_2m_min` +
        `&forecast_days=2&timezone=Asia%2FBangkok&wind_speed_unit=kmh`
      ).then(r => r.json());

      /* ── 4. Hourly PM2.5 forecast for KK center ── */
      const fcstAqPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${KK_LAT}&longitude=${KK_LNG}` +
        `&hourly=pm2_5&forecast_days=2&timezone=Asia%2FBangkok`
      ).then(r => r.json());

      const [wxRes, aqRes, fcstWxRes, fcstAqRes] = await Promise.allSettled([
        wxPromise, aqPromise, fcstWxPromise, fcstAqPromise,
      ]);

      /* ── Update tambon current data ── */
      const wxArr = wxRes.status === 'fulfilled'
        ? (Array.isArray(wxRes.value) ? wxRes.value : [wxRes.value]) : [];
      const aqArr = aqRes.status === 'fulfilled'
        ? (Array.isArray(aqRes.value) ? aqRes.value : [aqRes.value]) : [];

      setTambons(baseTambons.map((t, i) => {
        const w = wxArr[i]?.current;
        const a = aqArr[i]?.current;
        const temp = w?.temperature_2m ?? t.temperature;
        return {
          ...t,
          temperature: Math.round(temp),
          humidity:    w?.relative_humidity_2m != null ? Math.round(w.relative_humidity_2m) : t.humidity,
          windSpeed:   w?.wind_speed_10m       != null ? Math.round(w.wind_speed_10m * 10) / 10 : t.windSpeed,
          pm25:        a?.pm2_5               != null ? Math.round(a.pm2_5) : t.pm25,
          heatValue:   heatFromTemp(temp),
        };
      }));

      /* ── Daily max / min for today ── */
      if (fcstWxRes.status === 'fulfilled') {
        const wx = fcstWxRes.value;
        const max = wx.daily?.temperature_2m_max?.[0];
        const min = wx.daily?.temperature_2m_min?.[0];
        if (max != null) setDailyMax(Math.round(max));
        if (min != null) setDailyMin(Math.round(min));
      }

      /* ── Build hourly forecast array (next 24 h from now) ── */
      if (fcstWxRes.status === 'fulfilled') {
        const wx  = fcstWxRes.value;
        const aq  = fcstAqRes.status === 'fulfilled' ? fcstAqRes.value : null;
        const times = wx.hourly?.time ?? [];

        const nowKey  = bkkHourKey();
        let   startIdx = times.findIndex(t => t.startsWith(nowKey));
        if (startIdx < 0) startIdx = 0;

        const items = [];
        for (let i = startIdx; i < startIdx + 24 && i < times.length; i++) {
          const timeStr = times[i]; // "YYYY-MM-DDTHH:00"
          items.push({
            time:        timeStr,
            hour:        parseInt(timeStr.slice(11, 13)),
            dateLabel:   timeStr.slice(8, 10) !== times[startIdx].slice(8, 10) ? timeStr.slice(5, 10) : null,
            temperature: Math.round(wx.hourly.temperature_2m[i]         ?? 0),
            humidity:    Math.round( wx.hourly.relative_humidity_2m[i]  ?? 0),
            windSpeed:   Math.round((wx.hourly.wind_speed_10m[i]        ?? 0) * 10) / 10,
            pm25:        Math.round( aq?.hourly?.pm2_5?.[i]             ?? 0),
            uvIndex:      Math.round((wx.hourly.uv_index?.[i]      ?? 0) * 10) / 10,
            precipitation:        Math.round((wx.hourly.precipitation?.[i]             ?? 0) * 10) / 10,
            precipProbability:    Math.round( wx.hourly.precipitation_probability?.[i] ?? 0),
            weatherCode:  wx.hourly.weather_code?.[i] ?? 0,
            isCurrent:   i === startIdx,
          });
        }
        setForecast(items);
      }

      setLastUpdated(new Date());
      setStatus('ok');
    } catch {
      setStatus(prev => prev === 'loading' ? 'error' : 'ok');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  return { tambons, forecast, dailyMax, dailyMin, status, lastUpdated, refresh };
}
