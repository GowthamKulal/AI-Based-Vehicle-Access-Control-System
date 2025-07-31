export default function CameraPreview() {
  return (
    <div className="relative w-full h-full">
      <img
        src="http://localhost:8000/live-video"
        alt="Live Video Feed"
        className="w-full aspect-video object-cover rounded"
      />
      <div className="absolute top-2 right-2 flex items-center">
        <div className="animate-pulse bg-green-500 h-3 w-3 rounded-full mr-1"></div>
        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          Live
        </span>
      </div>
    </div>
  );
}
