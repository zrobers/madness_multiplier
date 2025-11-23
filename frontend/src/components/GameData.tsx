import React, { useEffect, useState } from "react";

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
  winner_team_id: number | null;
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

export default function GameData() {
  const [games, setGames] = useState<Game[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/games?season=2024');
      const data = await response.json();
      setGames(data.games || []);
      setCurrentTime(data.current_time);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games:", error);
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardTitle">Loading games...</div>
      </div>
    );
  }

  // Group games by round
  const gamesByRound = games.reduce((acc, game) => {
    if (!acc[game.round_code]) acc[game.round_code] = [];
    acc[game.round_code].push(game);
    return acc;
  }, {} as Record<number, Game[]>);

  return (
    <div className="card">
      <div className="lbHeader">MARCH MADNESS 2024</div>
      {Object.entries(gamesByRound).map(([roundCode, roundGames]) => (
        <div key={roundCode} style={{ marginBottom: '24px' }}>
          <div style={{ 
            padding: '8px 12px', 
            fontWeight: 'bold', 
            borderBottom: '2px solid #153e8a',
            backgroundColor: '#f8fafc'
          }}>
            {roundNames[Number(roundCode)]} ({roundGames.length} games)
          </div>
          <div className="gameStrip" role="list">
            {roundGames.map((game) => (
              <div className="gameTile" key={game.game_id} role="listitem">
                <div className="meta">
                  <div className="time">{formatTime(game.start_time_utc)}</div>
                  <div className="net">{game.region || 'TBD'}</div>
                </div>
                <div className="teams">
                  <TeamRow 
                    t={{ 
                      seed: game.team_a_seed, 
                      name: game.team_a_name,
                      score: game.score_a,
                      isWinner: game.status === 'FINAL' && game.winner_team_id === game.team_a_id
                    }} 
                  />
                  <TeamRow 
                    t={{ 
                      seed: game.team_b_seed, 
                      name: game.team_b_name,
                      score: game.score_b,
                      isWinner: game.status === 'FINAL' && game.winner_team_id === game.team_b_id
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamRow({
  t,
}: {
  t: { seed: number; name: string; record?: string; abbr?: string; score?: number | null; isWinner?: boolean };
}) {
  return (
    <div className={`teamRow ${t.isWinner ? 'winner' : ''}`}>
      <div className="teamMark">
        {t.abbr ? (
          <span className="abbr">{t.abbr}</span>
        ) : (
          <span className="seed">{t.seed}</span>
        )}
      </div>
      <div className="teamName">{t.name}</div>
      {t.score !== null && t.score !== undefined ? (
        <div className="teamScore" style={{ 
          fontWeight: t.isWinner ? 'bold' : 'normal',
          color: t.isWinner ? '#153e8a' : '#64748b'
        }}>
          {t.score}
        </div>
      ) : (
        <div className="teamRec">{t.record ?? ""}</div>
      )}
    </div>
  );
}