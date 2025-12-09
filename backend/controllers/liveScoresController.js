// controllers/liveScoresController.js

const NCAA_API_BASE_URL = "https://ncaa-api.henrygd.me";
// Public API, no key required. Limited to ~5 req/s per IP.

export async function getLiveScores(req, res, next) {
  try {
    // NCAA API lets you omit the date to get today's scoreboard
    // /scoreboard/basketball-men/d1 => today's D1 men's games
    const url = `${NCAA_API_BASE_URL}/scoreboard/basketball-men/d1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NCAA API returned ${response.status}`);
    }

    const data = await response.json();

    const gamesArray = Array.isArray(data.games) ? data.games : [];

    console.log(
      `[LiveScores] NCAA API returned ${gamesArray.length} games for men's D1 basketball`
    );

    // Format today's date as YYYY-MM-DD (en-CA)
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");

    const formattedGames = gamesArray.map(entry => {
      // Each entry is of the form { game: { ... } }
      const game = entry.game || entry;

      const home = game.home || {};
      const away = game.away || {};

      const homeScore =
        home.score !== undefined && home.score !== null && home.score !== ""
          ? parseInt(home.score, 10)
          : null;

      const awayScore =
        away.score !== undefined && away.score !== null && away.score !== ""
          ? parseInt(away.score, 10)
          : null;

      const rawGameState = (game.gameState || "").toLowerCase();
      const finalMessage = game.finalMessage || "";
      const currentPeriod = game.currentPeriod || "";
      const contestClock = game.contestClock || "";

      // Human-readable status string
      let status;
      if (finalMessage) {
        status = finalMessage; // e.g. "FINAL"
      } else if (rawGameState === "final") {
        status = "FINAL";
      } else if (rawGameState === "in_progress") {
        // e.g. "2nd 05:43"
        const periodPart = currentPeriod || "LIVE";
        const clockPart = contestClock || "";
        status = `${periodPart} ${clockPart}`.trim();
      } else if (rawGameState === "pre") {
        status = "Scheduled";
      } else if (rawGameState) {
        status = rawGameState.toUpperCase();
      } else {
        status = "Scheduled";
      }

      // Normalize to SCHEDULED / LIVE / FINAL for your frontend logic
      let gameState = "SCHEDULED";
      if (rawGameState === "in_progress") {
        gameState = "LIVE";
      } else if (rawGameState === "final") {
        gameState = "FINAL";
      }

      return {
        id: game.gameID || game.url || null,
        homeTeam:
          (home.names && (home.names.short || home.names.full)) || "TBD",
        awayTeam:
          (away.names && (away.names.short || away.names.full)) || "TBD",
        homeScore,
        awayScore,
        status, // e.g. "FINAL", "2nd 05:43", "Scheduled"
        time: game.startTime || null, // e.g. "7:00PM ET"
        date: game.startDate || todayStr, // NCAA gives "MM-DD-YYYY"; we also expose top-level date below
        league: "NCAA Division I Men's Basketball",
        venue: null, // not provided by scoreboard; could be filled via /game/{id} if you want
        gameState
      };
    });

    res.json({
      date: todayStr,
      games: formattedGames,
      source: "henrygd/ncaa-api",
      // Keep these keys so your frontend doesn't break, even though they're redundant now
      totalEvents: gamesArray.length,
      basketballEvents: gamesArray.length,
      collegeEvents: gamesArray.length
    });
  } catch (err) {
    console.error("Error fetching NCAA live scores:", err);
    res.status(500).json({
      error: "Failed to fetch live scores",
      message: err.message
    });
  }
}
