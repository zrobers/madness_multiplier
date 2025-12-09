import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

interface Game {
  game_id: number;
  round_code: string;
  region: string | null;
  game_no: number | null;
  start_time_utc: string;
  status: string;
  score_a: number | null;
  score_b: number | null;
  team_a_id: number;
  team_a_name: string;
  team_a_seed: number;
  team_b_id: number;
  team_b_name: string;
  team_b_seed: number;
  winner_team_id: number | null;
  winner_name: string | null;
  game_state: string;
}

interface WagerForm {
  gameId: number;
  teamId: number | null;
  amount: number;
}

const roundNames: Record<string, string> = {
  'R64': 'Round of 64',
  'R32': 'Round of 32',
  'S16': 'Sweet 16',
  'E8': 'Elite Eight',
  'F4': 'Final Four',
  'FINAL': 'Championship'
};

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

interface SubmitPicksProps {
  userId: string;
  userName?: string | null;
}

export default function SubmitPicks({ userId, userName }: SubmitPicksProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [wagers, setWagers] = useState<WagerForm[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');

  useEffect(() => {
    fetchPools();
  }, [userId]); // Re-fetch pools when userId changes

  // Refresh pools when page becomes visible (user returns from joining a pool)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        console.log('Page became visible, refreshing pools...');
        fetchPools();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Define fetchUserBalance before using it in useEffect
  const fetchUserBalance = useCallback(async () => {
    if (!selectedPoolId || !userId) {
      setUserBalance(0);
      return;
    }
    try {
      console.log(`Fetching balance for pool: ${selectedPoolId}, user: ${userId}`);
      const response = await axios.get(`http://localhost:4000/api/wagers/balance`, {
        params: { poolId: selectedPoolId },
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && typeof response.data.balance === 'number') {
        console.log(`Balance for pool ${selectedPoolId}:`, response.data.balance);
        setUserBalance(response.data.balance);
      } else {
        console.warn('Invalid balance response:', response.data);
        setUserBalance(0);
      }
    } catch (err: any) {
      console.error('Error fetching user balance:', err);
      console.error('Error details:', err.response?.data);
      console.error('Request was for poolId:', selectedPoolId, 'userId:', userId);
      setUserBalance(0); // Default to 0 if API fails
    }
  }, [selectedPoolId, userId]);

  // Fetch balance whenever selectedPoolId or userId changes
  useEffect(() => {
    if (selectedPoolId && userId) {
      fetchUserBalance();
    } else {
      setUserBalance(0);
    }
  }, [selectedPoolId, userId, fetchUserBalance]);

  useEffect(() => {
    if (selectedPoolId) {
      fetchGames();
      // Reset wagers when switching pools
      setWagers([]);
    } else if (!poolsLoading && pools.length === 0) {
      // If no pools available, still try to load some games for demo purposes
      fetchGames();
    }
  }, [selectedPoolId, poolsLoading, pools.length]);

  const fetchPools = async () => {
    if (!userId) {
      setPools([]);
      setPoolsLoading(false);
      return;
    }
    try {
      setPoolsLoading(true);
      console.log('Fetching pools for user:', userId);
      const response = await fetch('http://localhost:4000/api/pools/user', {
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Error fetching pools: ${response.statusText}`);
      const data = await response.json();
      console.log('Fetched pools:', data.pools?.length || 0);
      setPools(data.pools || []);
      
      // If we have pools and no selected pool, or if selected pool is no longer in list, select first pool
      if (data.pools && data.pools.length > 0) {
        if (!selectedPoolId || !data.pools.find((p: Pool) => p.pool_id === selectedPoolId)) {
          console.log('Setting selected pool to:', data.pools[0].pool_id);
          setSelectedPoolId(data.pools[0].pool_id);
        }
      } else {
        setSelectedPoolId('');
      }
    } catch (err: any) {
      console.error('Error fetching pools:', err);
      setPools([]); // Set empty pools array on error
      setSelectedPoolId('');
      // Don't set error here as it prevents the page from loading
    } finally {
      setPoolsLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      console.log('Fetching games...');
      const response = await fetch('http://localhost:4000/api/games?season=2024');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Games data:', data);
      
      // Filter for SCHEDULED games only
      const scheduledGames = data.games.filter((game: Game) => game.status === 'SCHEDULED');
      console.log('Scheduled games:', scheduledGames.length);
      
      // If no scheduled games, use demo games
      if (scheduledGames.length === 0) {
        console.log('No scheduled games found, using demo games');
        setError(`⚠️ No upcoming games - Using demo games for testing`);
        useDemoGames();
      } else {
        setGames(scheduledGames);
        // Initialize wagers for scheduled games (only if wagers array is empty or needs reset)
        setWagers(prev => {
          // If switching pools or wagers are empty, reset them
          if (prev.length === 0 || !selectedPoolId) {
            return scheduledGames.map((game: Game) => ({
              gameId: game.game_id,
              teamId: null,
              amount: 0
            }));
          }
          // Otherwise keep existing wagers but filter to only include current games
          return scheduledGames.map((game: Game) => {
            const existing = prev.find(w => w.gameId === game.game_id);
            return existing || { gameId: game.game_id, teamId: null, amount: 0 };
          });
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games from API, using demo games:", error);
      setError(`⚠️ API unavailable - Using demo games for testing`);
      useDemoGames();
      setLoading(false);
    }
  };

  const useDemoGames = () => {
    const demoGames: Game[] = [
      {
        game_id: 9001,
        round_code: 'R64',
        region: 'South',
        game_no: 1,
        start_time_utc: '2025-03-21T12:00:00Z',
        status: 'SCHEDULED',
        score_a: null,
        score_b: null,
        team_a_id: 9001,
        team_a_name: 'Duke',
        team_a_seed: 2,
        team_b_id: 9002,
        team_b_name: 'Princeton',
        team_b_seed: 15,
        winner_team_id: null,
        winner_name: null,
        game_state: 'UPCOMING'
      },
      {
        game_id: 9002,
        round_code: 'R64',
        region: 'East',
        game_no: 2,
        start_time_utc: '2025-03-21T14:30:00Z',
        status: 'SCHEDULED',
        score_a: null,
        score_b: null,
        team_a_id: 9003,
        team_a_name: 'Gonzaga',
        team_a_seed: 1,
        team_b_id: 9004,
        team_b_name: 'Arizona',
        team_b_seed: 16,
        winner_team_id: null,
        winner_name: null,
        game_state: 'UPCOMING'
      },
      {
        game_id: 9003,
        round_code: 'R64',
        region: 'West',
        game_no: 3,
        start_time_utc: '2025-03-21T17:00:00Z',
        status: 'SCHEDULED',
        score_a: null,
        score_b: null,
        team_a_id: 9005,
        team_a_name: 'Kansas',
        team_a_seed: 1,
        team_b_id: 9006,
        team_b_name: 'Kentucky',
        team_b_seed: 8,
        winner_team_id: null,
        winner_name: null,
        game_state: 'UPCOMING'
      },
      {
        game_id: 9004,
        round_code: 'R64',
        region: 'Midwest',
        game_no: 4,
        start_time_utc: '2025-03-21T19:30:00Z',
        status: 'SCHEDULED',
        score_a: null,
        score_b: null,
        team_a_id: 9007,
        team_a_name: 'UConn',
        team_a_seed: 1,
        team_b_id: 9008,
        team_b_name: 'Alabama',
        team_b_seed: 4,
        winner_team_id: null,
        winner_name: null,
        game_state: 'UPCOMING'
      }
    ];
    
    console.log('Using demo games:', demoGames.length);
    setGames(demoGames);
    setWagers(demoGames.map((game: Game) => ({
      gameId: game.game_id,
      teamId: null,
      amount: 0
    })));
  };

  const updateWager = (gameId: number, field: 'teamId' | 'amount', value: number) => {
    setWagers(prev => prev.map(wager => 
      wager.gameId === gameId 
        ? { ...wager, [field]: value }
        : wager
    ));
  };

  const calculateOdds = (pickedSeed: number, oppSeed: number): number => {
    // M = clip(1 + seed_picked / seed_opponent, 1.1, 3.5)
    return Math.max(1.1, Math.min(3.5, 1.0 + (pickedSeed / oppSeed)));
  };

  const getExpectedPayout = (gameId: number): number => {
    const wager = wagers.find(w => w.gameId === gameId);
    if (!wager || !wager.teamId || wager.amount <= 0) return 0;
    
    const game = games.find(g => g.game_id === gameId);
    if (!game) return 0;
    
    const pickedSeed = wager.teamId === game.team_a_id ? game.team_a_seed : game.team_b_seed;
    const oppSeed = wager.teamId === game.team_a_id ? game.team_b_seed : game.team_a_seed;
    const odds = calculateOdds(pickedSeed, oppSeed);
    
    return wager.amount * odds;
  };

  const calculateTotalWagered = () => {
    return wagers.reduce((sum, wager) => sum + (wager.amount || 0), 0);
  };

  const validateWagers = (): string | null => {
    const total = calculateTotalWagered();
    const balance = typeof userBalance === 'number' ? userBalance : 0;
    if (total > balance) return `Insufficient balance. You have ${balance} points but want to wager ${total}`;
    if (total === 0) return 'Please place at least one wager';
    
    const invalidWagers = wagers.filter(w => w.teamId && w.amount > 0 && w.amount < 1);
    if (invalidWagers.length > 0) return 'Minimum wager amount is 1 point';
    
    return null;
  };

  const submitWagers = async () => {
    const validationError = validateWagers();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const validWagers = wagers.filter(w => w.teamId && w.amount > 0);
    const usingMockData = error.includes('mock');

    try {
      if (usingMockData) {
        // Save to localStorage for demo purposes
        const demoWagers = validWagers.map(wager => {
          const game = games.find(g => g.game_id === wager.gameId)!;
          const pickedSeed = wager.teamId === game.team_a_id ? game.team_a_seed : game.team_b_seed;
          const oppSeed = wager.teamId === game.team_a_id ? game.team_b_seed : game.team_a_seed;
          const odds = calculateOdds(pickedSeed, oppSeed);
          
          return {
            wager_id: `demo-${Date.now()}-${wager.gameId}`,
            pool_id: selectedPoolId,
            user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            game_id: wager.gameId,
            picked_team_id: wager.teamId,
            picked_team_name: wager.teamId === game.team_a_id ? game.team_a_name : game.team_b_name,
            opponent_team_name: wager.teamId === game.team_a_id ? game.team_b_name : game.team_a_name,
            picked_seed: pickedSeed,
            opp_seed: oppSeed,
            stake_points: wager.amount,
            posted_odds: odds,
            expected_payout: wager.amount * odds,
            status: 'DEMO',
            placed_at: new Date().toISOString(),
            game_start_time: game.start_time_utc,
            round_code: game.round_code
          };
        });

        // Get existing demo wagers from localStorage
        const existingDemoWagers = JSON.parse(localStorage.getItem('demoWagers') || '[]');
        localStorage.setItem('demoWagers', JSON.stringify([...existingDemoWagers, ...demoWagers]));

        setSuccess(`✅ Successfully placed ${demoWagers.length} DEMO wagers! (View them in "View Picks" tab)`);
        
        // Reset form
        setWagers(wagers.map(w => ({ ...w, teamId: null, amount: 0 })));
        
      } else {
        // Submit to real API - ensure we're using the selected pool
        if (!selectedPoolId) {
          setError('Please select a pool before submitting wagers');
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          validWagers.map(async (wager) => {
            const response = await axios.post('http://localhost:4000/api/wagers', {
              poolId: selectedPoolId, // Explicitly use selected pool
              gameId: wager.gameId,
              teamId: wager.teamId,
              amount: wager.amount,
              userName: userName
            }, {
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId
              }
            });
            return response.data;
          })
        );

        setSuccess(`Successfully placed ${results.length} wagers in this pool!`);
        fetchUserBalance(); // Refresh balance for the current pool
        
        // Reset form for this pool
        setWagers(wagers.map(w => ({ ...w, teamId: null, amount: 0 })));
      }
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to place wagers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const scheduledGames = games.filter(game => game.status === 'SCHEDULED');
  const gamesByRound = scheduledGames.reduce((acc, game) => {
    if (!acc[game.round_code]) acc[game.round_code] = [];
    acc[game.round_code].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  console.log('SubmitPicks render - loading:', loading, 'games:', games.length, 'error:', error);

  if (loading) {
    return (
      <div className="card">
        <div className="cardTitle">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="card">
        <div className="cardTitle">Submit Your Picks</div>

        {/* Pool Selection */}
        <div className="pool-selection" style={{ marginBottom: '16px' }}>
          <label htmlFor="pool-select" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Pool:
          </label>
          {poolsLoading ? (
            <div>Loading pools...</div>
          ) : pools.length === 0 ? (
            <div className="warning-message">No pools available. Please join a pool first from the Home page.</div>
          ) : (
            <select
              id="pool-select"
              value={selectedPoolId}
              onChange={async (e) => {
                const newPoolId = e.target.value;
                console.log('Pool changed to:', newPoolId);
                setSelectedPoolId(newPoolId);
                // Reset wagers when switching pools
                setWagers([]);
                // Explicitly fetch balance for the new pool
                // The useEffect will also trigger, but this ensures immediate update
                if (newPoolId && userId) {
                  try {
                    const response = await axios.get(`http://localhost:4000/api/wagers/balance`, {
                      params: { poolId: newPoolId },
                      headers: {
                        'X-User-Id': userId,
                        'Content-Type': 'application/json'
                      }
                    });
                    if (response.data && typeof response.data.balance === 'number') {
                      console.log(`Immediate balance update for pool ${newPoolId}:`, response.data.balance);
                      setUserBalance(response.data.balance);
                    }
                  } catch (err) {
                    console.error('Error fetching balance on pool change:', err);
                  }
                }
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
            >
              {pools.map((pool) => (
                <option key={pool.pool_id} value={pool.pool_id}>
                  {pool.name} ({pool.initial_points} pts)
                </option>
              ))}
            </select>
          )}
        </div>

        {error && error.includes('mock') && <div className="warning-message">{error}</div>}
        {error && !error.includes('mock') && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {games.length === 0 && !loading && (
          <div className="error-message">No games available for wagering.</div>
        )}

        {selectedPoolId && (
          <div className="balance-info">
            <p>Your Balance: <strong>{typeof userBalance === 'number' ? userBalance.toFixed(2) : '0.00'} points</strong></p>
            <p>Total Wagered: <strong>{calculateTotalWagered().toFixed(2)} points</strong></p>
            <p style={{
              color: ((typeof userBalance === 'number' ? userBalance : 0) - calculateTotalWagered()) < 50 ? '#dc2626' : '#059669',
              fontWeight: 'bold'
            }}>
              Remaining: <strong>{((typeof userBalance === 'number' ? userBalance : 0) - calculateTotalWagered()).toFixed(2)} points</strong>
            </p>
          </div>
        )}

        {!selectedPoolId && pools.length > 0 && (
          <div className="warning-message">
            Please select a pool above to view your balance and place wagers.
          </div>
        )}

        <div className="wager-instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Select a team for each game you want to wager on</li>
            <li>Enter the amount of points you want to wager (minimum 1 point)</li>
            <li>Higher seeds have lower odds but are safer bets</li>
            <li>Lower seeds have higher odds but are riskier bets</li>
          </ul>
        </div>

        {Object.entries(gamesByRound).map(([roundCode, roundGames]) => (
          <div key={roundCode} className="round-section">
            <h3 className="round-title">{roundNames[roundCode] || roundCode} ({roundGames.length} games)</h3>
            
            <div className="games-grid">
              {roundGames.map((game) => {
                const wager = wagers.find(w => w.gameId === game.game_id);
                const expectedPayout = getExpectedPayout(game.game_id);
                
                return (
                  <div key={game.game_id} className="game-wager-card">
                    <div className="game-header">
                      <div className="game-time">
                        {new Date(game.start_time_utc).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </div>
                      <div className="game-region">{game.region || 'TBD'}</div>
                    </div>
                    
                    <div className="teams-section">
                      <label className={`team-option ${wager?.teamId === game.team_a_id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name={`game-${game.game_id}`}
                          checked={wager?.teamId === game.team_a_id}
                          onChange={() => updateWager(game.game_id, 'teamId', game.team_a_id)}
                        />
                        <div className="team-info">
                          <span className="seed">#{game.team_a_seed}</span>
                          <span className="name">{game.team_a_name}</span>
                        </div>
                      </label>
                      
                      <div className="vs">VS</div>
                      
                      <label className={`team-option ${wager?.teamId === game.team_b_id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name={`game-${game.game_id}`}
                          checked={wager?.teamId === game.team_b_id}
                          onChange={() => updateWager(game.game_id, 'teamId', game.team_b_id)}
                        />
                        <div className="team-info">
                          <span className="seed">#{game.team_b_seed}</span>
                          <span className="name">{game.team_b_name}</span>
                        </div>
                      </label>
                    </div>
                    
                    <div className="wager-inputs">
                      <div className="amount-input">
                        <label>Wager Amount:</label>
                        <input
                          type="number"
                          min="0"
                          max={typeof userBalance === 'number' ? userBalance : 1000}
                          step="1"
                          value={wager?.amount || ''}
                          onChange={(e) => updateWager(game.game_id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      
                      {wager?.teamId && wager.amount > 0 && (
                        <div className="payout-info">
                          <div className="odds">
                            Odds: {calculateOdds(
                              wager.teamId === game.team_a_id ? game.team_a_seed : game.team_b_seed,
                              wager.teamId === game.team_a_id ? game.team_b_seed : game.team_a_seed
                            ).toFixed(2)}x
                          </div>
                          <div className="expected-payout">
                            Expected Payout: {expectedPayout.toFixed(2)} points
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {selectedPoolId && (
          <div className="submit-section">
            <button
              className="submit-wagers-btn"
              onClick={submitWagers}
              disabled={loading || !!validateWagers()}
            >
              {loading ? 'Submitting...' : `Submit ${wagers.filter(w => w.teamId && w.amount > 0).length} Wagers`}
            </button>

            {validateWagers() && (
              <div className="validation-error">
                {validateWagers()}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
