import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1️⃣ Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Call backend to ensure user exists in Postgres
      await axios.post("http://localhost:4000/api/users", {
        uid: user.uid,
        email: user.email,
        role: "basic" // optional
      });

      setMessage("✅ Logged in successfully!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
      <p>{message}</p>
    </form>
  );
}
