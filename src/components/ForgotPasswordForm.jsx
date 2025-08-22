import { useState } from "react";

const ForgotPasswordForm = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // frontend message
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await onSubmit(email, setMessage); // pass setMessage to parent
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {message && <p className="text-green-500 text-sm mb-3">{message}</p>}

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600 transition"
      >
        Send Reset Link
      </button>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Remembered your password?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Back to Login
        </a>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
