import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await updatePassword(password);
      setMessage("✅ Password updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form
      onSubmit={handleReset}
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

      {/* Success & Error Messages */}
      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600 transition"
      >
        Update Password
      </button>
    </form>
  );
}
