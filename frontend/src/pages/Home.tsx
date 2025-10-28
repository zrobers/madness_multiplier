import React from "react";
import Leaderboard from "../components/Leaderboard";
import GameData from "../components/GameData";
import Bracket from "../components/Bracket";
import Pools from "../components/Pools";
import logoImage from "../assets/mm_logo_v1.jpg";

export default function HomePage() {
  return (
    <div className="container">
      <header className="tabs">
        <button className="tab active">Home</button>
        <button className="tab" disabled>
          View Picks
        </button>
        <button className="tab" disabled>
          Submit Picks
        </button>
        <button className="tab" disabled>
          How It Works
        </button>
      </header>

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
    </div>
  );
}