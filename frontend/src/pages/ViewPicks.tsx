import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';

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

  const analytics = useMemo(() => {
    const total = wagers.length;
    const byStatus: Record<string, number> = {};
    let totalStake = 0;
    let totalPayouts = 0;
    let totalExpected = 0;

    for (const w of wagers) {
      const s = (w.status || 'UNKNOWN').toUpperCase();
      byStatus[s] = (byStatus[s] || 0) + 1;
      totalStake += Number(w.stake_points || 0);
      // payout_points might be null for non-resolved wagers
      totalPayouts += Number(w.payout_points || 0);
      totalExpected += Number(w.expected_payout || 0);
    }

    const wins = byStatus['WON'] || 0;
    const losses = byStatus['LOST'] || 0;
    const open = (byStatus['OPEN'] || 0) + (byStatus['PENDING'] || 0);
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const avgStake = total > 0 ? totalStake / total : 0;
    const netPoints = totalPayouts - totalStake; // realized profit (only resolved wagers with payout_points)

    return {
      total,
      wins,
      losses,
      open,
      winRate: Math.round(winRate * 10) / 10,
      totalStake,
      avgStake: Math.round(avgStake * 10) / 10,
      totalPayouts,
      netPoints,
      byStatus,
      totalExpected: Math.round(totalExpected * 10) / 10,
    };
  }, [wagers]);

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

      {/* Analytics panel */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', flex: '0 0 260px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Picks Analytics</div>
          <div>Total picks: {analytics.total}</div>
          <div>Won: {analytics.wins}</div>
          <div>Lost: {analytics.losses}</div>
          <div>Open/Pending: {analytics.open}</div>
          <div>Win rate: {analytics.winRate}%</div>
        </div>

        <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Stakes & Payouts</div>
          <div>Total staked: {analytics.totalStake} pts</div>
          <div>Average stake: {analytics.avgStake} pts</div>
          <div>Total realized payouts: {analytics.totalPayouts} pts</div>
          <div>Net realized points: {analytics.netPoints} pts</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
            (Expected payouts for open picks: {analytics.totalExpected} pts)
          </div>
        </div>
      </div>

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