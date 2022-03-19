import { openConnection } from "../database/util.js";
import { Game } from "../models/index.js";
import { client } from "../elasticsearch/client.js";

const transformStats = (team) => {
  delete team._id;
  delete team.__v;
  return {
    ...team,
    "2pct": team["2pa"] ? team["2pm"] / team["2pa"] : 0,
    "3pct": team["3pa"] ? team["3pm"] / team["3pa"] : 0,
    "ast-tov": team["tov"] ? team["ast"] / team["tov"] : 0,
    trb: team["orb"] + team["drb"],
    efg: team["fga"] ? (team["2pm"] + 1.5 * team["3pm"]) / team["fga"] : 0,
  };
};

const transformGame = (team, gameDate, opponent) => {
  const teamStats = transformStats(team);
  const opponentStats = transformStats(opponent);
  const appendedOpponentStats = Object.keys(opponentStats).reduce(
    (acc, key) => ({
      ...acc,
      ...{ ["opponent_" + key]: opponentStats[key] },
    }),
    {}
  );
  return {
    date: gameDate,
    ...teamStats,
    ...appendedOpponentStats,
  };
};

const loadGames = async (skip = 0, size = 10000) => {
  const games = (await Game.find({}).limit(size).skip(skip))
    .map((perf) => perf.toObject())
    .flat();
  console.log(`Grabbed ${skip}-${skip + games.length}`);
  return games;
};

const indexGames = async (games) => {
  const body = games.flatMap((game) => {
    const gameDate = new Date(game.date);
    return [
      {
        index: {
          _index: "game-performances",
          _id: `${gameDate.getTime()}-${game.teams[0].team_id}`,
        },
      },
      transformGame(game.teams[0], gameDate, game.teams[1]),
      {
        index: {
          _index: "game-performances",
          _id: `${gameDate.getTime()}-${game.teams[1].team_id}`,
        },
      },
      transformGame(game.teams[1], gameDate, game.teams[0]),
    ];
  });

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  console.log("Submitted");
  console.log(body[1]);

  if (bulkResponse?.errors) {
    const erroredDocuments = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    console.log(erroredDocuments);
  }
};

const run = async () => {
  await openConnection();
  //   const games = (await Game.find({})).map((game) => game.toObject()).flat();
  //   console.log(games.length);

  let games = await loadGames(0, 50000);
  await indexGames(games);
  //   games = await loadGames(50000, 50000);
  //   await indexGames(games);
};

run();
