import React, { useEffect, useState } from "react";
import { leaderboard } from "../data/mock";
import { mock } from "node:test";

type Row = { user: string; initials: string; points: number };

export default function Leaderboard() {
  const [realLeaderboard, setLeaderboard] = useState<Row[] | null>(null); // change name once real data is fetched
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // skeleton uses first 12; replace with real data later
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
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const poolId = "12345";
        const response = await fetch(`/api/leaderboard?poolId=${poolId}`);
        if (!response.ok) {
          throw new Error(`Error fetching leaderboard: ${response.statusText}`);
        }
        const data = await response.json();

        const formatted: Row[] = data.map((d: any) => ({
          user: d.handle || d.user || "Unknown",
          initials: d.initials || "",
          points: Number(d.current_points ?? d.points ?? 0),
        }));

        setLeaderboard(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

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
                <td className="cell-rank">{i + 1}</td>
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
