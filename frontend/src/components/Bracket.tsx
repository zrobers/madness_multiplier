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

interface BracketMatch {
  id: number;
  round: number;
  region: string;
  gameNo: number;
  teamA: {
    id: number;
    name: string;
    seed: number;
    score: number | null;
    isWinner: boolean;
  };
  teamB: {
    id: number;
    name: string;
    seed: number;
    score: number | null;
    isWinner: boolean;
  };
  status: string;
}

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

  // Transform games into bracket matches and generate Round of 32
  const createBracketMatches = (): BracketMatch[] => {
    const bracketMatches: BracketMatch[] = [];
    
    // Add existing games from database
    games.forEach(game => {
      const isFinal = game.status === 'FINAL';
      const winnerId = isFinal ? game.winner_team_id : null;
      
      bracketMatches.push({
        id: game.game_id,
        round: game.round_code,
        region: game.region,
        gameNo: game.game_no,
        teamA: {
          id: game.team_a_id,
          name: game.team_a_name,
          seed: game.team_a_seed,
          score: game.score_a,
          isWinner: isFinal && winnerId === game.team_a_id
        },
        teamB: {
          id: game.team_b_id,
          name: game.team_b_name,
          seed: game.team_b_seed,
          score: game.score_b,
          isWinner: isFinal && winnerId === game.team_b_id
        },
        status: game.status
      });
    });

    // Generate Round of 32 matches from Round of 64 winners
    const round64Games = games.filter(game => game.round_code === 1);
    const round64Winners = round64Games
      .filter(game => game.status === 'FINAL' && game.winner_team_id)
      .map(game => ({
        id: game.winner_team_id,
        name: game.winner_name!,
        seed: game.winner_team_id === game.team_a_id ? game.team_a_seed : game.team_b_seed,
        region: game.region,
        gameNo: game.game_no
      }));

    // Group winners by region and sort by game number
    const winnersByRegion = round64Winners.reduce((acc, winner) => {
      if (!acc[winner.region]) acc[winner.region] = [];
      acc[winner.region].push(winner);
      return acc;
    }, {} as Record<string, typeof round64Winners>);

    // Create Round of 32 matches
    Object.entries(winnersByRegion).forEach(([region, winners]) => {
      const sortedWinners = winners.sort((a, b) => a.gameNo - b.gameNo);
      
      // Create matches by pairing adjacent winners
      for (let i = 0; i < sortedWinners.length; i += 2) {
        if (i + 1 < sortedWinners.length) {
          const teamA = sortedWinners[i];
          const teamB = sortedWinners[i + 1];
          
          bracketMatches.push({
            id: 10000 + parseInt(region.slice(0, 1)) * 100 + Math.floor(i / 2), // Generate unique ID
            round: 2,
            region: region,
            gameNo: Math.floor(i / 2) + 1,
            teamA: {
              id: teamA.id,
              name: teamA.name,
              seed: teamA.seed,
              score: null,
              isWinner: false
            },
            teamB: {
              id: teamB.id,
              name: teamB.name,
              seed: teamB.seed,
              score: null,
              isWinner: false
            },
            status: 'SCHEDULED'
          });
        }
      }
    });

    return bracketMatches;
  };

  const bracketMatches = createBracketMatches();

  // Group matches by region first, then by round within each region
  const matchesByRegionAndRound = bracketMatches.reduce((acc, match) => {
    if (!acc[match.region]) acc[match.region] = {};
    if (!acc[match.region][match.round]) acc[match.region][match.round] = [];
    acc[match.region][match.round].push(match);
    return acc;
  }, {} as Record<string, Record<number, BracketMatch[]>>);

  // Sort matches within each round by game number
  Object.keys(matchesByRegionAndRound).forEach(region => {
    Object.keys(matchesByRegionAndRound[region]).forEach(roundStr => {
      const round = parseInt(roundStr);
      matchesByRegionAndRound[region][round].sort((a, b) => a.gameNo - b.gameNo);
    });
  });

  const getRoundName = (round: number): string => {
    const roundNames: Record<number, string> = {
      1: "Round of 64",
      2: "Round of 32",
      3: "Sweet 16",
      4: "Elite Eight",
      5: "Final Four",
      6: "Championship"
    };
    return roundNames[round] || `Round ${round}`;
  };

  const renderMatch = (match: BracketMatch) => {
    const isScheduled = match.status === 'SCHEDULED';
    
    return (
      <div key={match.id} className={`bracket-match ${isScheduled ? 'scheduled' : ''}`}>
        <div className="match-header">
          <span className="match-region">{match.region}</span>
          <span className="match-game">Game {match.gameNo}</span>
          {isScheduled && <span className="match-status">SCHEDULED</span>}
        </div>
        <div className="match-teams">
          <div className={`team ${match.teamA.isWinner ? 'winner' : ''}`}>
            <span className="team-seed">#{match.teamA.seed}</span>
            <span className="team-name">{match.teamA.name}</span>
            {match.teamA.score !== null && (
              <span className="team-score">{match.teamA.score}</span>
            )}
          </div>
          <div className={`team ${match.teamB.isWinner ? 'winner' : ''}`}>
            <span className="team-seed">#{match.teamB.seed}</span>
            <span className="team-name">{match.teamB.name}</span>
            {match.teamB.score !== null && (
              <span className="team-score">{match.teamB.score}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRegion = (regionName: string, regionMatches: Record<number, BracketMatch[]>) => {
    return (
      <div key={regionName} className="bracket-region">
        <div className="region-header">
          <h3>{regionName} Region</h3>
        </div>
        <div className="region-bracket">
          {Object.entries(regionMatches)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([roundStr, roundMatches]) => (
              <div key={roundStr} className="bracket-round">
                <div className="round-header">
                  {getRoundName(parseInt(roundStr))}
                </div>
                <div className="round-matches">
                  {roundMatches.map(renderMatch)}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="cardTitle">Tournament Bracket</div>
      <div className="bracket-container">
        <div className="bracket-layout">
          {Object.entries(matchesByRegionAndRound)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([regionName, regionMatches]) => renderRegion(regionName, regionMatches))}
        </div>
      </div>
    </div>
  );
}
