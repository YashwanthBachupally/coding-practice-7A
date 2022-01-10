const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//1.....Returns a list of all the players in the player table
app.get("/players/", async (req, res) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const dbRes = await db.all(getPlayersQuery);
  res.send(
    dbRes.map((each) => ({
      playerId: each.player_id,
      playerName: each.player_name,
    }))
  );
});

//2.....Returns a specific player based on the player ID

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayersQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const dbRes = await db.get(getPlayersQuery);
  res.send({ playerId: dbRes.player_id, playerName: dbRes.player_name });
});

//3......Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const dbQuery = `UPDATE 
  player_details 
  SET player_name='${playerName}' 
  WHERE player_id=${playerId};`;
  const dbRes = await db.run(dbQuery);
  res.send("Player Details Updated");
});

//4........Returns the match details of a specific match

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getPlayersQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const dbRes = await db.get(getPlayersQuery);
  res.send({ matchId: dbRes.match_id, match: dbRes.match, year: dbRes.year });
});

//5......Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const getPlayersQuery = `SELECT 
  match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year 
    FROM 
    player_match_score join match_details on 
    player_match_score.match_id=match_details.match_id WHERE player_match_score.player_id=${playerId};`;
  const dbRes = await db.all(getPlayersQuery);
  res.send(dbRes);
});

//6.....Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getmatchesQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    player_details join player_match_score ON 
    player_match_score.player_id=player_details.player_id WHERE player_match_score.match_id=${matchId}`;
  const dbRes = await db.all(getmatchesQuery);
  res.send(dbRes);
});

//7.....Returns the statistics of the total score,
//fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;

  const getmatchesQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    sum(player_match_score.score) as totalScore,
    count(fours) as totalFours,
    count(sixes) as totalSixes
    FROM
    player_details join player_match_score ON 
    player_match_score.player_id=player_details.player_id WHERE player_match_score.player_id=${playerId};`;
  const dbRes = await db.get(getmatchesQuery);
  res.send(dbRes);
});

module.exports = app;
