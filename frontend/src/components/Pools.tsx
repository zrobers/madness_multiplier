import React, { useEffect, useState } from "react";

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

export default function Pools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        setError(null);

        // exactly like Leaderboard — no env var needed
        const response = await fetch("/api/pools");
        if (!response.ok) {
          throw new Error(`Error fetching pools: ${response.statusText}`);
        }
        const data = await response.json();
        setPools(data);
      } catch (err: any) {
        console.error("Error fetching pools:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  if (loading) return <div>Loading pools...</div>;
  if (error) return <div>Error loading pools: {error}</div>;

  return (
    <div className="card">
      <div className="lbHeader">POOLS</div>
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
            </tr>
          </thead>
          <tbody>
            {pools.length ? (
              pools.map((p, i) => (
                <tr key={p.pool_id}>
                  <td className="cell-rank">{i + 1}</td>
                  <td className="cell-name">{p.name}</td>
                  <td className="cell-name">{p.owner_handle}</td>
                  <td className="cell-name">{p.season_year}</td>
                  <td className="cell-points">{p.member_count}</td>
                  <td className="cell-points">{p.initial_points}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No pools found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}