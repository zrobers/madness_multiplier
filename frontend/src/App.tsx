import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { auth } from "./firebaseConfig";
import HomePage from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SubmitPicks from "./pages/SubmitPicks";
import ViewPicks from "./pages/ViewPicks";
import "./styles.css";

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const [userHandle, setUserHandle] = React.useState<string | null>(null);

  // ✅ Track Firebase login state
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (user?.uid) {
      fetch(`http://localhost:4000/api/auth/handle/${user.uid}`)
        .then(res => res.json())
        .then(data => setUserHandle(data.handle))
        .catch(err => console.error(err));
    } else {
      setUserHandle(null);
    }
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        {/* If user logged in → show HomePage, else redirect */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/submit-picks" element={<SubmitPicks />} />
        <Route path="/view-picks" element={<ViewPicks />} />
      </Routes>
    </Router>
  );
}
