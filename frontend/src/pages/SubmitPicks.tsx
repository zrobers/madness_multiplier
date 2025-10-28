import axios from 'axios';
import React, { useEffect, useState } from 'react';

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

export default function SubmitPicks() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [wagers, setWagers] = useState<WagerForm[]>([]);
  const [poolId] = useState<number>(1);

  useEffect(() => {
    fetchGames();
    fetchUserBalance();
  }, []);

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
      setGames(data.games || []);
      
      // Initialize wagers array for each scheduled game
      const scheduledGames = data.games.filter((game: Game) => game.status === 'SCHEDULED');
      console.log('Scheduled games:', scheduledGames.length);
      setWagers(scheduledGames.map((game: Game) => ({
        gameId: game.game_id,
        teamId: null,
        amount: 0
      })));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(`Failed to load games: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/leaderboard?poolId=${poolId}`);
      if (response.data && response.data.length > 0) {
        const balance = response.data[0].current_points;
        setUserBalance(typeof balance === 'number' ? balance : parseFloat(balance) || 0);
      }
    } catch (err) {
      console.error('Error fetching user balance:', err);
      setUserBalance(1000); // Default balance if API fails
    }
  };

  const updateWager = (gameId: number, field: 'teamId' | 'amount', value: number) => {
    setWagers(prev => prev.map(wager => 
      wager.gameId === gameId 
        ? { ...wager, [field]: value }
        : wager
    ));
  };

  const calculateOdds = (pickedSeed: number, oppSeed: number): number => {
    return Math.max(1.1, Math.min(3.5, 1.0 + (oppSeed / pickedSeed)));
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

    try {
      const validWagers = wagers.filter(w => w.teamId && w.amount > 0);
      
      // Submit each wager
      const results = await Promise.all(
        validWagers.map(async (wager) => {
          const response = await axios.post('http://localhost:4000/api/wagers', {
            poolId,
            gameId: wager.gameId,
            teamId: wager.teamId,
            amount: wager.amount
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': '1'
            }
          });
          return response.data;
        })
      );

      setSuccess(`Successfully placed ${results.length} wagers!`);
      fetchUserBalance(); // Refresh balance
      
      // Reset form
      setWagers(wagers.map(w => ({ ...w, teamId: null, amount: 0 })));
      
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
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {games.length === 0 && !loading && (
          <div className="error-message">No games available for wagering.</div>
        )}
        
        <div className="balance-info">
          <p>Your Balance: <strong>{typeof userBalance === 'number' ? userBalance.toFixed(2) : '0.00'} points</strong></p>
          <p>Total Wagered: <strong>{calculateTotalWagered().toFixed(2)} points</strong></p>
          <p>Remaining: <strong>{((typeof userBalance === 'number' ? userBalance : 0) - calculateTotalWagered()).toFixed(2)} points</strong></p>
        </div>

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
    </div>
  );
}
