export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const r   = await fetch('https://data.tmd.go.th/api/Weather3Hours/v2/?uid=api&ukey=api12345');
    const xml = await r.text();
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
