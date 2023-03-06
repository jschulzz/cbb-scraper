import { openConnection, closeConnection } from "../database/util.js";
import { Game, Team } from "../models/index.js";
import { scrapeTeam } from "./scrape-team.js";
const { BASE_URL } = process.env;

const run = async () => {
  await openConnection();

  const allGames = await Game.find({});
  console.log("Total games:", allGames.length);
  const allTeams = new Set();
  for (const game of allGames) {
    allTeams.add(game.teams[0].team_id);
    allTeams.add(game.teams[1].team_id);
  }

//   console.log(allTeams)

  for (const [index, team] of Array.from(allTeams).entries()) {
    // https://www.sports-reference.com/cbb/schools/california-baptist/2022.html
    const url = `${BASE_URL}/cbb/schools/${team}/2023.html`;
    const [recordedTeam] = await Team.find({ link: url });
    const now = new Date();
    const yesterday = now.setDate(now.getDate() - 1);

    const grabTeam = async (url) => {
      try {
        console.log(`Parsing ${index}/${allTeams.size}`);
        await scrapeTeam(url);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${team} is not tracked.`);
        } else {
          console.log(error);
        }
      }
    };

    // if (recordedTeam && recordedTeam.scraped < yesterday) {
      await grabTeam(url);
    // } else if (!recordedTeam) {
    //   await grabTeam(url);
    // }
  }

  //   closeConnection();
};

run();
