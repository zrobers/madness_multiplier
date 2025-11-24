// controllers/liveScoresController.js
const THE_SPORTS_DB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

export async function getLiveScores(req, res, next) {
  try {
    // Get today's date in YYYY-MM-DD format in server local time
    // (en-CA locale gives YYYY-MM-DD)
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA"); 

    // Try fetching *all* events for today, then we will filter to Basketball
    let url = `${THE_SPORTS_DB_BASE_URL}/eventsday.php?d=${todayStr}`;
    let response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TheSportsDB API returned ${response.status}`);
    }

    let data = await response.json();

    // If absolutely nothing came back, try again with sport filter as a backup
    if (!data.events || data.events.length === 0) {
      console.log(
        `[LiveScores] No events for ${todayStr} without sport filter, trying with s=Basketball...`
      );
      url = `${THE_SPORTS_DB_BASE_URL}/eventsday.php?d=${todayStr}&s=Basketball`;
      response = await fetch(url);

      if (!response.ok) {
        throw new Error(`TheSportsDB API returned ${response.status}`);
      }

      data = await response.json();
    }

    const allEvents = data.events || [];
    console.log(
      `[LiveScores] Raw events from API for ${todayStr}: ${allEvents.length}`
    );

    // First, restrict to basketball only
    const basketballEvents = allEvents.filter(event => {
      const sport = (event.strSport || "").toLowerCase();
      return sport === "basketball";
    });

    console.log(
      `[LiveScores] Filtered to ${basketballEvents.length} basketball events`
    );

    // Now filter for men's college basketball games (not NBA or other pro)
    const collegeGames = basketballEvents.filter(event => {
      const league = (event.strLeague || "").toLowerCase();

      // Explicitly exclude professional / non-college leagues
      if (
        league.includes("nba") ||
        league.includes("wnba") ||
        league.includes("professional") ||
        league.includes("g league") ||
        league.includes("euroleague") ||
        league.includes("eurocup")
      ) {
        return false;
      }

      // Positive college signals in the league name
      if (
        league.includes("ncaa") ||
        league.includes("college") ||
        league.includes("division i") ||
        league.includes("division 1") ||
        league.includes("d1") ||
        league.includes("ncaa division i") ||
        league.includes("march madness")
      ) {
        return true;
      }

      // Also check team names for college indicators
      const homeTeam = (event.strHomeTeam || "").toLowerCase();
      const awayTeam = (event.strAwayTeam || "").toLowerCase();
      const hasCollegeIndicators =
        homeTeam.includes("university") ||
        homeTeam.includes("state") ||
        homeTeam.includes("college") ||
        awayTeam.includes("university") ||
        awayTeam.includes("state") ||
        awayTeam.includes("college");

      // If league is missing or generic but team names look like colleges
      if (!league && hasCollegeIndicators) {
        return true;
      }

      // Otherwise, treat as non-college
      return false;
    });

    console.log(
      `[LiveScores] Filtered to ${collegeGames.length} college basketball games`
    );

    // If no college games found, optionally fall back to *all* basketball events
    const gamesToUse =
      collegeGames.length > 0 ? collegeGames : basketballEvents;

    if (collegeGames.length === 0 && gamesToUse.length > 0) {
      console.log(
        `[LiveScores] No confirmed college games found, using ${gamesToUse.length} basketball games as fallback`
      );
    }

    const formattedGames = gamesToUse.map(event => {
      const homeScore =
        event.intHomeScore !== null && event.intHomeScore !== undefined
          ? parseInt(event.intHomeScore, 10)
          : null;
      const awayScore =
        event.intAwayScore !== null && event.intAwayScore !== undefined
          ? parseInt(event.intAwayScore, 10)
          : null;

      const status = event.strStatus || "Scheduled";
      let gameState = "SCHEDULED";
      if (status.toLowerCase() === "live") {
        gameState = "LIVE";
      } else if (
        status.toLowerCase() === "ft" ||
        status.toLowerCase() === "finished" ||
        status.toLowerCase() === "after overtime"
      ) {
        gameState = "FINAL";
      }

      return {
        id: event.idEvent,
        homeTeam: event.strHomeTeam || "TBD",
        awayTeam: event.strAwayTeam || "TBD",
        homeScore,
        awayScore,
        status,
        time: event.strTime || event.dateEvent,
        date: event.dateEvent,
        league: event.strLeague || "College Basketball",
        venue: event.strVenue || null,
        gameState
      };
    });

    res.json({
      date: todayStr,
      games: formattedGames,
      source: "TheSportsDB",
      totalEvents: allEvents.length,
      basketballEvents: basketballEvents.length,
      collegeEvents: collegeGames.length
    });
  } catch (err) {
    console.error("Error fetching live scores:", err);
    res.status(500).json({
      error: "Failed to fetch live scores",
      message: err.message
    });
  }
}
