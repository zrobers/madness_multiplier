import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Home";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import "./styles.css";

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // ✅ Track Firebase login state
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        {/* If user logged in → show HomePage, else redirect */}
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </Router>
  );
}
