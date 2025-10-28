import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import "../Login.css";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{showLogin ? "Login" : "Register"}</h1>
        <div className="toggle-buttons">
          <button
            className={showLogin ? "active" : ""}
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>
          <button
            className={!showLogin ? "active" : ""}
            onClick={() => setShowLogin(false)}
          >
            Register
          </button>
        </div>
        {showLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
