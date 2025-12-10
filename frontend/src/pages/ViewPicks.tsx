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

export default function ViewPicks({ userId, userName, poolId }: ViewPicksProps) {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasDemoData, setHasDemoData] = useState(false);
  
  // Use poolId from props (passed from Home) instead of local state
  const selectedPoolId = poolId || '';

  useEffect(() => {
    if (selectedPoolId) {
      fetchWagers();
    }
  }, [selectedPoolId]);

  // Removed fetchPools - pool selection is handled by Home component

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

  if (!selectedPoolId) {
    return (
      <div className="card">
        <div className="cardTitle">Your Picks</div>
        <div className="warning-message">
          Please select a pool from the dropdown at the top of the page to view your picks.
        </div>
      </div>
    );
  }

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

      {hasDemoData && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️</span>
          <span>Some wagers are demo data for testing</span>
          <button
            onClick={clearDemoData}
            style={{ marginLeft: 'auto', padding: '4px 8px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Demo
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fee2e2', border: '1px solid #dc2626', borderRadius: '6px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {wagers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>No wagers yet</h3>
          <p style={{ margin: 0 }}>You haven't placed any wagers in this pool. Head to Submit Picks to get started!</p>
        </div>
      ) : (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{wagers.length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Wagers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{wagers.filter(w => w.status === 'OPEN').length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{wagers.filter(w => w.status === 'WON').length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Won</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{wagers.filter(w => w.status === 'LOST').length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Lost</div>
            </div>
          </div>

          {/* Wagers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wagers.map((w) => (
              <div
                key={w.wager_id}
                style={{
                  padding: '15px',
                  border: w.isDemoData ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: w.isDemoData ? '#fffbeb' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 6px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                      #{w.picked_seed}
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{w.picked_team_name}</span>
                    <span style={{ color: '#6b7280' }}>vs</span>
                    <span style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 6px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                      #{w.opp_seed}
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{w.opponent_team_name}</span>
                  </div>

                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor:
                      w.status === 'WON' ? '#dcfce7' :
                      w.status === 'LOST' ? '#fee2e2' :
                      w.status === 'OPEN' ? '#dbeafe' : '#f3f4f6',
                    color:
                      w.status === 'WON' ? '#166534' :
                      w.status === 'LOST' ? '#dc2626' :
                      w.status === 'OPEN' ? '#1d4ed8' : '#374151'
                  }}>
                    {w.status}
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Stake: </span>
                  <span style={{ fontWeight: 'bold' }}>{w.stake_points} points</span>
                  <span style={{ margin: '0 10px', color: '#6b7280' }}>•</span>
                  <span style={{ color: '#6b7280' }}>Odds: </span>
                  <span style={{ fontWeight: 'bold' }}>{w.posted_odds}x</span>
                  {w.expected_payout && (
                    <>
                      <span style={{ margin: '0 10px', color: '#6b7280' }}>•</span>
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>Expected: {w.expected_payout.toFixed(2)} pts</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                  <span>{new Date(w.placed_at).toLocaleDateString()} at {new Date(w.placed_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  {w.isDemoData && (
                    <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>Demo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}