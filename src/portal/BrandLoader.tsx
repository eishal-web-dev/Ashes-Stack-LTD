export default function BrandLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 22,
    }}>
      <div style={{ position: 'relative', width: 76, height: 76, display: 'grid', placeItems: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,.1)',
          borderTopColor: '#ff62c7', borderRightColor: '#66ebf2',
          animation: 'brandSpin 1s linear infinite',
        }} />
        <img
          src="/ashes-logo-transparent.webp"
          alt="ASHES"
          style={{ width: 34, height: 'auto', filter: 'invert(1) brightness(.92)', opacity: .95 }}
        />
      </div>
      <div style={{ font: '700 .62rem/1 "Courier New", monospace', letterSpacing: '.14em', color: '#8c8982', textTransform: 'uppercase' }}>
        {label}
      </div>
      <style>{`@keyframes brandSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
