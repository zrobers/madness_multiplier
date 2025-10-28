import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { auth } from "./firebaseConfig";
import HomePage from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SubmitPicks from "./pages/SubmitPicks";
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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/submit-picks" element={<SubmitPicks />} />
      </Routes>
    </Router>
  );
}
