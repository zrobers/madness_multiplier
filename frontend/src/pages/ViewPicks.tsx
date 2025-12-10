// ---------------- ViewPicks.tsx --------------------
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Wager {
  wager_id: string | number;
  pool_id: string | number;
  user_id: string;
  game_id: number;
  picked_team_id: number;
  picked_team_name?: string;
  opponent_team_name?: string;
  picked_seed: number;
  opp_seed: number;
  stake_points: number;
  posted_odds: number;
  expected_payout?: number;
  placed_at: string;
  status: string;
  payout_points?: number | null;
  isDemoData?: boolean;
}

interface Pool {
  pool_id: string;
  name: string;
  season_year: number;
  initial_points: number;
  unbet_penalty_pct: string;
  allow_multi_bets: boolean;
  created_at: string;
  owner_user_id: string;
  owner_handle: string;
  owner_initials: string;
}

interface ViewPicksProps {
  userId: string;
  userName?: string | null;
  poolId?: string | null;
}

export default function ViewPicks({ userId }: ViewPicksProps) {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasDemoData, setHasDemoData] = useState(false);

  const [pools, setPools] = useState<Pool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState('');

  useEffect(() => {
    fetchPools();
  }, []);

  useEffect(() => {
    if (selectedPoolId) {
      fetchWagers();
    }
  }, [selectedPoolId]);

  const fetchPools = async () => {
    try {
      setPoolsLoading(true);
      const response = await axios.get(
        `http://localhost:4000/api/pools/user`,
        {
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json',
          },
        }
      );

      const ps = response.data.pools || [];
      setPools(ps);

      if (ps.length > 0 && !selectedPoolId) {
        setSelectedPoolId(ps[0].pool_id);
      }
    } catch (err) {
      console.error('Error fetching pools', err);
      setPools([]);
    } finally {
      setPoolsLoading(false);
    }
  };

  const fetchWagers = async () => {
    try {
      if (!selectedPoolId) return;

      setLoading(true);
      setError('');

      const all: Wager[] = [];

      //
      // REAL DB wagers
      //
      try {
        const response = await axios.get(
          `http://localhost:4000/api/wagers`,
          {
            params: { userId, poolId: selectedPoolId },
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json',
            },
          }
        );

        if (Array.isArray(response.data.wagers)) {
          all.push(
            ...response.data.wagers.map((w: any) => ({
              ...w,
              isDemoData: false,
            }))
          );
        }
      } catch (e) {
        console.error('Error fetching real wagers', e);
      }

      //
      // DEMO WAGERS filtered by this pool
      //
      const rawDemo = localStorage.getItem('demoWagers');
      if (rawDemo) {
        try {
          const demoArr = JSON.parse(rawDemo);
          if (Array.isArray(demoArr)) {
            const onlyThisPool = demoArr.filter(
              (dw: any) => dw.pool_id === selectedPoolId
            );

            if (onlyThisPool.length > 0) {
              all.push(
                ...onlyThisPool.map((dw: any) => ({
                  ...dw,
                  isDemoData: true,
                }))
              );
              setHasDemoData(true);
            }
          }
        } catch (err2) {
          console.error('Error parsing demo wagers', err2);
        }
      }

      all.sort(
        (a, b) =>
          new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
      );

      setWagers(all);
    } catch (err) {
      console.error(err);
      setError('Failed to load your picks');
    } finally {
      setLoading(false);
    }
  };

  const clearDemoData = () => {
    localStorage.removeItem('demoWagers');
    setHasDemoData(false);
    fetchWagers();
  };

  const getColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'WON':
        return '#16a34a';
      case 'LOST':
        return '#dc2626';
      case 'OPEN':
      case 'PENDING':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardTitle">Loading your picks...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="cardTitle">Your Picks</div>

      {/* POOL SELECT */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: '700' }}>Select Pool:</label>
        {poolsLoading ? (
          <div>Loading pools...</div>
        ) : pools.length === 0 ? (
          <div>No pools yet</div>
        ) : (
          <select
            value={selectedPoolId}
            onChange={(e) => setSelectedPoolId(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {pools.map((p) => (
              <option key={p.pool_id} value={p.pool_id}>
                {p.name} ({p.initial_points} pts)
              </option>
            ))}
          </select>
        )}
      </div>

      {hasDemoData && (
        <div style={{ marginBottom: 12 }}>
          ⚠️ Some wagers are demo data.
          <button onClick={clearDemoData} style={{ marginLeft: 12 }}>
            Clear Demo
          </button>
        </div>
      )}

      {error && <div>{error}</div>}

      {wagers.length === 0 ? (
        <div>You have no wagers in this pool.</div>
      ) : (
        <div className="picks-list">
          {wagers.map((w) => (
            <div
              key={w.wager_id}
              className="pick-card"
              style={
                w.isDemoData
                  ? { border: '2px solid #f59e0b', background: '#fffbeb' }
                  : {}
              }
            >
              <b>
                #{w.picked_seed} {w.picked_team_name} vs #{w.opp_seed}{' '}
                {w.opponent_team_name}
              </b>
              <div>
                Stake {w.stake_points} @ {w.posted_odds}x
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: getColor(w.status),
                  fontWeight: 600,
                }}
              >
                {w.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}