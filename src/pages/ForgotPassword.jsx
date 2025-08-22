import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { supabase } from "../utils/supabaseClient";

export default function ForgotPassword() {
  const handleForgotPassword = async (email, setMessage) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the password reset link.");
    }
  };

  return <ForgotPasswordForm onSubmit={handleForgotPassword} />;
}
