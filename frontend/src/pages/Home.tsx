import React, { useState } from "react";
import Bracket from "../components/Bracket";
import GameData from "../components/GameData";
import Leaderboard from "../components/Leaderboard";
//import logoImage from "../assets/mm_logo_v1.jpg";
import { useNavigate } from "react-router-dom";
import Pools from "../components/Pools";
import SubmitPicks from "./SubmitPicks";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="container">
      <div className="appHeader">
        {/* <img src={logoImage} alt="Madness Multiplier Logo" className="logo" /> */}
        <header className="tabs">
          <button 
            className={`tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
          >
            Home
          </button>
          <button className="tab" disabled>View Picks</button>
          <button 
            className={`tab ${activeTab === 'submit-picks' ? 'active' : ''}`}
            onClick={() => handleTabClick('submit-picks')}
          >
            Submit Picks
          </button>
          <button className="tab" disabled>How It Works</button>
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
              <Bracket />
            </aside>
          </section>
        </>
      )}

      {activeTab === 'submit-picks' && (
        <SubmitPicks />
      )}
    </div>
  );
}