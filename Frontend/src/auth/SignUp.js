import React, { useState } from "react";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignUp({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("A");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // --- Validation ---
    if (!email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, userType);
      if (!result.success) {
        setError(result.error?.message || "Error during sign up.");
        return;
      }

      // Show success alert BEFORE navigation
      alert(`Successfully registered ${email}!`);
      navigate("/dashboard");

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="signup-user-type">User Type</label>
        <select
          id="signup-user-type"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          aria-label="Select user type"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        <label htmlFor="signup-password">Password</label>
        <div className="password-wrapper">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="eye-button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <label htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account?{" "}
        <button className="link-button" onClick={onSwitch}>
          Sign In
        </button>
      </div>
    </div>
  );
}