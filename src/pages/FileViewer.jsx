import { useState, useEffect } from "react";

const FileViewer = ({ fileUrl, onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fileUrl) {
      setLoading(true);
      // Small delay to simulate loading
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [fileUrl]);

  if (!fileUrl) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-3/4 h-3/4 relative flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
          onClick={onClose}
        >
          ✖
        </button>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <>
            {fileUrl.endsWith(".pdf") ? (
              <iframe
                src={fileUrl}
                title="PDF Viewer"
                className="w-full h-full"
              ></iframe>
            ) : fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={fileUrl}
                alt="preview"
                className="w-full h-full object-contain"
              />
            ) : fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video controls className="w-full h-full">
                <source src={fileUrl} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            ) : (
              <iframe
                src={fileUrl}
                title="File Viewer"
                className="w-full h-full"
              ></iframe>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
