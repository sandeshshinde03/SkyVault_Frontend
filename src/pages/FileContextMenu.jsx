// src/components/FileContextMenu.jsx
import { useState } from "react";
import axios from "axios";

export default function FileContextMenu({ file, activeTab, onActionComplete }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    try {
      setLoading(true);

      if (action === "rename") {
        const newName = prompt("Enter new file name:", file.name);
        if (!newName) return;
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/files/rename`, {
          id: file.id,
          newName,
          type: "file",
        });
      }

      if (action === "move") {
        const folderId = prompt("Enter destination folder ID:");
        if (!folderId) return;
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/files/move`, {
          id: file.id,
          folder_id: folderId,
        });
      }

      if (action === "delete") {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/files/soft/${file.id}`);
      }

      if (action === "permanentDelete") {
        if (!window.confirm("⚠️ This will permanently delete the file. Continue?")) return;
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/files/${file.id}`);
      }

      if (action === "restore") {
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/files/restore/${file.id}`);
      }

      onActionComplete?.(); // refresh Dashboard
    } catch (err) {
      console.error("Action failed:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="p-1 rounded hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation(); // prevent parent click (open file)
          setOpen(!open);
        }}
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow-lg z-50">
          <button
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => handleAction("rename")}
          >
            Rename
          </button>
          <button
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => handleAction("move")}
          >
            Move
          </button>

          {activeTab !== "trash" ? (
            <button
              className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-100"
              onClick={() => handleAction("delete")}
            >
              Delete
            </button>
          ) : (
            <>
              <button
                className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                onClick={() => handleAction("restore")}
              >
                Restore
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-100"
                onClick={() => handleAction("permanentDelete")}
              >
                Delete Forever
              </button>
            </>
          )}
        </div>
      )}

      {/* Spinner while action running */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
