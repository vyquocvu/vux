interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = "Loading..." }: LoadingOverlayProps) => {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="lds-dual-ring inline-block h-20 w-20 after:block"></div>
        <p className="loading-overlay-text">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
