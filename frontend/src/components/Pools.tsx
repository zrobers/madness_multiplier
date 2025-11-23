// src/components/Pools.tsx  (update/replace)
import React, { useEffect, useState } from "react";
import CreatePoolModal from "../components/CreatePoolModal";
import JoinPoolModal from "../components/JoinPoolModal";

type Pool = {
  pool_id: string;
  name: string;
  owner_handle: string;
  season_year: number;
  initial_points: number;
  unbet_penalty_pct: number;
  allow_multi_bets: boolean;
  created_at: string;
  member_count: number;
};

type Props = {
  onOpenPool?: (poolId: string) => void;
};

export default function Pools({ onOpenPool }: Props) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [joinPoolId, setJoinPoolId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchPools() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/pools");
      if (!response.ok) throw new Error(`Error fetching pools: ${response.statusText}`);
      const data = await response.json();
      setPools(data);
    } catch (err: any) {
      console.error("Error fetching pools:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPools();
  }, []);

  function handleOpenPool(poolId: string) {
    if (onOpenPool) {
      onOpenPool(poolId);
    } else {
      // fallback: navigate to route if desired in future
      // e.g. navigate(`/pools/${encodeURIComponent(poolId)}`);
      console.warn('onOpenPool not provided');
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="lbHeader">POOLS</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setShowCreate(true)}>Create</button>
          <button className="btn secondary" onClick={fetchPools}>Refresh</button>
        </div>
      </div>

      {message && <div style={{ color: "green", padding: 8 }}>{message}</div>}

      <div className="lbWrap">
        <table className="lbTable">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name">NAME</th>
              <th className="col-owner">OWNER</th>
              <th className="col-season">SEASON</th>
              <th className="col-members">MEMBERS</th>
              <th className="col-points">INIT POINTS</th>
              <th className="col-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {pools.length ? (
              pools.map((p, i) => (
                <tr key={p.pool_id}>
                  <td className="cell-rank">{i + 1}</td>
                  <td
                    className="cell-name"
                    style={{ cursor: onOpenPool ? "pointer" : "default", textDecoration: onOpenPool ? "underline" : "none" }}
                    onClick={() => handleOpenPool(p.pool_id)}
                  >
                    {p.name}
                  </td>
                  <td className="cell-name">{p.owner_handle}</td>
                  <td className="cell-name">{p.season_year}</td>
                  <td className="cell-points">{p.member_count}</td>
                  <td className="cell-points">{p.initial_points}</td>
                  <td className="cell-actions">
                    <button className="btn" onClick={() => setJoinPoolId(p.pool_id)}>Join</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No pools found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreatePoolModal
          onClose={() => setShowCreate(false)}
          onCreated={(pool) => {
            setMessage(`Created pool "${pool.name}"`);
            fetchPools();
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}

      {joinPoolId && (
        <JoinPoolModal
          poolId={joinPoolId}
          onClose={() => setJoinPoolId(null)}
          onJoined={() => {
            setMessage("Joined pool");
            fetchPools();
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}