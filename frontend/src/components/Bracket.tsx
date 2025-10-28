import React, { useState, useEffect } from "react";

interface Game {
  game_id: number;
  round_code: number;
  region: string;
  game_no: number;
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
  winner_name: string | null;
  game_state: string;
}

const roundNames: Record<number, string> = {
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship"
};

export default function Bracket() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/games?season=2024');
      const data = await response.json();
      setGames(data.games || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardTitle">Loading bracket...</div>
      </div>
    );
  }

  // Group games by round
  const gamesByRound = games.reduce((acc, game) => {
    if (!acc[game.round_code]) acc[game.round_code] = [];
    acc[game.round_code].push(game);
    return acc;
  }, {} as Record<number, Game[]>);

  // Render a simple bracket visualization
  const renderMatch = (game: Game) => {
    const hasScore = game.score_a !== null && game.score_b !== null;
    const winner = game.status === 'FINAL' ? game.winner_team_id : null;
    
    return (
      <div key={game.game_id} className="match" style={{
        border: hasScore ? '2px solid #153e8a' : '1px solid #e5e7eb'
      }}>
        <div style={{ padding: '8px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px',
            color: winner === game.team_a_id ? '#153e8a' : 'inherit',
            fontWeight: winner === game.team_a_id ? 'bold' : 'normal'
          }}>
            <span>#{game.team_a_seed} {game.team_a_name}</span>
            {hasScore && <span>{game.score_a}</span>}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: winner === game.team_b_id ? '#153e8a' : 'inherit',
            fontWeight: winner === game.team_b_id ? 'bold' : 'normal'
          }}>
            <span>#{game.team_b_seed} {game.team_b_name}</span>
            {hasScore && <span>{game.score_b}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="cardTitle">Tournament Bracket</div>
      <div className="bracket" style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
        {Object.entries(gamesByRound)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([roundCode, roundGames]) => (
            <div key={roundCode} className="round" style={{ minWidth: '200px' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                {roundNames[Number(roundCode)]}
              </div>
              {roundGames.map(renderMatch)}
            </div>
          ))}
      </div>
    </div>
  );
}
