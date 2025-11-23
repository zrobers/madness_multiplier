import React, { useEffect, useState } from "react";

interface Game {
  game_id: number;
  season_year: number;
  round_code: number;
  region: string;
  game_no: number;
  start_time_utc: string;
  team_a_id: number;
  team_b_id: number;
  team_a_seed: number;
  team_b_seed: number;
  status: string;
  score_a: number | null;
  score_b: number | null;
  winner_team_id: number | null;
  winner_name: string | null;
  team_a_name: string;
  team_b_name: string;
}

interface BracketMatch {
  id: number;
  round: number;
  region: string;
  gameNo: number;
  startTime?: string;
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

interface GameWager {
  wager_id: string | number;
  user_id: string;
  game_id: number;
  picked_team_id: number;
  picked_team_name?: string;
  opponent_team_name?: string;
  picked_seed: number;
  opp_seed: number;
  stake_points: number;
  posted_odds: number;
  status: string;
  payout_points?: number | null;
}

export default function Bracket() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // inline wager panel state
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [wagerError, setWagerError] = useState<string>("");
  const [wagerSuccess, setWagerSuccess] = useState<string>("");
  const [currentGameWagers, setCurrentGameWagers] = useState<GameWager[] | null>(null);
  const [wagersLoading, setWagersLoading] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/games?season=2024");
      const data = await res.json();
      setGames(data.games || []);
    } catch (e) {
      console.error("Error fetching games", e);
    } finally {
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

  // ---------- transform raw games -> bracket matches ----------

  const createBracketMatches = (): BracketMatch[] => {
    const bracketMatches: BracketMatch[] = [];

    // existing games from DB
    games.forEach((game) => {
      const isFinal = game.status === "FINAL";
      const winnerId = isFinal ? game.winner_team_id : null;

      bracketMatches.push({
        id: game.game_id,
        round: game.round_code,
        region: game.region,
        gameNo: game.game_no,
        startTime: game.start_time_utc,
        teamA: {
          id: game.team_a_id,
          name: game.team_a_name,
          seed: game.team_a_seed,
          score: game.score_a,
          isWinner: isFinal && winnerId === game.team_a_id,
        },
        teamB: {
          id: game.team_b_id,
          name: game.team_b_name,
          seed: game.team_b_seed,
          score: game.score_b,
          isWinner: isFinal && winnerId === game.team_b_id,
        },
        status: game.status,
      });
    });

    // Generate Round of 32 from Round of 64 winners (round_code === 1)
    const round64Games = games.filter((g) => g.round_code === 1);
    const round64Winners = round64Games
      .filter((g) => g.status === "FINAL" && g.winner_team_id)
      .map((g) => ({
        id: g.winner_team_id!,
        name: g.winner_name!,
        seed: g.winner_team_id === g.team_a_id ? g.team_a_seed : g.team_b_seed,
        region: g.region,
        gameNo: g.game_no,
      }));

    const winnersByRegion = round64Winners.reduce(
      (acc, w) => {
        if (!acc[w.region]) acc[w.region] = [];
        acc[w.region].push(w);
        return acc;
      },
      {} as Record<string, typeof round64Winners>
    );

    Object.entries(winnersByRegion).forEach(([region, winners]) => {
      const sorted = winners.sort((a, b) => a.gameNo - b.gameNo);

      for (let i = 0; i < sorted.length; i += 2) {
        if (i + 1 >= sorted.length) break;
        const teamA = sorted[i];
        const teamB = sorted[i + 1];

        bracketMatches.push({
          id: 10000 + region.charCodeAt(0) * 100 + i,
          round: 2, // Round of 32
          region,
          gameNo: Math.floor(i / 2) + 1,
          teamA: {
            id: teamA.id,
            name: teamA.name,
            seed: teamA.seed,
            score: null,
            isWinner: false,
          },
          teamB: {
            id: teamB.id,
            name: teamB.name,
            seed: teamB.seed,
            score: null,
            isWinner: false,
          },
          status: "SCHEDULED",
        });
      }
    });

    return bracketMatches;
  };

  const allMatches = createBracketMatches();

  // split regional (rounds 1–4) vs finals (5–6)
  const regionalMatches = allMatches.filter((m) => m.round <= 4);
  const finalsMatches = allMatches.filter((m) => m.round >= 5);

  // group regional by region + round
  const matchesByRegionAndRound = regionalMatches.reduce(
    (acc, match) => {
      if (!acc[match.region]) acc[match.region] = {};
      if (!acc[match.region][match.round]) acc[match.region][match.round] = [];
      acc[match.region][match.round].push(match);
      return acc;
    },
    {} as Record<string, Record<number, BracketMatch[]>>
  );

  Object.keys(matchesByRegionAndRound).forEach((region) => {
    Object.keys(matchesByRegionAndRound[region]).forEach((roundStr) => {
      const round = parseInt(roundStr, 10);
      matchesByRegionAndRound[region][round].sort(
        (a, b) => a.gameNo - b.gameNo
      );
    });
  });

  // group finals by round (5 = Final Four, 6 = Championship)
  const finalsByRound = finalsMatches.reduce(
    (acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, BracketMatch[]>
  );

  const getRoundName = (round: number): string => {
    const roundNames: Record<number, string> = {
      1: "Round of 64",
      2: "Round of 32",
      3: "Sweet 16",
      4: "Elite Eight",
      5: "Final Four",
      6: "Championship",
    };
    return roundNames[round] || `Round ${round}`;
  };

  // ---------- interaction ----------

  const handleMatchClick = async (match: BracketMatch) => {
    // Always open the panel
    setSelectedMatch(match);
    setSelectedTeamId(null);
    setAmount("");
    setWagerError("");
    setWagerSuccess("");

    // For completed games, fetch wagers to show history
    if (match.status !== "SCHEDULED") {
      setWagersLoading(true);
      try {
        const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // DEV user (zach)
        const poolId = "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66"; // DEV pool

        const params = new URLSearchParams({
          userId,
          poolId,
          gameId: String(match.id),
        });

        const res = await fetch(
          `http://localhost:4000/api/wagers?${params.toString()}`,
          {
            headers: {
              "X-User-Id": userId,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.wagers)) {
            const allWagers = data.wagers as GameWager[];
            const filtered = allWagers.filter(
              (w) => Number(w.game_id) === match.id
            );
            setCurrentGameWagers(filtered);
          } else {
            setCurrentGameWagers([]);
          }
        } else {
          console.error("Failed to fetch wagers for game", res.status);
          setCurrentGameWagers([]);
        }
      } catch (err) {
        console.error("Error fetching wagers for game", err);
        setCurrentGameWagers([]);
      } finally {
        setWagersLoading(false);
      }
    } else {
      // Fresh scheduled game, no wagers loaded yet
      setCurrentGameWagers(null);
      setWagersLoading(false);
    }
  };

  const handlePlaceWager = () => {
    if (!selectedMatch || selectedMatch.status !== "SCHEDULED") return;
    if (!selectedTeamId || !amount) return;

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setWagerError("Enter a valid amount");
      setWagerSuccess("");
      return;
    }

    console.log("Placing wager", {
      gameId: selectedMatch.id,
      teamId: selectedTeamId,
      amount: amt,
    });

    setWagerError("");
    setWagerSuccess("Wager saved (demo only)");
  };

  const renderMatch = (match: BracketMatch) => {
    const isScheduled = match.status === "SCHEDULED";

    return (
      <div
        key={match.id}
        className={`bracket-match ${isScheduled ? "scheduled" : ""}`}
        onClick={() => handleMatchClick(match)}
      >
        <div className="match-header">
          <span className="match-region">{match.region}</span>
          <span className="match-game">Game {match.gameNo}</span>
          {isScheduled && <span className="match-status">SCHEDULED</span>}
        </div>
        <div className="match-teams">
          <div className={`team ${match.teamA.isWinner ? "winner" : ""}`}>
            <span className="team-seed">#{match.teamA.seed}</span>
            <span className="team-name">{match.teamA.name}</span>
            {match.teamA.score !== null && (
              <span className="team-score">{match.teamA.score}</span>
            )}
          </div>
          <div className={`team ${match.teamB.isWinner ? "winner" : ""}`}>
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

  const renderRegion = (
    regionName: string,
    regionMatches: Record<number, BracketMatch[]>
  ) => {
    return (
      <div key={regionName} className="bracket-region">
        <div className="region-header">
          <h3>{regionName} Region</h3>
        </div>
        <div className="region-bracket">
          {Object.entries(regionMatches)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
            .map(([roundStr, roundMatches]) => (
              <div key={roundStr} className="bracket-round">
                <div className="round-header">
                  {getRoundName(parseInt(roundStr, 10))}
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

  const isSelectedScheduled =
    selectedMatch && selectedMatch.status === "SCHEDULED";

  return (
    <div className="card">
      <div className="lbHeader">TOURNAMENT BRACKET</div>

      {/* inline wager / details panel */}
      {selectedMatch && (
        <div className="inline-wager-wrapper">
          <div className="inline-wager">
            <div className="wager-header">
              <div>
                <div className="wager-title">
                  {isSelectedScheduled ? "Place Wager" : "Game Details"}
                </div>
                <div className="wager-subtitle">
                  {selectedMatch.teamA.name} vs {selectedMatch.teamB.name} •{" "}
                  {getRoundName(selectedMatch.round)} • {selectedMatch.status}
                </div>
              </div>
            </div>

            {/* Top section: pick UI for scheduled games, score summary for completed games */}
            {isSelectedScheduled ? (
              <div className="wager-row wager-teams">
                <label className="wager-label">Pick a side</label>
                <div className="team-options">
                  <label
                    className={`team-option ${
                      selectedTeamId === selectedMatch.teamA.id ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={selectedMatch.teamA.id}
                      checked={selectedTeamId === selectedMatch.teamA.id}
                      onChange={() =>
                        setSelectedTeamId(selectedMatch.teamA.id)
                      }
                    />
                    <div className="team-info">
                      <span className="seed">
                        Seed #{selectedMatch.teamA.seed}
                      </span>
                      <span className="name">{selectedMatch.teamA.name}</span>
                    </div>
                  </label>

                  <label
                    className={`team-option ${
                      selectedTeamId === selectedMatch.teamB.id ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={selectedMatch.teamB.id}
                      checked={selectedTeamId === selectedMatch.teamB.id}
                      onChange={() =>
                        setSelectedTeamId(selectedMatch.teamB.id)
                      }
                    />
                    <div className="team-info">
                      <span className="seed">
                        Seed #{selectedMatch.teamB.seed}
                      </span>
                      <span className="name">{selectedMatch.teamB.name}</span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="wager-row">
                <label className="wager-label">Final Score</label>
                <div className="match-teams">
                  <div
                    className={`team ${
                      selectedMatch.teamA.isWinner ? "winner" : ""
                    }`}
                  >
                    <span className="team-seed">
                      #{selectedMatch.teamA.seed}
                    </span>
                    <span className="team-name">
                      {selectedMatch.teamA.name}
                    </span>
                    {selectedMatch.teamA.score !== null && (
                      <span className="team-score">
                        {selectedMatch.teamA.score}
                      </span>
                    )}
                  </div>
                  <div
                    className={`team ${
                      selectedMatch.teamB.isWinner ? "winner" : ""
                    }`}
                  >
                    <span className="team-seed">
                      #{selectedMatch.teamB.seed}
                    </span>
                    <span className="team-name">
                      {selectedMatch.teamB.name}
                    </span>
                    {selectedMatch.teamB.score !== null && (
                      <span className="team-score">
                        {selectedMatch.teamB.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled-game wager input + actions */}
            {isSelectedScheduled && (
              <>
                <div className="wager-row">
                  <label className="wager-label">Wager Amount</label>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="wager-input"
                    placeholder="Enter points to wager"
                  />
                </div>

                {wagerError && (
                  <div className="sidebar-error">{wagerError}</div>
                )}
                {wagerSuccess && (
                  <div className="sidebar-success">{wagerSuccess}</div>
                )}

                <div className="wager-actions">
                  <button
                    className="place-wager-btn"
                    onClick={handlePlaceWager}
                    disabled={!selectedTeamId || !amount}
                  >
                    Place Wager
                  </button>
                  <button
                    className="cancel-wager-btn"
                    onClick={() => {
                      setSelectedMatch(null);
                      setSelectedTeamId(null);
                      setAmount("");
                      setWagerError("");
                      setWagerSuccess("");
                      setCurrentGameWagers(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Completed-game wagers + close */}
            {!isSelectedScheduled && (
              <>
                <div className="wager-row">
                  <label className="wager-label">
                    Your Wagers on this Game
                  </label>
                  {wagersLoading ? (
                    <div className="wager-label">Loading wagers...</div>
                  ) : currentGameWagers && currentGameWagers.length > 0 ? (
                    <div className="game-wagers">
                      {currentGameWagers.map((w) => (
                        <div key={w.wager_id} className="game-wager-row">
                          <div className="game-wager-main">
                            <span className="game-wager-team">
                              #{w.picked_seed}{" "}
                              {w.picked_team_name || `Team ${w.picked_team_id}`}
                            </span>
                            <span className="game-wager-amount">
                              {w.stake_points.toFixed(2)} pts @{" "}
                              {w.posted_odds.toFixed(2)}x
                            </span>
                          </div>
                          <div className="game-wager-status">
                            {w.status}
                            {typeof w.payout_points === "number" &&
                              ` • Payout: ${w.payout_points.toFixed(2)} pts`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="wager-label">
                      You have no wagers on this game.
                    </div>
                  )}
                </div>
                <div className="wager-actions">
                  <button
                    className="cancel-wager-btn"
                    onClick={() => {
                      setSelectedMatch(null);
                      setSelectedTeamId(null);
                      setAmount("");
                      setWagerError("");
                      setWagerSuccess("");
                      setCurrentGameWagers(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* top: 4 regions */}
      <div className="bracket-container">
        <div className="bracket-layout">
          {Object.entries(matchesByRegionAndRound)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([regionName, regionMatches]) =>
              renderRegion(regionName, regionMatches)
            )}
        </div>
      </div>

      {/* bottom: Final Four + Championship */}
      {finalsMatches.length > 0 && (
        <div className="finals-container">
          <h3 className="finals-title">Final Four &amp; Championship</h3>
          <div className="finals-rounds">
            {[5, 6].map((round) =>
              finalsByRound[round] && finalsByRound[round].length ? (
                <div key={round} className="bracket-round">
                  <div className="round-header">{getRoundName(round)}</div>
                  <div className="round-matches">
                    {finalsByRound[round].map(renderMatch)}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}