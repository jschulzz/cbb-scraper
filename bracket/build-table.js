import { compareTeams } from "./compare-teams.js";

const originalBracket = [
  "arkansas",
  "duke",
  "saint-peters",
  "north-carolina",
  "kansas",
  "miami-fl",
  "houston",
  "villanova",
];
let likelihoods = [
  [
    ...originalBracket.map((team) => {
      return { team, likelihood: 1 };
    }),
  ],
];
const iterations = Math.log2(originalBracket.length);

for (let i = 0; i < iterations; i++) {
  const layer = [];
  const partitionLength = 2 ** (i + 1);
  const potentialOpponentsCount = partitionLength / 2;
  for (const [idx, team] of originalBracket.entries()) {
    const startIndex = (idx >> (i + 1)) * partitionLength;
    const partition = originalBracket.slice(
      startIndex,
      startIndex + partitionLength
    );
    const isTeamInFront = idx < startIndex + partitionLength / 2;
    const opponents = partition.slice(
      isTeamInFront ? potentialOpponentsCount : 0,
      isTeamInFront ? partition.length : potentialOpponentsCount
    );
    console.log(team, opponents);
    const l = [];
    for (const opponent of opponents) {
      const { winner, likelihood } = await compareTeams(team, opponent);
      if (team === winner) {
        l.push({ opponent, likelihood });
      } else {
        l.push({ opponent, likelihood: 1 - likelihood });
      }
    }
    let accruedLikelihood = 0;
    const teamLikelihoodToGetHere = likelihoods[i].find(
      ({ team: t }) => team === t
    ).likelihood;
    l.forEach(({ opponent, likelihood }) => {
      const opponentLikelihoodToGetHere = likelihoods[i].find(
        ({ team }) => team === opponent
      ).likelihood;
      accruedLikelihood += likelihood * opponentLikelihoodToGetHere;
    });
    layer.push({
      team,
      likelihood: accruedLikelihood * teamLikelihoodToGetHere,
    });
  }
  console.log(layer);
  likelihoods.push(layer);
}
console.log(likelihoods);
