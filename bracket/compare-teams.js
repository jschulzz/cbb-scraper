import bodybuilder from "bodybuilder";
import { createClient } from "redis";
import { getOpponentAvgCorrelation } from "../analysis/opponent-avg-correlation.js";
import { client } from "../elasticsearch/client.js";

const PRINT_DETAILS = true;
const TELL_DEPTH = 5;

const printTell = ({
  team,
  opponent,
  favorite,
  winrate,
  record,
  correlation,
  stats,
}) => {
  const statLabel = correlation.stat.includes("opponent_")
    ? correlation.stat.split("opponent_")[1] + " allowed"
    : correlation.stat;

  const difference = stats[correlation.stat] - correlation.value;
  let precision = 1;
  if (Math.abs(difference) < 0.1) {
    precision = 3;
  }

  if (PRINT_DETAILS) {
    console.log(
      `${opponent} averages ${stats[correlation.stat].toFixed(
        precision
      )} ${statLabel}`
    );
    console.log(
      `${team} has won ${(100 * winrate).toFixed(
        1
      )}% (${record}) when opponents average ${correlation.value.toFixed(
        precision
      )} or ${
        difference > 0 ? "more" : "less"
      } ${statLabel} (r=${correlation.r.toFixed(3)})`
    );
    console.log(`This favors ${favorite}`);
    console.log("-----------");
  }
};

const evaluateMatchup = async (team, opponent) => {
  let query = bodybuilder().query("match", "id", opponent).build();
  let results = await client.search({
    index: "team-averages",
    size: 1,
    ...query,
  });
  const correlations = (await getOpponentAvgCorrelation(team)).slice(
    0,
    TELL_DEPTH
  );
  if (!results.hits.hits.length) {
    return [];
  }
  const opponentStats = results.hits.hits[0]._source;
  let winrates = [];
  for (const c of correlations) {
    const wantHigher = c.r > 0;
    const favorite =
      wantHigher === c.value > opponentStats[c.stat] ? team : opponent;
    const record =
      c.value < opponentStats[c.stat] ? c.recordOver : c.recordUnder;
    const [wins, losses] = record.split("-").map(Number);
    const winrate = wins / (wins + losses);
    winrates.push({ winrate, correlation: Math.abs(c.r) });
    printTell({
      team,
      opponent,
      favorite,
      winrate,
      record,
      correlation: c,
      stats: opponentStats,
    });
  }
  return winrates;
};

export const compareTeams = async (team1, team2) => {
//   const client = createClient();
//   await client.connect();

  const label = [team1, team2].sort();

//   const key = JSON.stringify(label);
//   const cachedValue = await client.get(key);
//   if (cachedValue) {
//     const result = JSON.parse(cachedValue);
//     return result;
//   }

  const team1winrates = await evaluateMatchup(team1, team2);
  const team2winrates = await evaluateMatchup(team2, team1);

  const winrates = [
    ...team1winrates,
    ...team2winrates.map((x) => {
      return { ...x, winrate: 1 - x.winrate };
    }),
  ].map((x) => {
    return { ...x, correlation: 3.3 * (x.correlation - 0.7) };
  });

  if (!winrates.length) {
    throw new Error(`Could not find team averages ${team1}, ${team2}`);
  }

  const summedCorrelations = winrates.reduce(
    (prev, curr) => prev + curr.correlation,
    0
  );
  const normalizedWinrates = winrates.map((x) => {
    return { ...x, correlation: x.correlation / summedCorrelations };
  });
  const weightedAvgWinRate = normalizedWinrates.reduce(
    (prev, curr) => prev + curr.winrate * curr.correlation,
    0
  );

  console.log(
    `${team1} @ ${(100 * weightedAvgWinRate).toFixed(0)}% | ${team2} @ ${(
      100 *
      (1 - weightedAvgWinRate)
    ).toFixed(0)}% `
  );

  const result = {
    winner: weightedAvgWinRate > 0.5 ? team1 : team2,
    likelihood: Math.max(weightedAvgWinRate, 1 - weightedAvgWinRate),
  };

//   await client.set(key, JSON.stringify(result));

  return result;
};

compareTeams("duke", "north-carolina");
