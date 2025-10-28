import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Bracket from "../components/Bracket";
import GameData from "../components/GameData";
import Leaderboard from "../components/Leaderboard";
import Pools from "../components/Pools";
import HowItWorks from "./HowItWorks";
import SubmitPicks from "./SubmitPicks";
import ViewPicks from "./ViewPicks";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="container">
      <div className="appHeader">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src="/mm_logo_v1.jpg" alt="Madness Multiplier Logo" className="logo" />
          <h1 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "700", 
            color: "#1f2937", 
            margin: 0,
            letterSpacing: "1px"
          }}>
            MADNESS MULTIPLIER
          </h1>
        </div>
        <header className="tabs">
          <button 
            className={`tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
          >
            Home
          </button>
          <button 
            className={`tab ${activeTab === 'view-picks' ? 'active' : ''}`}
            onClick={() => handleTabClick('view-picks')}
          >
            View Picks
          </button>
          <button 
            className={`tab ${activeTab === 'submit-picks' ? 'active' : ''}`}
            onClick={() => handleTabClick('submit-picks')}
          >
            Submit Picks
          </button>
          <button 
            className={`tab ${activeTab === 'how-it-works' ? 'active' : ''}`}
            onClick={() => handleTabClick('how-it-works')}
          >
            How It Works
          </button>
        </header>
        <button className="loginButton" onClick={() => navigate("/login")}>Login / Register</button>

      </div>

      {activeTab === 'home' && (
        <>
          <section className="topRow">
            <GameData />
          </section>

          <section className="belowGrid">
            <aside className="left">
              <Leaderboard />
              <div style={{ height: 12 }} />
              <Pools />
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
      {activeTab === 'view-picks' && (
        <ViewPicks />
      )}

      {activeTab === 'submit-picks' && (
        <SubmitPicks />
      )}

      {activeTab === 'how-it-works' && (
        <HowItWorks />
      )}
      
      {activeTab === 'how-it-works' && (
        <HowItWorks />
      )}
    </div>
  );
}