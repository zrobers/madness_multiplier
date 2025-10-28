import React from "react";
import Leaderboard from "../components/Leaderboard";
import GameData from "../components/GameData";
import Bracket from "../components/Bracket";
//import logoImage from "../assets/mm_logo_v1.jpg";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="appHeader">
        {/* <img src={logoImage} alt="Madness Multiplier Logo" className="logo" /> */}
        <header className="tabs">
          <button className="tab active">Home</button>
          <button className="tab" disabled>View Picks</button>
          <button className="tab" disabled>Submit Picks</button>
          <button className="tab" disabled>How It Works</button>
          
        </header>

        <button 
          className="loginButton"
          onClick={() => navigate("/login")}
        >
          Login / Register
        </button>

      </div>

      <section className="topRow">
        <GameData />
      </section>

      <section className="belowGrid">
        <aside className="left"><Leaderboard /></aside>
        <div className="centerSpacer" aria-hidden />
        <aside className="right"><Bracket /></aside>
      </section>
    </div>
  );
}