import { useState } from "react";
import { Link } from "react-router-dom";

export default function AuthForm({ type = "login", onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await onSubmit({ email, password, setMessage });
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">
        {type === "login" ? "Login" : "Sign Up"}
      </h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {message && <p className="text-green-500 text-sm mb-3">{message}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600 transition"
      >
        {type === "login" ? "Login" : "Sign Up"}
      </button>

      {type === "login" ? (
        <>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-700 mt-3 block text-center hover:underline"
          >
            Forgot Password?
          </Link>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-600 mt-2 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      )}
    </form>
  );
}
