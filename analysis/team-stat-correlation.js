import bodybuilder from "bodybuilder";
import { client } from "../elasticsearch/client.js";
import { basicStats as stats } from "../datafiles/stats";

export const getTeamCorrelations = async (team) => {
  const correlations = [];
  const getGames = bodybuilder()
    .query("match", "team_id.keyword", team)
    // .query("match_all", {})
    .build();

  const games = (
    await client.search({
      index: "game-performances",
      size: 5000,
      ...getGames,
    })
  ).hits.hits;
  const modifiedStats = [...stats, ...stats.map((x) => "opponent_" + x)];

  //TODO: Generalize this
  modifiedStats.forEach((stat) => {
    const results = games.map((performance) => {
      return {
        stat: performance._source[stat],
        win: performance._source.win,
        team: performance._source.team_id,
      };
    });

    const values = results.map((x) => x.stat);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const interval = (maxVal - minVal) / 40;
    if (minVal === maxVal) {
      return;
    }

    const team_id = results[0].team;

    for (let i = minVal; i <= maxVal; i += interval) {
      /*          win   lose
            above |  A  |  B  |
            below |  C  |  D  |
        */
      const A = results.filter((x) => x.stat >= i && x.win).length;
      const B = results.filter((x) => x.stat >= i && !x.win).length;
      const C = results.filter((x) => x.stat < i && x.win).length;
      const D = results.filter((x) => x.stat < i && !x.win).length;
      let r = 1;
      if (A * D !== 0) {
        r = Math.cos(Math.PI / (1 + Math.sqrt((B * C) / (A * D))));
      }

      const isRare = A + B + C + D < 20;
      const isPerfect = A == 0 && D == 0;
      const isPerfectNegative = B == 0 && C == 0;

      if (isRare) {
        continue;
      }

      if (A * B * C * D == 0 && !isPerfectNegative && !isPerfect) {
        continue;
      }

      correlations.push({
        r,
        stat,
        value: i,
        player: "all",
        recordOver: `${A}-${B}`,
        recordUnder: `${C}-${D}`,
        team: team_id,
        type: "team-performance",
      });
    }
  });

  return correlations
    .sort((a, b) => (Math.abs(a.r) < Math.abs(b.r) ? 1 : -1))
    .filter(
      (c) =>
        correlations.find(
          (x) => c.stat === x.stat && c.player === x.player && x.type === c.type
        ).value === c.value
    );
};
