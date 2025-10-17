# 🏀 Madness Multiplier

Madness Multiplier is a database-backed web application that reimagines the excitement of March Madness through a structured, point-based wagering system.

Users can place wagers with fake money on NCAA tournament games, track leaderboards, and compete with friends — all powered by a relational database.

---

## 🚀 Getting Started

### 1. Prerequisites

Before you begin, make sure you have the following installed:

- **Docker Desktop** (latest version)  
  👉 [Download here](https://www.docker.com/get-started)
- **Git**  
  👉 [Install Git](https://git-scm.com/downloads)
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

### 4. Run the Project with Docker 🐳

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

Progress Since Milestone 1: 

Each member has contributed to making the idea of Madness Multiplier more concrete, building a lightweight prototype in Google Sheets, and brainstorming the Database schema. 

Zach: Refined the project structure, worked on database schema planning, and contributed to the prototype

Andrew: Backend planning and helped test the Google Sheets prototype

Charlie: Worked on a logo and front-end ideation

Justin: Supported prototype testing and helped define how wagers and leaderboards will interact in the final build.

Logan: Researched data sources for score data 

Additional Updates:

After fleshing out the idea further, we decided to populate our data tables that store March Madness seedings with historical data from past tournaments, since official 2026 seedings are unavailable during this phase. We’re also exploring alternative APIs to ingest March Madness data dynamically when the season begins.
Using the Google Sheets prototype, we successfully tested odds calculations, leaderboard updates, and wager tracking before beginning full implementation.
