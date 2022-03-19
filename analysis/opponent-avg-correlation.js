import bodybuilder from "bodybuilder";
import { client } from "../elasticsearch/client.js";

const stats = [
  "pts",
  "ast",
  "drb",
  "orb",
  "blk",
  "stl",
  "2pm",
  "2pa",
  "3pm",
  "3pa",
  "tov",
  "pf",
  "fga",
  "fgm",
  "2pct",
  "3pct",
  "efg",
  "trb",
  "poss",
  "ts",
  "ftr",
  "tov_pct",
  "orb_pct",
  "gmsc",
  "pace",
];

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
          //   win: performance._source.win,
          win: performance._source.pts - performance._source.opponent_pts > 3,
          team: performance._source.team_id,
          opponent: performance._source.opponent_team_id,
        });
      }
    }

    const values = results.map((x) => x.stat);

    // console.log(stat, values);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const interval = (maxVal - minVal) / 100;
    if (minVal === maxVal) {
      continue;
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
        type: "average",
      });
    }
  }

  return correlations
    .sort((a, b) => (Math.abs(a.r) < Math.abs(b.r) ? 1 : -1))
    .filter(
      (c) =>
        correlations.find(
          (x) => c.stat === x.stat && c.player === x.player && x.type === c.type
        ).value === c.value
    )
    .filter((c) => Math.abs(c.r) > 0.7);
};

// getOpponentAvgCorrelation("kentucky").then(x => console.log(x.slice(0, 3)));
