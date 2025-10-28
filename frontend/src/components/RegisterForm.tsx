import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1️⃣ Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Call backend to store app-specific info
      await axios.post("http://localhost:4000/api/users", {
        uid: user.uid,
        email: user.email,
        role: "basic"  // optional
      });

      setMessage("✅ Account created successfully!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Register</button>
      <p>{message}</p>
    </form>
  );
}
