import './BlobLoader.css';

export default function BlobLoader() {
  return (
    <div className="blob-loader">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <mask id="blob-clipping">
            <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
            <polygon points="25,25 75,25 50,75" fill="white"></polygon>
            <polygon points="50,25 75,75 25,75" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          </mask>
        </defs>
      </svg>
      <div className="blob-loader-box"></div>
    </div>
  );
}

export function BlobLoaderCentered() {
  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{ display: 'inline-flex' }}>
        <BlobLoader />
      </div>
    </div>
  );
}
