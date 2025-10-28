import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface WagerPlacementProps {
  gameId: number;
  teamA: {
    id: number;
    name: string;
    seed: number;
  };
  teamB: {
    id: number;
    name: string;
    seed: number;
  };
  poolId: string;
  onWagerPlaced?: (wager: any) => void;
}

interface WagerData {
  poolId: string;
  gameId: number;
  teamId: number;
  amount: number;
}

export default function WagerPlacement({ gameId, teamA, teamB, poolId, onWagerPlaced }: WagerPlacementProps) {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);

  // Calculate odds: M = clip(1 + seed_picked / seed_opponent, 1.1, 3.5)
  // Your multiplier is based on YOUR seed - picking favorite (seed 1) gives lower payout
  const calculateOdds = (pickedSeed: number, oppSeed: number): number => {
    const rawOdds = 1.0 + (pickedSeed / oppSeed);
    return Math.max(1.1, Math.min(3.5, rawOdds));
  };

  const getOdds = () => {
    if (!selectedTeam) return 0;
    const pickedSeed = selectedTeam === teamA.id ? teamA.seed : teamB.seed;
    const oppSeed = selectedTeam === teamA.id ? teamB.seed : teamA.seed;
    return calculateOdds(pickedSeed, oppSeed);
  };

  const getExpectedPayout = (): number => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return 0;
    return amountNum * getOdds();
  };

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/leaderboard?poolId=${poolId}`);
      // For now, we'll use the first user as a placeholder - in a real app, this would be the authenticated user
      if (response.data && response.data.length > 0) {
        setUserBalance(response.data[0].current_points || 0);
      }
    } catch (err) {
      console.error('Error fetching user balance:', err);
      setError('Failed to fetch user balance');
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, [poolId]);

  const validateWager = (): string | null => {
    if (!selectedTeam) return 'Please select a team';
    if (!amount) return 'Please enter a wager amount';
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return 'Please enter a valid amount';
    if (amountNum > userBalance) return 'Insufficient balance';
    if (amountNum < 0.01) return 'Minimum wager is 0.01 points';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateWager();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const wagerData: WagerData = {
        poolId,
        gameId,
        teamId: selectedTeam,
        amount: parseFloat(amount)
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE}/api/wagers`, wagerData, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // DEV user ID (zach) - in production this would come from auth
        },
      });

      if (response.status === 201) {
        setSuccess('Wager placed successfully!');
        setAmount('');
        setSelectedTeam(null);
        if (onWagerPlaced) {
          onWagerPlaced(response.data.wager);
        }
        // Refresh balance
        fetchUserBalance();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to place wager';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedTeamData = selectedTeam === teamA.id ? teamA : selectedTeam === teamB.id ? teamB : null;

  return (
    <div className="wager-placement">
      <h3>Place a Wager</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="balance-info">
        <p>Your Balance: <strong>{userBalance.toFixed(2)} points</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="wager-form">
        <div className="team-selection">
          <h4>Select Team:</h4>
          <div className="team-options">
            <label className={`team-option ${selectedTeam === teamA.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="team"
                value={teamA.id}
                checked={selectedTeam === teamA.id}
                onChange={(e) => setSelectedTeam(Number(e.target.value))}
              />
              <span className="team-info">
                <strong>#{teamA.seed} {teamA.name}</strong>
              </span>
            </label>
            
            <label className={`team-option ${selectedTeam === teamB.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="team"
                value={teamB.id}
                checked={selectedTeam === teamB.id}
                onChange={(e) => setSelectedTeam(Number(e.target.value))}
              />
              <span className="team-info">
                <strong>#{teamB.seed} {teamB.name}</strong>
              </span>
            </label>
          </div>
        </div>

        <div className="amount-selection">
          <label htmlFor="amount">
            <h4>Wager Amount (points):</h4>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              max={userBalance}
              step="0.01"
              placeholder="Enter amount"
              required
            />
          </label>
        </div>

        {selectedTeam && amount && (
          <div className="wager-summary">
            <h4>Wager Summary:</h4>
            <div className="summary-details">
              <p><strong>Selected Team:</strong> #{selectedTeamData?.seed} {selectedTeamData?.name}</p>
              <p><strong>Wager Amount:</strong> {parseFloat(amount).toFixed(2)} points</p>
              <p><strong>Odds:</strong> {getOdds().toFixed(4)}</p>
              <p><strong>Expected Payout:</strong> {getExpectedPayout().toFixed(2)} points</p>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !!validateWager()}
          className="place-wager-btn"
        >
          {loading ? 'Placing Wager...' : 'Place Wager'}
        </button>
        
        {validateWager() && (
          <div className="validation-error">
            {validateWager()}
          </div>
        )}
      </form>
    </div>
  );
}
