import { getPlayerCorrelations } from "./player-stat-correlation.js";
import { getTeamCorrelations } from "./team-stat-correlation.js";
import { getOpponentAvgCorrelation } from "./opponent-avg-correlation.js";

const run = async () => {
  const teams = ["villanova"];
  let correlations = [];
  for (const team of teams) {
    console.log(team);
    const pc = await getPlayerCorrelations(team);
    const tc = await getTeamCorrelations(team);
    const oac = await getOpponentAvgCorrelation(team);

    correlations = [...tc, ...pc];
    console.log(
      correlations
        .sort((a, b) => (Math.abs(a.r) < Math.abs(b.r) ? 1 : -1))
        .filter(
          (c) =>
            correlations.find(
              (x) =>
                c.stat === x.stat && c.player === x.player && x.type === c.type
            ).value === c.value
        )
        .slice(0, 10)
    );
  }
};

run();
