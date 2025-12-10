import React, { useEffect, useState } from "react";

//
// ---------- Types ----------
//

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
  winner_name: string | null;   // resolved by backend
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

interface BracketProps {
  poolId: string | null;
  userId: string | null;
  userName?: string | null;
}

export default function Bracket({ userId, userName, poolId }: BracketProps) {

  //
  // ---------- State ----------
  //

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");

  const [wagerError, setWagerError] = useState("");
  const [wagerSuccess, setWagerSuccess] = useState("");
  const [currentGameWagers, setCurrentGameWagers] = useState<GameWager[] | null>(null);
  const [wagersLoading, setWagersLoading] = useState(false);

  //
  // ---------- Fetch games ----------
  //

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

  //
  // ---------- Transform DB games into BracketMatches ----------
  //

  const createBracketMatches = (): BracketMatch[] => {
    const matches: BracketMatch[] = [];

    games.forEach((g) => {
      const isFinal = g.status === "FINAL";
      const winnerId = isFinal ? g.winner_team_id : null;

      matches.push({
        id: g.game_id,
        round: g.round_code,
        region: g.region,
        gameNo: g.game_no,
        startTime: g.start_time_utc,

        teamA: {
          id: g.team_a_id,
          name: g.team_a_name,
          seed: g.team_a_seed,
          score: g.score_a,
          isWinner: isFinal && winnerId === g.team_a_id,
        },
        teamB: {
          id: g.team_b_id,
          name: g.team_b_name,
          seed: g.team_b_seed,
          score: g.score_b,
          isWinner: isFinal && winnerId === g.team_b_id,
        },
        status: g.status,
      });
    });

    return matches;
  };

  const allMatches = createBracketMatches();

  //
  // ---------- Split into regional + finals ----------
  //

  const regionalMatches = allMatches.filter((m) => m.round <= 3 && m.round != 3);
  const finalsMatches = allMatches.filter((m) => m.round >= 5);

  //
  // Group regional: region → round → matches[]
  //

  const matchesByRegionAndRound = regionalMatches.reduce((acc, m) => {
    if (!acc[m.region]) acc[m.region] = {};
    if (!acc[m.region][m.round]) acc[m.region][m.round] = [];
    acc[m.region][m.round].push(m);
    return acc;
  }, {} as Record<string, Record<number, BracketMatch[]>>);

  Object.keys(matchesByRegionAndRound).forEach((region) => {
    Object.keys(matchesByRegionAndRound[region]).forEach((roundStr) => {
      const round = Number(roundStr);
      matchesByRegionAndRound[region][round].sort((a, b) => a.gameNo - b.gameNo);
    });
  });

  //
  // Finals grouped by round
  //

  const finalsByRound = finalsMatches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, BracketMatch[]>);

  //
  // ---------- Round Names ----------
  //

  const getRoundName = (r: number) =>
    ({
      1: "Round of 64",
      2: "Round of 32",
      3: "Sweet 16",
      4: "Elite Eight",
      5: "Final Four",
      6: "Championship",
    }[r] || `Round ${r}`);

  //
  // ---------- Match Click (open wager panel) ----------
  //

  const handleMatchClick = async (match: BracketMatch) => {
    setSelectedMatch(match);
    setSelectedTeamId(null);
    setAmount("");
    setWagerError("");
    setWagerSuccess("");

    // For completed games, fetch user wagers
    if (match.status !== "SCHEDULED") {
      setWagersLoading(true);

      try {
        const params = new URLSearchParams({
          userId: userId ?? "",
          poolId: poolId ?? "",
          gameId: String(match.id),
        });

        const res = await fetch(
          `http://localhost:4000/api/wagers?${params.toString()}`,
          {
            headers: {
              "X-User-Id": userId || "",
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();
        setCurrentGameWagers(Array.isArray(data.wagers) ? data.wagers : []);
      } catch (err) {
        console.error("Error fetching wagers", err);
        setCurrentGameWagers([]);
      } finally {
        setWagersLoading(false);
      }
    } else {
      setCurrentGameWagers(null);
    }
  };

  //
  // ---------- Place Wager ----------
  //

  const handlePlaceWager = async () => {
    if (!selectedMatch || selectedMatch.status !== "SCHEDULED") return;
    if (!selectedTeamId || !amount) return;

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setWagerError("Enter a valid amount");
      return;
    }

    try {
      setWagerError("");
      setWagerSuccess("");

      const res = await fetch("http://localhost:4000/api/wagers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId || "",
        },
        body: JSON.stringify({
          poolId,
          gameId: selectedMatch.id,
          teamId: selectedTeamId,
          amount: amt,
          userName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place wager");
      }

      setWagerSuccess("Wager placed!");
      setSelectedTeamId(null);
      setAmount("");

    } catch (err: any) {
      setWagerError(err.message || "Failed to place wager");
    }
  };

  //
  // ---------- Render Match ----------
  //

  const renderMatch = (m: BracketMatch) => {
    const isScheduled = m.status === "SCHEDULED";

    return (
      <div
        key={m.id}
        className={`bracket-match ${isScheduled ? "scheduled" : ""}`}
        onClick={() => handleMatchClick(m)}
      >
        <div className="match-header">
          <span className="match-region">{m.region}</span>
          <span className="match-game">Game {m.gameNo}</span>
          {isScheduled && <span className="match-status">SCHEDULED</span>}
        </div>

        <div className="match-teams">
          <div className={`team ${m.teamA.isWinner ? "winner" : ""}`}>
            <span className="team-seed">#{m.teamA.seed}</span>
            <span className="team-name">{m.teamA.name}</span>
            {m.teamA.score !== null && <span className="team-score">{m.teamA.score}</span>}
          </div>

          <div className={`team ${m.teamB.isWinner ? "winner" : ""}`}>
            <span className="team-seed">#{m.teamB.seed}</span>
            <span className="team-name">{m.teamB.name}</span>
            {m.teamB.score !== null && <span className="team-score">{m.teamB.score}</span>}
          </div>
        </div>
      </div>
    );
  };

  //
  // ---------- Render Region ----------
  //

  const renderRegion = (region: string, regionMatches: Record<number, BracketMatch[]>) => (
    <div key={region} className="bracket-region">
      <div className="region-header">
        <h3>{region} Region</h3>
      </div>

      <div className="region-bracket">
        {Object.entries(regionMatches)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([roundStr, roundMatches]) => (
            <div key={roundStr} className="bracket-round">
              <div className="round-header">{getRoundName(Number(roundStr))}</div>
              <div className="round-matches">{roundMatches.map(renderMatch)}</div>
            </div>
          ))}
      </div>
    </div>
  );

  //
  // ---------- Wager panel ----------
  //

  const isSelectedScheduled = selectedMatch?.status === "SCHEDULED";

  return (
    <div className="card">
      <div className="lbHeader">TOURNAMENT BRACKET</div>

      {/* Inline wager panel */}
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

            {/* Scheduled Game: Pick + Wager UI */}
            {isSelectedScheduled ? (
              <>
                <div className="wager-row wager-teams">
                  <label className="wager-label">Pick a side</label>
                  <div className="team-options">

                    {/* Team A */}
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
                        onChange={() => setSelectedTeamId(selectedMatch.teamA.id)}
                      />
                      <div className="team-info">
                        <span className="seed">Seed #{selectedMatch.teamA.seed}</span>
                        <span className="name">{selectedMatch.teamA.name}</span>
                      </div>
                    </label>

                    {/* Team B */}
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
                        onChange={() => setSelectedTeamId(selectedMatch.teamB.id)}
                      />
                      <div className="team-info">
                        <span className="seed">Seed #{selectedMatch.teamB.seed}</span>
                        <span className="name">{selectedMatch.teamB.name}</span>
                      </div>
                    </label>

                  </div>
                </div>

                {/* Wager amount */}
                <div className="wager-row">
                  <label className="wager-label">Wager Amount</label>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="wager-input"
                    placeholder="Enter points"
                  />
                </div>

                {wagerError && <div className="sidebar-error">{wagerError}</div>}
                {wagerSuccess && <div className="sidebar-success">{wagerSuccess}</div>}

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
                    onClick={() => setSelectedMatch(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Completed Game Summary */}
                <div className="wager-row">
                  <label className="wager-label">Final Score</label>
                  <div className="match-teams">
                    <div className={`team ${selectedMatch.teamA.isWinner ? "winner" : ""}`}>
                      <span className="team-seed">#{selectedMatch.teamA.seed}</span>
                      <span className="team-name">{selectedMatch.teamA.name}</span>
                      {selectedMatch.teamA.score !== null && (
                        <span className="team-score">{selectedMatch.teamA.score}</span>
                      )}
                    </div>
                    <div className={`team ${selectedMatch.teamB.isWinner ? "winner" : ""}`}>
                      <span className="team-seed">#{selectedMatch.teamB.seed}</span>
                      <span className="team-name">{selectedMatch.teamB.name}</span>
                      {selectedMatch.teamB.score !== null && (
                        <span className="team-score">{selectedMatch.teamB.score}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completed game wagers */}
                <div className="wager-row">
                  <label className="wager-label">Your Wagers</label>

                  {wagersLoading ? (
                    <div className="wager-label">Loading...</div>
                  ) : currentGameWagers && currentGameWagers.length > 0 ? (
                    <div className="game-wagers">
                      {currentGameWagers.map((w) => (
                        <div key={w.wager_id} className="game-wager-row">
                          <div className="game-wager-main">
                            <span className="game-wager-team">
                              #{w.picked_seed} {w.picked_team_name}
                            </span>
                            <span className="game-wager-amount">
                              {w.stake_points} pts @ {w.posted_odds.toFixed(2)}x
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
                    <div className="wager-label">No wagers on this game.</div>
                  )}
                </div>

                <div className="wager-actions">
                  <button
                    className="cancel-wager-btn"
                    onClick={() => setSelectedMatch(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ----- Regions (Rounds 1–4) ----- */}
      <div className="bracket-container">
        <div className="bracket-layout">
          {Object.entries(matchesByRegionAndRound)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([region, regionMatches]) =>
              renderRegion(region, regionMatches)
            )}
        </div>
      </div>

      {/* ----- Final Four + Championship ----- */}
      {finalsMatches.length > 0 && (
        <div className="finals-container">
          <h3 className="finals-title">Final Four & Championship</h3>
          <div className="finals-rounds">
            {[5, 6].map((round) =>
              finalsByRound[round]?.length ? (
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