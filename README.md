# Madness Multiplier

Madness Multiplier is a database-backed web application that reimagines the excitement of March Madness through a structured, point-based wagering system.

Users can place wagers with fake money on NCAA tournament games, track leaderboards, and compete with friends — all powered by a relational database.

---

## Getting Started

### 1. Prerequisites

Before you begin, make sure you have the following installed:

- **Docker Desktop** (latest version)  
  [Download here](https://www.docker.com/get-started)
- **Git**  
  [Install Git](https://git-scm.com/downloads)
- *(Optional)* Node.js 18+ if you plan to run backend/frontend locally without Docker

---

### 2. Clone the Repository

```bash
git clone https://github.com/<your-org>/madness-multiplier.git
cd madness-multiplier
```

### 3. Environment Variables

Copy the example environment file and edit values if needed:

```bash
cp .env.example .env
```

Default credentials (safe for development):

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=madness
PGADMIN_DEFAULT_EMAIL=admin@madness.com
PGADMIN_DEFAULT_PASSWORD=admin123
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=madness
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
DEV_AUTH=true
```

**Do not commit your .env file.** The `.env.example` should remain in version control as a reference for teammates. This is done by default by .gitignore

### 4. Run the Project with Docker

From the project root:

```bash
docker compose up --build
```

Once running:

- **pgAdmin**: http://localhost:5050
  - Email: admin@madness.com
  - Password: admin123
- **Backend container**: http://localhost:4000
- **Frontend container**: http://localhost:3000

(These are placeholders until backend/frontend code is added.)

### 5. Stopping the Project

To stop the containers:

```bash
docker compose down
```

To remove data volumes (resets database):

```bash
docker compose down -v
```


Open Project: Madness Multiplier

Team Members:
- Zach Robers 
- Andrew Tucker 
- Charlie Konen 
- Justin Aronwald 
- Logan Dracos 

Github Link:

https://github.com/zrobers/madness_multiplier

Description:

Madness Multiplier is a database-backed website that reimagines the excitement of March Madness through a structured, point-based wagering system. Players place wagers using fake money on NCAA tournament games, with multipliers determined by the relative seeding of the teams. The platform tracks wagers, calculates payouts automatically, and maintains live leaderboards for pools of friends or larger groups. 

Progress Since Milestone 4: 

Zach: 
Compiled a complete dataset of 2024 March madness games compatible with the existing schema 
Worked on a proof of concept for pulling live score data via an external API (right now using SportsDB)
Due to limits on SportsDB API for live score integration, transitioned the live scores controller to use the NCAA API (henrygd/ncaa-api)
Enhanced frontend for live scores


Justin:
Added pop up to tournament bracket so that past games show your wagers and future games allow you to wager 
Added current user and logout to the home page  once you 
Updated login/register UI
Added tabbed pools so that users can switch between their pools on the various web pages as well as place/view wagers for different pools
Fixed home page bugs


Andrew: 
Added more information to the registration page including first and last name. 
Connected registration to the database to input all fields correctly including creating and inserting initials and username. 
Test register cases and added error messages for duplicate usernames/emails.
Added custom username field instead of auto-generated with backend handling in register screen.
Added forgot password functionality on the login screen.

Logan: 
Implemented three new Pools APIs. 
Integrated into home screen and added several pages and components for proper pool creation and joining
Fixed bugs with pool joining
Implemented betting analytics into view picks page


Charlie:
Updated submit picks page so that it is unique for each user and is linked to the account that is logged in
Added logic to adjust the amount of points available to bet depending on amount wagered
Updated the view picks page to only show the wagers made by the logged in user
Allowed users to tab between pools on the submit picks and view picks page
Fixed logic so user points are separate for each pool
Updated view picks frontend



After fleshing out the idea further, we decided to populate our data tables that store March Madness seedings with historical data from past tournaments, since official 2026 seedings are unavailable during this phase. We’re also exploring alternative APIs to ingest March Madness data dynamically when the season begins.
Using the Google Sheets prototype, we successfully tested odds calculations, leaderboard updates, and wager tracking before beginning full implementation.
