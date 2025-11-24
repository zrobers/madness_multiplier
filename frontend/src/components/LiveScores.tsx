import React, { useEffect, useState } from "react";

interface LiveScoreGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  time: string;
  date: string;
  league: string;
  venue: string | null;
  gameState: 'LIVE' | 'FINAL' | 'SCHEDULED';
}

interface LiveScoresResponse {
  date: string;
  games: LiveScoreGame[];
  source: string;
}

export default function LiveScores() {
  const [games, setGames] = useState<LiveScoreGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    fetchLiveScores();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveScores = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:4000/api/live-scores');
      if (!response.ok) {
        throw new Error(`Failed to fetch live scores: ${response.status}`);
      }
      const data: LiveScoresResponse = await response.json();
      setGames(data.games || []);
      setDate(data.date);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching live scores:", err);
      setError(err instanceof Error ? err.message : "Failed to load live scores");
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    // Try to parse and format the time
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
    } catch (e) {
      // If parsing fails, return the original string
    }
    return timeStr;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardTitle">POC: Live Basketball Scores</div>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          Loading today's games...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="cardTitle">POC: Live Basketball Scores</div>
        <div style={{ padding: '16px', textAlign: 'center', color: '#dc2626' }}>
          {error}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="card">
        <div className="cardTitle">POC: Live Basketball Scores</div>
        <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
          No games scheduled for today.
        </div>
      </div>
    );
  }

  // Group games by status
  const liveGames = games.filter(g => g.gameState === 'LIVE');
  const finalGames = games.filter(g => g.gameState === 'FINAL');
  const scheduledGames = games.filter(g => g.gameState === 'SCHEDULED');

  return (
    <div className="card">
      <div className="lbHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>POC: Live Basketball Scores</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280' }}>
          Powered by TheSportsDB
        </span>
      </div>
      
      {date && (
        <div style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}

      {/* Live Games */}
      {liveGames.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderBottom: '2px solid #dc2626'
          }}>
            🔴 LIVE ({liveGames.length})
          </div>
          <div className="gameStrip" role="list">
            {liveGames.map((game) => (
              <div key={game.id} className="gameTile" role="listitem">
                <div className="meta">
                  <div className="time" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                    LIVE
                  </div>
                  <div className="net">{game.league}</div>
                </div>
                <div className="teams">
                  <TeamRow 
                    team={game.homeTeam}
                    score={game.homeScore}
                    isHome={true}
                  />
                  <TeamRow 
                    team={game.awayTeam}
                    score={game.awayScore}
                    isHome={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <div style={{ marginTop: liveGames.length > 0 ? '24px' : '16px' }}>
          <div style={{ 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #153e8a'
          }}>
            Scheduled ({scheduledGames.length})
          </div>
          <div className="gameStrip" role="list">
            {scheduledGames.map((game) => (
              <div key={game.id} className="gameTile" role="listitem">
                <div className="meta">
                  <div className="time">{formatTime(game.time)}</div>
                  <div className="net">{game.league}</div>
                </div>
                <div className="teams">
                  <TeamRow 
                    team={game.homeTeam}
                    score={null}
                    isHome={true}
                  />
                  <TeamRow 
                    team={game.awayTeam}
                    score={null}
                    isHome={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Games */}
      {finalGames.length > 0 && (
        <div style={{ marginTop: (liveGames.length > 0 || scheduledGames.length > 0) ? '24px' : '16px' }}>
          <div style={{ 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #64748b'
          }}>
            Final ({finalGames.length})
          </div>
          <div className="gameStrip" role="list">
            {finalGames.map((game) => {
              const homeWon = game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore;
              const awayWon = game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore;
              
              return (
                <div key={game.id} className="gameTile" role="listitem">
                  <div className="meta">
                    <div className="time" style={{ color: '#64748b' }}>FINAL</div>
                    <div className="net">{game.league}</div>
                  </div>
                  <div className="teams">
                    <TeamRow 
                      team={game.homeTeam}
                      score={game.homeScore}
                      isHome={true}
                      isWinner={homeWon}
                    />
                    <TeamRow 
                      team={game.awayTeam}
                      score={game.awayScore}
                      isHome={false}
                      isWinner={awayWon}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  score,
  isHome,
  isWinner = false,
}: {
  team: string;
  score: number | null;
  isHome: boolean;
  isWinner?: boolean;
}) {
  return (
    <div className={`teamRow ${isWinner ? 'winner' : ''}`}>
      <div className="teamMark">
        <span className="abbr" style={{ fontSize: '0.75rem' }}>
          {isHome ? '🏠' : '✈️'}
        </span>
      </div>
      <div className="teamName">{team}</div>
      {score !== null && score !== undefined ? (
        <div className="teamScore" style={{ 
          fontWeight: isWinner ? 'bold' : 'normal',
          color: isWinner ? '#153e8a' : '#64748b'
        }}>
          {score}
        </div>
      ) : (
        <div className="teamRec"></div>
      )}
    </div>
  );
}

