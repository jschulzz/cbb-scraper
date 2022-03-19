import { openConnection, closeConnection } from "../database/util.js";
import { Game, Performance } from "../models/index.js";
import { client } from "../elasticsearch/client.js";

const transformPerformance = (performance, games) => {
  const gameDate = new Date(+performance.id.split("-")[0]);
  const dateWindow = [
    new Date(gameDate).setHours(gameDate.getHours() + 2),
    new Date(gameDate).setHours(gameDate.getHours() - 2),
  ];
  const game = games.find((g) => {
    return (
      g.teams.some((t) => t.team_id === performance.team_id) &&
      new Date(g.date) < dateWindow[0] &&
      new Date(g.date) > dateWindow[1]
    );
  });
  delete performance._id;
  delete performance.__v;
  if (!game) {
    console.log(
      "no game for",
      performance.team_id,
      "vs",
      performance.opponent_id
    );
    return [];
  }
  return {
    ...performance,
    date: gameDate,
    gameResult: game.teams.find((t) => t.team_id === performance.team_id).win
      ? "win"
      : "lose",
    "2pct": performance["2pa"] ? performance["2pm"] / performance["2pa"] : 0,
    "3pct": performance["3pa"] ? performance["3pm"] / performance["3pa"] : 0,
    "ast-tov": performance["tov"] ? performance["ast"] / performance["tov"] : 0,
    trb: performance["orb"] + performance["drb"],
    efg: performance["fga"]
      ? (performance["2pm"] + 1.5 * performance["3pm"]) / performance["fga"]
      : 0,
  };
};

const loadPerformances = async (skip = 0, size = 10000) => {
  const performances = (await Performance.find({}).limit(size).skip(skip))
    .map((perf) => perf.toObject())
    .flat();
  console.log(`Grabbed ${skip}-${skip + performances.length}`);
  return performances;
};

const indexPerformances = async (performances, games) => {
  const body = performances.flatMap((performance) => {
    return [
      { index: { _index: "performances", _id: performance.id } },
      transformPerformance(performance, games),
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
  const games = (await Game.find({})).map((game) => game.toObject()).flat();
  console.log(games.length);

  let performances = await loadPerformances(0, 40000);
  await indexPerformances(performances, games);
  performances = await loadPerformances(40000, 40000);
  await indexPerformances(performances, games);
  performances = await loadPerformances(80000, 40000);
  await indexPerformances(performances, games);
};

run();
