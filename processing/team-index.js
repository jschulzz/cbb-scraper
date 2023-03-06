import { openConnection } from "../database/util.js";
import { Team, Game } from "../models/index.js";
import { client } from "../elasticsearch/client.js";

const enrichTeam = (team) => {
  delete team._id;
  delete team.__v;
  return {
    ...team,
    "2pct": team["2pa"] ? team["2pm"] / team["2pa"] : 0,
    opponent_2pct: team["opponent_2pa"]
      ? team["opponent_2pm"] / team["opponent_2pa"]
      : 0,
    "3pct": team["3pa"] ? team["3pm"] / team["3pa"] : 0,
    opponent_3pct: team["opponent_3pa"]
      ? team["opponent_3pm"] / team["opponent_3pa"]
      : 0,
    "ast-tov": team["tov"] ? team["ast"] / team["tov"] : 0,
    "opponent_ast-tov": team["opponent_tov"]
      ? team["opponent_ast"] / team["opponent_tov"]
      : 0,
    trb: team["orb"] + team["drb"],
    opponent_trb: team["opponent_orb"] + team["opponent_drb"],
    efg: team["fga"] ? (team["2pm"] + 1.5 * team["3pm"]) / team["fga"] : 0,
    opponent_efg: team["opponent_fga"]
      ? (team["opponent_2pm"] + 1.5 * team["opponent_3pm"]) /
        team["opponent_fga"]
      : 0,
    poss: team["fga"] - team["orb"] + team["tov"] + 0.475 * team["fta"],
    opponent_poss:
      team["opponent_fga"] -
      team["opponent_orb"] +
      team["opponent_tov"] +
      0.475 * team["opponent_fta"],
    ts: team["pts"] / (2 * (team["fga"] + 0.475 * team["fta"])),
    opponent_ts:
      team["opponent_pts"] /
      (2 * (team["opponent_fga"] + 0.475 * team["opponent_fta"])),
    ftr: team["ftm"] / team["fga"],
    opponent_ftr: team["opponent_ftm"] / team["opponent_fga"],
    tov_pct:
      team["tov"] /
      (team["fga"] + team["ast"] + team["tov"] + 0.475 * team["fta"]),
    opponent_tov_pct:
      team["opponent_tov"] /
      (team["opponent_fga"] +
        team["opponent_ast"] +
        team["opponent_tov"] +
        0.475 * team["opponent_fta"]),
    orb_pct: team["orb"] / (team["orb"] + team["opponent_drb"]),
    opponent_orb_pct:
      team["opponent_orb"] / (team["opponent_orb"] + team["drb"]),
    gmsc:
      team["pts"] +
      0.4 * team["fgm"] -
      0.7 * team["fgm"] -
      0.4 * (team["fta"] - team["ftm"]) +
      0.7 * team["orb"] +
      0.3 * team["drb"] +
      team["stl"] +
      0.7 * team["ast"] +
      0.7 * team["blk"] -
      0.7 * team["pf"] -
      team["tov"],
    opponent_gmsc:
      team["opponent_pts"] +
      0.4 * team["opponent_fgm"] -
      0.7 * team["opponent_fgm"] -
      0.4 * (team["opponent_fta"] - team["opponent_ftm"]) +
      0.7 * team["opponent_orb"] +
      0.3 * team["opponent_drb"] +
      team["opponent_stl"] +
      0.7 * team["opponent_ast"] +
      0.7 * team["opponent_blk"] -
      0.7 * team["opponent_pf"] -
      team["opponent_tov"],
    pace:
      (team["fga"] -
        team["orb"] +
        team["tov"] +
        0.475 * team["fta"] +
        (team["opponent_fga"] -
          team["opponent_orb"] +
          team["opponent_tov"] +
          0.475 * team["opponent_fta"])) /
      2,
  };
};

const loadTeams = async (skip = 0, size = 10000) => {
  const teams = (await Team.find({}).limit(size).skip(skip))
    .map((team) => team.toObject())
    .flat();
  console.log(`Grabbed ${skip}-${skip + teams.length}`);

  return teams;
};

const indexTeams = async (teams) => {
  const indexName = "team-averages";
  const enrichedTeams = [];
  for (let team of teams) {
    const games = await Game.find({ "teams.team_id": team.name });
    console.log(`Found ${games.length} games for ${team.name}`);
    const opponent_performances = games.map((game) =>
      game
        .toObject()
        .teams.find((competitor) => competitor.team_id !== team.name)
    );
    const sums = {};
    opponent_performances.forEach((opponent) => {
      delete opponent.win;
      delete opponent.home;
      delete opponent.team_id;
      delete opponent.performance_ids;
      delete opponent._id;
      Object.keys(opponent).forEach((stat) => {
        sums[stat] = (sums[stat] ? sums[stat] : 0) + opponent[stat];
      });
    });
    const opponentAverages = {};
    Object.keys(sums).forEach((stat) => {
      opponentAverages[`opponent_${stat}`] = Number(
        (sums[stat] / games.length).toFixed(1)
      );
    });
    enrichedTeams.push(enrichTeam({ ...team, ...opponentAverages }));
  }

  console.log(enrichedTeams[0]);

  const body = enrichedTeams.flatMap((team) => {
    return [
      {
        index: {
          _index: indexName,
          _id: team.id,
        },
      },
      team,
    ];
  });

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  console.log("Submitted");

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
  let teams = await loadTeams(0, 50000);
  await indexTeams(teams);
};

run();
