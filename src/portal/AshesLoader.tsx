export default function AshesLoader({ label = 'Loading Ashes…' }: { label?: string }) {
  return (
    <div className="ashes-loading-screen" role="status" aria-live="polite" aria-label={label}>
      <div className="ashes-loader-wrap">
        <div className="ashes-loader" aria-hidden="true">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="ashes-loader-clipping">
                <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                <polygon points="25,25 75,25 50,75" fill="white" />
                <polygon points="50,25 75,75 25,75" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
              </mask>
            </defs>
          </svg>
          <div className="ashes-loader-box" />
        </div>
        <div className="ashes-loader-copy">
          <span>ASHES</span>
          <small>{label}</small>
        </div>
      </div>
    </div>
  );
}
