import { compareTeams } from "./compare-teams.js";

// const originalBracket = [
//   "kentucky",
//   "vanderbilt",
//   "tennessee",
//   "mississippi-state",
//   "texas-am",
//   "auburn",
//   "arkansas",
//   "louisiana-state",
// ];
// const originalBracket = [
//   "arizona",
//   "bryant",
//   "seton-hall",
//   "texas-christian",
//   "houston",
//   "alabama-birmingham",
//   "illinois",
//   "chattanooga",
//   "colorado-state",
//   "michigan",
//   "tennessee",
//   "longwood",
//   "ohio-state",
//   "loyola-il",
//   "villanova",
//   "delaware",
// ];
const originalBracket = [
  "baylor",
  "norfolk-state",
  "north-carolina",
  "marquette",
  "mount-st-marys",
  "indiana",
  "ucla",
  "akron",
  "texas",
  "virginia-tech",
  "purdue",
  "yale",
  "murray-state",
  "san-francisco",
  "kentucky",
  "saint-peters",
];
let bracket = [...originalBracket];
let layers = [];

const iterations = Math.log2(originalBracket.length);

for (let i = 0; i < iterations; i++) {
  layers.push([...bracket]);
  const innerIterations = bracket.length / 2;
  const newBracket = [];
  console.log("===================");
  for (let j = 0; j < innerIterations; j++) {
    const team1 = bracket.shift();
    const team2 = bracket.shift();
    const winner = await compareTeams(team1, team2);
    console.log(`Round ${i + 1} | ${team1} vs ${team2}: ${winner} wins!\n`);
    newBracket.push(winner);
  }
  bracket = [...newBracket];
}

console.log(layers);
