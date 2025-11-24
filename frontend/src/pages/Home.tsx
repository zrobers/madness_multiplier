import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

import Bracket from "../components/Bracket";
import GameData from "../components/GameData";
import Leaderboard from "../components/Leaderboard";
import Pools from "../components/Pools";
import HowItWorks from "./HowItWorks";
import SubmitPicks from "./SubmitPicks";
import ViewPicks from "./ViewPicks";
import PoolDetail from "./PoolDetail";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "view-picks" | "submit-picks" | "pool-detail" | "how-it-works">("home");
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const openPoolDetail = (poolId: string) => {
    setSelectedPoolId(poolId);
    setActiveTab('pool-detail');
  };

  const location = useLocation();

  // 1) Pick up name passed from Login (navigate("/", { state: { userName } }))
  useEffect(() => {
    const state = location.state as { userName?: string } | null;
    if (state?.userName) {
      setUserName(state.userName);
    }
  }, [location.state]);

  // 2) Listen to Firebase auth so refresh still knows who we are
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const res = await fetch(`http://localhost:4000/api/auth/user/${user.uid}`);
        const data = await res.json();
        console.log("Fetched handle:", data);
        setUserName(data.handle); // <-- set handle from your database
      } catch (err) {
        console.error(err);
        setUserName(null);
      }
    } else {
      setUserName(null);
    }
  });
  return () => unsubscribe();
}, []);

  const handleTabClick = (tab: "home" | "view-picks" | "submit-picks" | "pool-detail" |"how-it-works") => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserName(null);
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="appHeader">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src="/mm_logo_v1.jpg" alt="Madness Multiplier Logo" className="logo" />
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1f2937",
              margin: 0,
              letterSpacing: "1px",
            }}
          >
            MADNESS MULTIPLIER
          </h1>
        </div>

        <header className="tabs">
          <button className={`tab ${activeTab === "home" ? "active" : ""}`} onClick={() => handleTabClick("home")}>
            Home
          </button>
          <button className={`tab ${activeTab === "view-picks" ? "active" : ""}`} onClick={() => handleTabClick("view-picks")}>
            View Picks
          </button>
          <button className={`tab ${activeTab === "submit-picks" ? "active" : ""}`} onClick={() => handleTabClick("submit-picks")}>
            Submit Picks
          </button>
          <button className={`tab ${activeTab === "how-it-works" ? "active" : ""}`} onClick={() => handleTabClick("how-it-works")}>
            How It Works
          </button>
        </header>

        {/* Right side: either Login/Register or user pill + logout */}
        {userName ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="user-pill">Hi, {userName}</span>
            <button className="loginButton" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button className="loginButton" onClick={() => navigate("/login")}>Login / Register</button>
        )}
      </div>

      {activeTab === "home" && (
        <>
          <section className="topRow">
            <GameData />
          </section>

          <section className="belowGrid">
            <aside className="left">
              <Leaderboard />
              <div style={{ height: 12 }} />
              <Pools onOpenPool={openPoolDetail} userName={userName}/>
            </aside>
            <div className="centerSpacer" aria-hidden />
            <aside className="right">
              <div className="bracket-full-width">
                <Bracket />
              </div>
            </aside>
          </section>
        </>
      )}

      {activeTab === 'submit-picks' && <SubmitPicks />}
      {activeTab === 'how-it-works' && <HowItWorks />}
      {activeTab === 'pool-detail' && selectedPoolId && (
        <section className="belowGrid pool-detail">
          <div style={{ width: '100%' }}>
            <PoolDetail poolId={selectedPoolId} onBack={() => setActiveTab('home')} />
          </div>
        </section>
      )}
    </div>
  );
}
