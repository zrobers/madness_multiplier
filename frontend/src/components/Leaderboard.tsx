import React, { useEffect, useState } from "react";
import { leaderboard } from "../data/mock";

type Row = { user: string; initials: string; points: number; rank?: number };

export default function Leaderboard({ poolId }: { poolId: string | null }) {
  const [realLeaderboard, setLeaderboard] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // fallback mock rows
  const mockRows: Row[] = leaderboard.map((r) => ({
    user: r.user,
    initials:
      (r as any).initials ??
      r.user
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
    points: r.points,
  }));

  useEffect(() => {
    if (!poolId) {
      setLeaderboard(null); // no pool yet
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:4000/api/leaderboard?poolId=${poolId}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching leaderboard`);
        }
        const data = await response.json();

        const formatted: Row[] = data.map((d: any) => ({
          user: d.handle || d.user || "Unknown",
          initials: d.initials || "",
          points: Number(d.current_points ?? d.points ?? 0),
          rank: Number(d.rank ?? 0),
        }));

        setLeaderboard(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
        setLeaderboard(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [poolId]); // 👈 re-fetch whenever pool changes

  if (!poolId) {
    return (
      <div className="card" >
        <div className="lbHeader">LEADERBOARD</div>
        <p style={{"marginLeft": 10}}>Select a pool to view standings.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  const displayRows = realLeaderboard ?? mockRows;

  return (
    <div className="card">
      <div className="lbHeader">LEADERBOARD</div>
      <div className="lbWrap">
        <table className="lbTable">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name">NAME</th>
              <th className="col-initials">INITIALS</th>
              <th className="col-points">POINTS</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => (
              <tr key={r.user}>
                <td className="cell-rank">{r.rank ?? i + 1}</td>
                <td className="cell-name">{r.user}</td>
                <td className="cell-initials">{r.initials}</td>
                <td className="cell-points">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}