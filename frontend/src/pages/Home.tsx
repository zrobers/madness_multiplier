import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";

import Bracket from "../components/Bracket";
import GameData from "../components/GameData";
import Leaderboard from "../components/Leaderboard";
import LiveScores from "../components/LiveScores";
import Pools from "../components/Pools";
import HowItWorks from "./HowItWorks";
import PoolDetail from "./PoolDetail";
import SubmitPicks from "./SubmitPicks";
import ViewPicks from "./ViewPicks";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<
    "home" | "view-picks" | "submit-picks" | "pool-detail" | "how-it-works"
  >("home");

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [myPools, setMyPools] = useState<any[]>([]);
  const [selectedPoolName, setSelectedPoolName] = useState<string>("");

  const openPoolDetail = (poolId: string) => {
    setSelectedPoolId(poolId);
    setActiveTab("pool-detail");
  };

  // pick up name passed by login
  useEffect(() => {
    const state = location.state as { userName?: string } | null;
    if (state?.userName) {
      setUserName(state.userName);
    }
  }, [location.state]);

  // watch firebase user + get handle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName(null);
        setUserId(null);
        return;
      }

      setUserId(user.uid);

      try {
        const res = await fetch(
          `http://localhost:4000/api/auth/user/${user.uid}`
        );
        const data = await res.json();
        if (data?.handle) {
          setUserName(data.handle);
        } else {
          setUserName(user.displayName || user.email || "User");
        }
      } catch (err) {
        setUserName(user.displayName || user.email || "User");
      }
    });

    return () => unsubscribe();
  }, []);

  // fetch user pools
  useEffect(() => {
    if (!userId) return;

    async function loadPools() {
      const res = await fetch(`http://localhost:4000/api/pools/user`, {
        headers: {
          "X-User-Id": userId || "",
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      console.log("loaded user pools", data.pools);
      setMyPools(data.pools || []);

      // Auto-select first pool if available
      if (data.pools?.length > 0 && !selectedPoolId) {
        setSelectedPoolId(data.pools[0].pool_id);
        setSelectedPoolName(data.pools[0].name);
      }
    }

    loadPools();
  }, [userId]);

  // protect tabs
  useEffect(() => {
    if (
      (activeTab === "view-picks" || activeTab === "submit-picks") &&
      !userName
    ) {
      navigate("/login");
    }
  }, [activeTab, userName, navigate]);

  const handleTabClick = (tab: any) => {
    if ((tab === "view-picks" || tab === "submit-picks") && !userName) {
      navigate("/login");
      return;
    }
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
          <img
            src="/mm_logo_v1.jpg"
            alt="Madness Multiplier Logo"
            className="logo"
          />
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>
            MADNESS MULTIPLIER
          </h1>
        </div>
        {/* TOP MENU = pool dropdown + tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "auto",
          }}
        >
          {/* POOL DROPDOWN */}
          {userId && myPools.length > 0 && (
            <select
              className={`pool-select ${selectedPoolId ? "active" : ""}`}
              value={selectedPoolId ?? ""}
              onChange={(e) => {
                setSelectedPoolId(e.target.value);
                const pool = myPools.find((p) => p.pool_id === e.target.value);
                setSelectedPoolName(pool?.name || "");
              }}
            >
              <option value="">Select pool…</option>
              {myPools.map((p) => (
                <option key={p.pool_id} value={p.pool_id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* TABS */}
          <header className="tabs">
            <button
              className={`tab ${activeTab === "home" ? "active" : ""}`}
              onClick={() => handleTabClick("home")}
            >
              Home
            </button>

            {userName && (
              <>
                <button
                  className={`tab ${
                    activeTab === "view-picks" ? "active" : ""
                  }`}
                  onClick={() => handleTabClick("view-picks")}
                >
                  View Picks
                </button>

                <button
                  className={`tab ${
                    activeTab === "submit-picks" ? "active" : ""
                  }`}
                  onClick={() => handleTabClick("submit-picks")}
                >
                  Submit Picks
                </button>
              </>
            )}

            <button
              className={`tab ${activeTab === "how-it-works" ? "active" : ""}`}
              onClick={() => handleTabClick("how-it-works")}
            >
              How It Works
            </button>
          </header>
        </div>

        {/* RIGHT SIDE */}
        {userName ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="user-pill">Hi, {userName}</span>
            <button className="loginButton" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className="loginButton" onClick={() => navigate("/login")}>
            Login / Register
          </button>
        )}
      </div>

      {/* HOME */}
      {activeTab === "home" && (
        <>
          <section className="topRow">
            <GameData />
          </section>

          <section className="belowGrid">
            <aside className="left">
              <Leaderboard poolId={selectedPoolId} />
              <div style={{ height: 12 }} />
              <Pools
                onOpenPool={openPoolDetail}
                userName={userName}
                userId={userId}
              />
            </aside>
            <div className="centerSpacer" />
            <aside className="right">
              <Bracket 
                userId={userId} 
                userName={userName}
                poolId={selectedPoolId} />
            </aside>
          </section>

          <LiveScores />
        </>
      )}

      {activeTab === "view-picks" && userId && (
        <ViewPicks
          userId={userId}
          userName={userName}
          poolId={selectedPoolId}
        />
      )}

      {activeTab === "submit-picks" && userId && (
        <SubmitPicks
          userId={userId}
          userName={userName}
          poolId={selectedPoolId}
        />
      )}

      {activeTab === "how-it-works" && <HowItWorks />}

      {activeTab === "pool-detail" && selectedPoolId && (
        <PoolDetail
          poolId={selectedPoolId}
          onBack={() => setActiveTab("home")}
        />
      )}
    </div>
  );
}
