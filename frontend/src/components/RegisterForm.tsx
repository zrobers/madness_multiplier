import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      //Build handle EXACTLY how it used to be: "First Last"
      const handle = `${firstName} ${lastName}`.trim();

      const initials =
        (firstName[0] || "").toUpperCase() +
        (lastName[0] || "").toUpperCase();

      // Check handle availability
      const handleCheck = await axios.post(
        "http://localhost:4000/api/auth/check-handle",
        { handle }
      );

      if (!handleCheck.data.available) {
        setError("Name already exists. Please add a number to last name");
        setLoading(false);
        return;
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Register in PostgreSQL
      await axios.post("http://localhost:4000/api/auth/register", {
        uid: user.uid,
        firstName,
        lastName,
        handle,
        initials,
        email: user.email,
      });

      // Reset fields
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");

      navigate("/");

    } catch (err: any) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "Failed to register");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="auth-form">
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label className="auth-label" htmlFor="register-first-name">
          First Name
        </label>
        <input
          id="register-first-name"
          type="text"
          className="auth-input"
          placeholder="Jane"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="register-last-name">
          Last Name
        </label>
        <input
          id="register-last-name"
          type="text"
          className="auth-input"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="register-email">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          className="auth-input"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="auth-button"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
