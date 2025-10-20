import React from "react";
import { leaderboard } from "../data/mock";

type Row = { user: string; initials: string; points: number };

export default function Leaderboard() {
  // skeleton uses first 12; replace with real data later
  const rows: Row[] = leaderboard.map((r) => ({
    user: r.user,
    initials: (r as any).initials ?? r.user.split(" ").map(n=>n[0]).join("").slice(0,3).toUpperCase(),
    points: r.points,
  }));

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
            {rows.map((r, i) => (
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
