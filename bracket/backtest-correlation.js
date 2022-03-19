import bodybuilder from "bodybuilder";
import { compareTeams } from "./compare-teams.js";
import { client } from "../elasticsearch/client.js";


const targetTeams = [
  "bellarmine",
  "belmont",
  "bethune-cookman",
  "binghamton",
  "boise-state",
  "boston-college",
  "boston-university",
  "bowling-green-state",
  "bradley",
  "brigham-young",
  "brown",
  "bryant",
  "bucknell",
  "buffalo",
  "butler",
  "cal-poly",
  "cal-state-bakersfield",
  "cal-state-fullerton",
  "cal-state-northridge",
  "california",
  "california-baptist",
  "california-davis",
  "california-irvine",
  "california-riverside",
  "california-san-diego",
  "california-santa-barbara",
  "campbell",
  "canisius",
  "central-arkansas",
  "central-connecticut-state",
  "central-florida",
  "central-michigan",
  "charleston-southern",
  "charlotte",
  "chattanooga",
  "chicago-state",
  "cincinnati",
  "citadel",
  "clemson",
  "cleveland-state",
  "coastal-carolina",
  "colgate",
  "college-of-charleston",
  "colorado",
  "colorado-state",
  "columbia",
  "connecticut",
  "coppin-state",
  "cornell",
  "creighton",
  "dartmouth",
  "davidson",
  "dayton",
  "delaware",
  "delaware-state",
  "denver",
  "depaul",
  "detroit-mercy",
  "dixie-state",
  "drake",
  "drexel",
  "duke",
  "duquesne",
  "east-carolina",
  "east-tennessee-state",
  "eastern-illinois",
  "eastern-kentucky",
  "eastern-michigan",
  "eastern-washington",
  "elon",
  "evansville",
  "fairfield",
  "fairleigh-dickinson",
  "florida",
  "florida-am",
  "florida-atlantic",
  "florida-gulf-coast",
  "florida-international",
  "florida-state",
  "fordham",
  "fresno-state",
  "furman",
  "gardner-webb",
  "george-mason",
  "george-washington",
  "georgetown",
  "georgia",
  "georgia-southern",
  "georgia-state",
  "georgia-tech",
  "gonzaga",
  "grambling",
  "grand-canyon",
  "green-bay",
  "hampton",
  "hartford",
  "harvard",
  "hawaii",
  "high-point",
  "hofstra",
  "holy-cross",
  "houston",
  "houston-baptist",
  "howard",
  "idaho",
  "idaho-state",
  "illinois",
  "illinois-chicago",
  "illinois-state",
  "incarnate-word",
  "indiana",
  "indiana-state",
  "iona",
  "iowa",
  "iowa-state",
  "ipfw",
  "iupui",
  "jackson-state",
  "jacksonville",
  "jacksonville-state",
  "james-madison",
  "kansas",
  "kansas-state",
  "kennesaw-state",
  "kent-state",
  "kentucky",
  "la-salle",
  "lafayette",
  "lamar",
  "lehigh",
  "liberty",
  "lipscomb",
  "long-beach-state",
  "long-island-university",
  "longwood",
  "louisiana-lafayette",
  "louisiana-monroe",
  "louisiana-state",
  "louisiana-tech",
  "louisville",
  "loyola-il",
  "loyola-marymount",
  "loyola-md",
  "maine",
  "manhattan",
  "marist",
  "marquette",
  "marshall",
  "maryland",
  "maryland-baltimore-county",
  "maryland-eastern-shore",
  "massachusetts",
  "massachusetts-lowell",
  "mcneese-state",
  "memphis",
  "mercer",
  "merrimack",
  "miami-fl",
  "miami-oh",
  "michigan",
  "michigan-state",
  "middle-tennessee",
  "milwaukee",
  "minnesota",
  "mississippi",
  "mississippi-state",
  "mississippi-valley-state",
  "missouri",
  "missouri-kansas-city",
  "missouri-state",
  "monmouth",
  "montana",
  "montana-state",
  "morehead-state",
  "morgan-state",
  "mount-st-marys",
  "murray-state",
  "navy",
  "nebraska",
  "nebraska-omaha",
  "nevada",
  "nevada-las-vegas",
  "new-hampshire",
  "new-mexico",
  "new-mexico-state",
  "new-orleans",
  "niagara",
  "nicholls-state",
  "njit",
  "norfolk-state",
  "north-alabama",
  "north-carolina",
  "north-carolina-asheville",
  "north-carolina-at",
  "north-carolina-central",
  "north-carolina-greensboro",
  "north-carolina-state",
  "north-carolina-wilmington",
  "north-dakota",
  "north-dakota-state",
  "north-florida",
  "north-texas",
  "northeastern",
  "northern-arizona",
  "northern-colorado",
  "northern-illinois",
  "northern-iowa",
  "northern-kentucky",
  "northwestern",
  "northwestern-state",
  "notre-dame",
  "oakland",
  "ohio",
  "ohio-state",
  "oklahoma",
  "oklahoma-state",
  "old-dominion",
  "oral-roberts",
  "oregon",
  "oregon-state",
  "pacific",
  "penn-state",
  "pennsylvania",
  "pepperdine",
  "pittsburgh",
  "portland",
  "portland-state",
  "prairie-view",
  "presbyterian",
  "princeton",
  "providence",
  "purdue",
  "quinnipiac",
  "radford",
  "rhode-island",
  "rice",
  "richmond",
  "rider",
  "robert-morris",
  "rutgers",
  "sacramento-state",
  "sacred-heart",
  "saint-francis-pa",
  "saint-josephs",
  "saint-louis",
  "saint-marys-ca",
  "saint-peters",
  "sam-houston-state",
  "samford",
  "san-diego",
  "san-diego-state",
  "san-francisco",
  "san-jose-state",
  "santa-clara",
  "seattle",
  "seton-hall",
  "siena",
  "south-alabama",
  "south-carolina",
  "south-carolina-state",
  "south-carolina-upstate",
  "south-dakota",
  "south-dakota-state",
  "south-florida",
  "southeast-missouri-state",
  "southeastern-louisiana",
  "southern",
  "southern-california",
  "southern-illinois",
  "southern-illinois-edwardsville",
  "southern-methodist",
  "southern-mississippi",
  "southern-utah",
  "st-bonaventure",
  "st-francis-ny",
  "st-johns-ny",
  "st-thomas-mn",
  "stanford",
  "stephen-f-austin",
  "stetson",
  "stony-brook",
  "syracuse",
  "tarleton-state",
  "temple",
  "tennessee",
  "tennessee-martin",
  "tennessee-state",
  "tennessee-tech",
  "texas",
  "texas-am",
  "texas-am-corpus-christi",
  "texas-arlington",
  "texas-christian",
  "texas-el-paso",
  "texas-pan-american",
  "texas-san-antonio",
  "texas-southern",
  "texas-state",
  "texas-tech",
  "toledo",
  "towson",
  "troy",
  "tulane",
  "tulsa",
  "ucla",
  "utah",
  "utah-state",
  "utah-valley",
  "valparaiso",
  "vanderbilt",
  "vermont",
  "villanova",
  "virginia",
  "virginia-commonwealth",
  "virginia-military-institute",
  "virginia-tech",
  "wagner",
  "wake-forest",
  "washington",
  "washington-state",
  "weber-state",
  "west-virginia",
  "western-carolina",
  "western-illinois",
  "western-kentucky",
  "western-michigan",
  "wichita-state",
  "william-mary",
  "winthrop",
  "wisconsin",
  "wofford",
  "wright-state",
  "wyoming",
  "xavier",
  "yale",
  "youngstown-state",
];

const run = async () => {
  let totalGames = 0,
    totalEvaluated = 0,
    correctlyEvaluated = 0;
  for (const targetTeam of targetTeams) {
    const getGames = bodybuilder()
      .query("match", "team_id.keyword", targetTeam)
      // .query("match_all", {})
      .build();

    const games = (
      await client.search({
        index: "game-performances",
        size: 5000,
        ...getGames,
      })
    ).hits.hits.map((x) => {
      return {
        team: x._source.opponent_team_id,
        win: x._source.win,
        date: x._source.date,
      };
    });

    for (const game of games) {
      totalGames++;
      try {
        const { winner, likelihood } = await compareTeams(
          targetTeam,
          game.team
        );
        const isCorrectGuess = (winner === targetTeam) === game.win;
        console.log(
          `${isCorrectGuess ? "✔️" : "❌"} | ${targetTeam} vs ${
            game.team
          } | Expected ${winner} @ ${(100 * likelihood).toFixed(1)}%`
        );
        await client.index({
          index: "backtest-results",
          id: `${targetTeam}|${game.team}|${game.date}`,
          document: { wasCorrect: isCorrectGuess, confidence: likelihood },
        });
        if (likelihood > 0.6) {
          totalEvaluated++;
          if (isCorrectGuess) {
            correctlyEvaluated++;
          }
        } else {
          console.log("low confidence");
        }
        console.log(`${correctlyEvaluated} / ${totalEvaluated}`);
      } catch (e) {
        console.log(e);
      }
    }
  }
};

run();
