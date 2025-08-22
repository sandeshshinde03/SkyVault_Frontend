import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { supabase } from "../utils/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = async ({ email, password, setMessage }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      // Handles "user already registered" automatically
      setMessage(error.message);
      return;
    }

    // data.user exists if signup succeeded
    if (data?.user) {
      setMessage(
        "Signup successful! Check your email to confirm your account before logging in."
      );
    } else {
      // For email confirmations, data.user might be null
      setMessage(
        "Signup initiated. Check your email to confirm your account."
      );
    }

    setTimeout(() => navigate("/login"), 3000);
  } catch (err) {
    setMessage(err.message);
  }
};


  return <AuthForm type="signup" onSubmit={handleSignup} />;
}
