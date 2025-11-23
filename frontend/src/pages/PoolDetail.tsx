// src/components/PoolDetail.tsx
import React, { useEffect, useState } from "react";

type PoolInfo = {
  pool_id: string;
  name: string;
  owner_handle: string;
  season_year: number;
  initial_points: number;
  unbet_penalty_pct: number;
  allow_multi_bets: boolean;
  created_at: string;
};

type Member = {
  user_id: string;
  handle: string;
  joined_at: string;
};

type Wager = {
  wager_id: number;
  pool_id: string;
  user_id: string;
  handle: string;
  game_id: number;
  team_a_id?: number;
  team_b_id?: number;
  start_time_utc?: string;
  picked_team_id: number;
  picked_team_name?: string | null;
  opp_team_name?: string | null;
  picked_seed: number;
  opp_seed: number;
  stake_points: string;
  posted_odds: string;
  placed_at: string;
  status: string;
  settled_at?: string | null;
  payout_points?: string | null;
};

type Props = {
  poolId: string;
  onBack: () => void;
  userName?: string | null;
};

export default function PoolDetail({ poolId, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);

  useEffect(() => {
    if (!poolId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/pools/${encodeURIComponent(poolId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load pool (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setPool(data.pool || null);
        setMembers(data.members || []);
        setWagers(data.wagers || []);
      })
      .catch((err: any) => {
        console.error("PoolDetail fetch error", err);
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [poolId]);

  if (loading) return <div>Loading pool details...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!pool) return <div>Pool not found</div>;

  // group wagers by handle (user)
  const wagersByHandle: Record<string, Wager[]> = {};
  wagers.forEach((w) => {
    const h = w.handle || w.user_id;
    if (!wagersByHandle[h]) wagersByHandle[h] = [];
    wagersByHandle[h].push(w);
  });

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>{pool.name}</h2>
          <div style={{ color: "#666", fontSize: 14 }}>
            Owner: {pool.owner_handle} • Season: {pool.season_year}
          </div>
        </div>
        <div>
          <button className="btn secondary" onClick={onBack}>Back</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Pool settings</h3>
        <table style={{ width: "100%", maxWidth: 760 }}>
          <tbody>
            <tr>
              <td style={{ width: 200 }}>Initial points</td>
              <td>{pool.initial_points}</td>
            </tr>
            <tr>
              <td>Unbet penalty %</td>
              <td>{pool.unbet_penalty_pct}</td>
            </tr>
            <tr>
              <td>Allow multi-bets</td>
              <td>{pool.allow_multi_bets ? "Yes" : "No"}</td>
            </tr>
            <tr>
              <td>Created</td>
              <td>{new Date(pool.created_at).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Members ({members.length})</h3>

        {members.length ? (
          <div>
            {members.map((m, i) => {
              const userWagers = wagersByHandle[m.handle] || [];
              return (
                <div key={m.user_id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', padding: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{m.handle}</strong>
                      <div style={{ color: '#666', fontSize: 12 }}>Joined: {new Date(m.joined_at).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#666' }}>{userWagers.length} wager(s)</div>
                    </div>
                  </div>

                  {/* wagers list for this user */}
                  {userWagers.length ? (
                    <table className="lbTable" style={{ width: '100%', marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Game</th>
                          <th>Pick</th>
                          <th>Stake</th>
                          <th>Odds</th>
                          <th>Status</th>
                          <th>Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userWagers.map((w) => (
                          <tr key={w.wager_id}>
                            <td style={{ width: 180 }}>{new Date(w.placed_at).toLocaleString()}</td>
                            <td>
                              {w.picked_team_name ? (
                                <>{w.picked_team_name} vs {w.opp_team_name}</>
                              ) : (
                                <>Game {w.game_id}</>
                              )}
                            </td>
                            <td>seed {w.picked_seed}</td>
                            <td style={{ textAlign: 'right' }}>{Number(w.stake_points).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>{Number(w.posted_odds).toFixed(4)}</td>
                            <td>{w.status}</td>
                            <td style={{ textAlign: 'right' }}>{w.payout_points ? Number(w.payout_points).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ marginTop: 8, color: '#64748b' }}>No wagers yet</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>No members yet</div>
        )}
      </div>
    </div>
  );
}