import bodybuilder from "bodybuilder";
import { client } from "../elasticsearch/client.js";
import { basicStats as stats } from "../datafiles/stats";

/* not great results */


export const getOpponentAvgCorrelation = async (team) => {
  const correlations = [];
  const getGames = bodybuilder()
    .query("match", "team_id.keyword", team)
    .build();

  const games = (
    await client.search({
      index: "game-performances",
      size: 5000,
      ...getGames,
    })
  ).hits.hits;
  const modifiedStats = [...stats, ...stats.map((x) => "opponent_" + x)];

  for (const stat of modifiedStats) {
    const results = [];
    for (const performance of games) {
      const getOpponentAvgs = bodybuilder()
        .query("match", "id", performance._source.opponent_team_id)
        .build();
      const opponentAvgs = await client.search({
        index: "team-averages",
        size: 1,
        ...getOpponentAvgs,
      });
      if (opponentAvgs.hits.hits.length) {
        results.push({
          stat: opponentAvgs.hits.hits[0]._source[stat],
          diff: performance._source.pts - performance._source.opponent_pts,
          team: performance._source.team_id,
          opponent: performance._source.opponent_team_id,
        });
      }
    }

    const values = results.map((x) => x.stat);

    // console.log(stat, values);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    const statsTable = results.map((r) => {
      return {
        x: r.stat,
        y: r.diff,
        xy: r.stat * r.diff,
        x2: r.stat * r.stat,
        y2: r.diff * r.diff,
      };
    });

    const sumProp = (fieldName) => {
      return statsTable.reduce((prev, curr) => prev + curr[fieldName], 0);
    };

    const r =
      (statsTable.length * sumProp("xy") - sumProp("x") * sumProp("y")) /
      Math.sqrt(
        ((statsTable.length * sumProp("x2") - sumProp("x")) ^ 2) *
          ((statsTable.length * sumProp("y2") - sumProp("y")) ^ 2)
      );

    correlations.push({
      r,
      stat,
      range: [minVal, maxVal],
      player: "all",
      team: team,
      type: "differential",
    });
  }

  return correlations
    .sort((a, b) => (Math.abs(a.r) < Math.abs(b.r) ? 1 : -1))
    .filter(
      (c) =>
        correlations.find(
          (x) => c.stat === x.stat && c.player === x.player && x.type === c.type
        ).value === c.value
    );
};

const run = async () => {
  const teams = [
    "kentucky",
    "kansas",
    "baylor",
    "gonzaga",
    "arizona",
    "auburn",
    "duke",
    "purdue",
  ];
  let correlations = [];
  for (const team of teams) {
    const c = await getOpponentAvgCorrelation(team);
    correlations = [...correlations, ...c];
  }
  console.log(
    correlations.sort((a, b) => (Math.abs(a.r) < Math.abs(b.r) ? 1 : -1))
  );
};

run();
