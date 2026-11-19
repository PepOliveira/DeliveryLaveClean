// Mapa ilustrativo. Na versão real, troque por Mapbox/Google Maps com a posição do GPS.
export function Mapa({ progresso }: { progresso: number }) {
  const p = Math.min(1, Math.max(0, progresso));
  const pts = [[40, 190], [120, 150], [200, 120], [260, 80], [340, 50]];
  const seg = p * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(seg));
  const f = seg - i;
  const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
  const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
  return (
    <div className="map" aria-label="Mapa ilustrativo da rota">
      <svg viewBox="0 0 380 230" width="100%" role="img">
        <rect width="380" height="230" fill="#E2E8F0" />
        <rect x="20" y="20" width="90" height="60" rx="8" fill="#CBD5E1" />
        <rect x="150" y="20" width="70" height="60" rx="8" fill="#CBD5E1" />
        <rect x="260" y="130" width="90" height="70" rx="8" fill="#CBD5E1" />
        <rect x="30" y="150" width="70" height="60" rx="8" fill="#CBD5E1" />
        <rect x="0" y="105" width="380" height="14" fill="#fff" />
        <rect x="125" y="0" width="14" height="230" fill="#fff" />
        <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke="#2563EB" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
        <circle cx={pts[0][0]} cy={pts[0][1]} r="8" fill="#fff" stroke="#0F172A" strokeWidth="3" />
        <circle cx={pts[4][0]} cy={pts[4][1]} r="10" fill="#0F172A" />
        <circle cx={x} cy={y} r="18" fill="#2563EB" opacity=".25" />
        <circle cx={x} cy={y} r="9" fill="#2563EB" stroke="#fff" strokeWidth="3" />
      </svg>
    </div>
  );
}
