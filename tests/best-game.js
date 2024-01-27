import { openConnection, closeConnection } from "../database/util.js";
import { Team, Game } from "../models/index.js";

const calculatePER = (player) => {
  return (
    player.pts +
    player.trb +
    player.ast +
    player.stl +
    player.blk -
    (player.fga - player.fgm) -
    (player.fta - player.ftm) -
    player.tov
    // / player.minutes
  );
};

const run = async () => {
  await openConnection();

  //   const allPlayers = (await Team.find({ name: "kentucky" }))
  const allPlayers = (await Team.find({ conference: { $in: ["SEC"] } }))
    .map((team) =>
      team.toObject().players.map((player) => {
        return { ...player, team: team.name };
      })
    )
    .flat();
  const sortedPlayers = [];
  for (const player of allPlayers) {
    //   console.log("searching for", player.name);
    const normalPER = calculatePER(player);
    const games = await Game.find({
      teams: { $elemMatch: { team: player.team } },
    });
    const playerGames = games
      .map((game) => {
        const teams = game.toObject().teams;
        const gameDate = game.toObject().date;
        const opponent = game
          .toObject()
          .teams.find((x) => x.tean !== player.team).team;
        const stats = teams
          .find((team) => team.team === player.team)
          .players.find((gamePlayer) => gamePlayer.name === player.name);
        return {
          ...stats,
          gameDate,
          opponent,
        };
      })
      .filter((games) => games.name);
    playerGames.sort((gameA, gameB) => {
      return calculatePER(gameA) / normalPER > calculatePER(gameB) / normalPER
        ? -1
        : 1;
    });
    if (playerGames.length) {
      //   console.log(playerGames);
      const result = {
        name: player.name,
        date: playerGames[0].gameDate,
        normalPER,
        normalMinutes: player.minutes,
        opponent: playerGames[0].opponent,
        team: player.team,
        thisPER: calculatePER(playerGames[0]),
        thisMinutes: playerGames[0].minutes,
        PERratio: calculatePER(playerGames[0]) / normalPER,
      };
      sortedPlayers.push(result);
    } else {
      console.log("Couldn't find", player.name);
    }
  }
  const filteredPlayers = sortedPlayers
    .filter((player) => player.thisMinutes > 6)
    .sort((playerA, playerB) => {
      return playerA.thisPER > playerB.thisPER ? -1 : 1;
    })
    .slice(0, 5);
  console.log(filteredPlayers);
  //   closeConnection();
};

run();
