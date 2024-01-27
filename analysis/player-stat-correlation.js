import bodybuilder from "bodybuilder";
import { client } from "../elasticsearch/client.js";
import { basicStats as stats } from "../datafiles/stats.js";

export const getPlayerCorrelations = async (team) => {
  const getPlayers = bodybuilder()
    .query("match", "team_id.keyword", team)
    .aggregation("terms", "player_id.keyword", {
      size: 20,
    })
    .build();
  const players = (
    await client.search({
      index: "performances",
      size: 30,
      ...getPlayers,
    })
  ).aggregations["agg_terms_player_id.keyword"].buckets
    .map((x) => x.key)
    .sort();

  console.log(players.length, "players for", team);

  const correlations = [];

  for (const player of players) {
    const getPlayerStats = bodybuilder()
      .query("match", "player_id.keyword", player)
      .filter("range", "minutes", { gte: 15 })

      .build();

    const playerGames = (
      await client.search({
        index: "performances",
        size: 50,
        ...getPlayerStats,
      })
    ).hits.hits;
    stats.forEach((stat) => {
      const results = playerGames.map((performance) => {
        return {
          stat: performance._source[stat],
          win: performance._source.gameResult === "win" ? true : false,
          team: performance._source.team_id,
        };
      });

      if (!results.length) {
        return;
      }

      const values = results.map((x) => x.stat);
      const team_id = results[0].team;
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const interval = (maxVal - minVal) / 40;
      if (minVal === maxVal) {
        return;
      }

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
        const isWellWeighted =
          (r < 0 && A / (A + B + C + D) > 0.8 && A / (A + C) > 0.5) ||
          (r > 0 && C / (A + B + C + D) > 0.8 && B / (B + D) > 0.5);

        if (isRare) {
          continue;
        }

        if (
          A * B * C * D == 0 &&
          !isPerfectNegative &&
          !isPerfect
          //   !isWellWeighted
        ) {
          continue;
        }

        correlations.push({
          r,
          player,
          stat,
          value: i,
          recordOver: `${A}-${B}`,
          recordUnder: `${C}-${D}`,
          team: team_id,
          type: "player-performance",
        });
      }
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
