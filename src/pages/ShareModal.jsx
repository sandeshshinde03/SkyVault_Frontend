import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const ShareModal = ({ item, onClose, onShare }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  const fetchShares = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/shares/${item.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch shares");
      const data = await res.json();
      setShares(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching shares:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [item]);

  const handleShareClick = async () => {
    if (!email) return setShareMessage("Please enter a valid email.");

    try {
      await onShare(item, email, role);
      setShareMessage(`"${item.name}" shared with ${email} as ${role}`);
      setEmail("");
      fetchShares();
    } catch (err) {
      setShareMessage("Sharing failed: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-lg font-semibold mb-4">Share "{item.name}"</h2>

        {shareMessage && (
          <p className="text-sm text-green-600 mb-2">{shareMessage}</p>
        )}

        <div className="flex flex-col space-y-2 mb-4">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button
            onClick={handleShareClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Share
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Shared with:</h3>
          {loading ? (
            <p>Loading...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-gray-500">No shares yet.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {shares.map((s) => (
                <li key={s.id}>
                  {s.shared_with_email} ({s.role})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
