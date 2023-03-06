import { openConnection, closeConnection } from "../database/util.js";
import { Team, Game } from "../models/index.js";

const calculatePER = (player) => {
  // https://bleacherreport.com/articles/113144-cracking-the-code-how-to-calculate-hollingers-per-without-all-the-mess
  const ftmiss = player.fta - player.ftm;
  const fgmiss = player.fga - player.fgm;
  return (
    (85.91 * player.fgm +
      53.897 * player.stl +
      51.757 * player["3pm"] +
      46.845 * player.ftm +
      39.19 * player.blk +
      39.19 * player.orb +
      34.677 * player.ast +
      14.707 * player.drb +
      -17.174 * player.pf +
      -20.091 * ftmiss +
      -39.19 * fgmiss +
      -53.897 * player.tov) /
    player.minutes
  );
};

const run = async () => {
  await openConnection();

    const allTeams = (await Team.find({ name: "gonzaga" }))
  //   const allTeams = (await Team.find({}))
//   const allTeams = (
//     await Team.find({
//       conference: { $in: ["SEC", "ACC", "Big Ten", "PAC-12", "Big 12"] },
//     })
  .map((team) => team.toObject());
  const topOpposingPerformances = [];
  const strongPlayers = {};
  for (const team of allTeams) {
    console.log(`Looking at opposing performances of ${team.name}`);
    const pastOpponents = (
      await Game.find({
        teams: { $elemMatch: { team: team.name } },
      })
    ).map((game) => {
      return {
        ...game
          .toObject()
          .teams.find((opponent) => opponent.team !== team.name),
        date: game.toObject().date,
      };
    });
    const opposingPerformances = pastOpponents
      .map((opponent) =>
        opponent.players.map((player) => {
          return { ...player, date: opponent.date, team: opponent.team };
        })
      )
      .flat();
    const transformedPerformances = [];
    for (const performance of opposingPerformances) {
      //   console.log(`Evaluating of ${performance.name} - ${performance.team}`);
      const performanceTeam = (await Team.find({ name: performance.team }))[0];
      if (!performanceTeam) {
        // console.log(`Can't find team ${performance.team}`);
        continue;
      }
      const playerAverages = performanceTeam
        .toObject()
        .players.find((p) => p.name === performance.name);
      if (!playerAverages) {
        // console.log(`Can't evaluate player ${performance.name}`);
      } else {
        const normalPER = calculatePER(playerAverages);
        const normalMinutes = playerAverages.minutes;
        transformedPerformances.push({
          name: performance.name,
          date: performance.date,
          normalMinutes,
          thisMinutes: performance.minutes,
          team: performance.team,
          opponent: team.name,
          normalPER,
          thisPER: calculatePER(performance),
          //   PERratio: calculatePER(performance) / normalPER,
        });
      }
    }
    const filteredPerformances = transformedPerformances
      .filter((player) => player.thisMinutes > 8)
      .sort((playerA, playerB) => {
        return playerA.thisPER > playerB.thisPER ? -1 : 1;
      })
      .slice(0, 10);
    topOpposingPerformances.push({
      team: team.name,
      performances: filteredPerformances,
    });
    console.log(filteredPerformances);
    filteredPerformances.forEach((perf) => {
      if (!strongPlayers[perf.name]) strongPlayers[perf.name] = [];
      strongPlayers[perf.name].push(perf);
    });
  }
  //   const players = Object.values(strongPlayers).sort((a, b) =>
  //     a.length > b.length ? -1 : 1
  //   );
  //   console.log(players.slice(0, 5));
};
//   closeConnection();

run();
