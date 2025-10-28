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
  round_code?: string | number;
  game_start_time?: string;
  
  // For display purposes
  isDemoData?: boolean;
}

export default function ViewPicks() {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasDemoData, setHasDemoData] = useState(false);
  const [poolId] = useState<string>('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66');
  const [userId] = useState<string>('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

  useEffect(() => {
    fetchWagers();
  }, []);

  const fetchWagers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const allWagers: Wager[] = [];
      
      // Try to fetch real wagers from API
      try {
        console.log('Fetching wagers for userId:', userId, 'poolId:', poolId);
        const response = await axios.get(`http://localhost:4000/api/wagers`, {
          params: { userId, poolId },
          headers: { 
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Wagers API response:', response.data);
        
        if (response.data && Array.isArray(response.data.wagers)) {
          console.log('Found', response.data.wagers.length, 'wagers from API');
          allWagers.push(...response.data.wagers.map((w: any) => ({ ...w, isDemoData: false })));
        }
      } catch (apiError: any) {
        console.error('Could not fetch wagers from API:', apiError.response?.data || apiError.message);
      }
      
      // Load demo wagers from localStorage
      const demoWagersJson = localStorage.getItem('demoWagers');
      if (demoWagersJson) {
        try {
          const demoWagers = JSON.parse(demoWagersJson);
          if (Array.isArray(demoWagers) && demoWagers.length > 0) {
            allWagers.push(...demoWagers.map((w: any) => ({ ...w, isDemoData: true })));
            setHasDemoData(true);
          }
        } catch (parseError) {
          console.error('Error parsing demo wagers:', parseError);
        }
      }
      
      // Sort by placed_at (newest first)
      allWagers.sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime());
      
      setWagers(allWagers);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching wagers:', err);
      setError('Failed to load your picks');
      setLoading(false);
    }
  };

  const getWagerStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'WON':
        return '#16a34a';
      case 'LOST':
        return '#dc2626';
      case 'OPEN':
      case 'PENDING':
        return '#3b82f6';
      case 'DEMO':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getWagerStatusText = (wager: Wager) => {
    if (wager.status === 'DEMO') {
      return '⚠️ DEMO DATA';
    }
    
    switch (wager.status.toUpperCase()) {
      case 'WON':
        return `Won +${wager.payout_points?.toFixed(2)} pts`;
      case 'LOST':
        return `Lost -${wager.stake_points.toFixed(2)} pts`;
      case 'OPEN':
      case 'PENDING':
        return 'Pending';
      default:
        return wager.status;
    }
  };

  const clearDemoData = () => {
    localStorage.removeItem('demoWagers');
    setHasDemoData(false);
    fetchWagers();
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
      
      {hasDemoData && (
        <div className="warning-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ Some picks are using DEMO DATA (not saved to database)</span>
          <button 
            onClick={clearDemoData}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Demo Data
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {wagers.length === 0 ? (
        <div className="no-picks-message">
          <p>You haven't placed any wagers yet.</p>
          <p>Go to <strong>Submit Picks</strong> to place your first wager!</p>
        </div>
      ) : (
        <div className="picks-list">
          {wagers.map((wager) => (
            <div 
              key={wager.wager_id} 
              className="pick-card"
              style={wager.isDemoData ? { border: '2px solid #f59e0b', background: '#fffbeb' } : {}}
            >
              <div className="pick-header">
                <div className="game-info">
                  <span className="game-matchup">
                    {wager.picked_team_name && wager.opponent_team_name ? (
                      `${wager.picked_team_name} vs ${wager.opponent_team_name}`
                    ) : (
                      `Game #${wager.game_id}`
                    )}
                  </span>
                  <span className="pick-time">
                    {new Date(wager.placed_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div 
                  className="pick-status"
                  style={{ color: getWagerStatusColor(wager.status) }}
                >
                  {getWagerStatusText(wager)}
                </div>
              </div>
              
              <div className="pick-details">
                <div className="pick-detail-item">
                  <span className="label">Your Pick:</span>
                  <span className="value">
                    #{wager.picked_seed} {wager.picked_team_name || `Team ${wager.picked_team_id}`}
                  </span>
                </div>
                <div className="pick-detail-item">
                  <span className="label">Opponent:</span>
                  <span className="value">
                    #{wager.opp_seed} {wager.opponent_team_name || 'Opponent'}
                  </span>
                </div>
                <div className="pick-detail-item">
                  <span className="label">Wager:</span>
                  <span className="value">{wager.stake_points.toFixed(2)} points</span>
                </div>
                <div className="pick-detail-item">
                  <span className="label">Odds:</span>
                  <span className="value">{wager.posted_odds.toFixed(2)}x</span>
                </div>
                <div className="pick-detail-item">
                  <span className="label">Potential Payout:</span>
                  <span className="value highlight">
                    {((wager.expected_payout || (wager.stake_points * wager.posted_odds))).toFixed(2)} points
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="picks-summary">
        <div className="summary-stat">
          <span className="stat-label">Total Wagers:</span>
          <span className="stat-value">{wagers.length}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Total Staked:</span>
          <span className="stat-value">
            {wagers.reduce((sum, w) => sum + w.stake_points, 0).toFixed(2)} pts
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Potential Winnings:</span>
          <span className="stat-value">
            {wagers
              .filter(w => w.status.toUpperCase() === 'OPEN' || w.status.toUpperCase() === 'PENDING')
              .reduce((sum, w) => sum + (w.stake_points * w.posted_odds), 0)
              .toFixed(2)} pts
          </span>
        </div>
      </div>
    </div>
  );
}

