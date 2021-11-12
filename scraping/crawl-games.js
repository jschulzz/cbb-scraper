import { openConnection, closeConnection } from "../database/util.js";
import { Game, Team } from "../models/index.js";
import { scrapeTeam } from "./scrape-team.js";
const { BASE_URL } = process.env;

const run = async () => {
  openConnection();

  const allGames = await Game.find({});
  console.log(allGames.length);
  const allTeams = new Set();
  for (const game of allGames) {
    allTeams.add(game.teams[0].team);
    allTeams.add(game.teams[1].team);
  }
  console.log(allTeams);

  for (const team of allTeams) {
    // https://www.sports-reference.com/cbb/schools/california-baptist/2022.html
    const url = `${BASE_URL}/cbb/schools/${team}/2022.html`;
    const [recordedTeam] = await Team.find({ link: url });
    const now = new Date();
    const yesterday = now.setDate(now.getDate() - 1);

    const grabTeam = async (url) => {
      try {
        await scrapeTeam(url);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${team} is not tracked.`);
        } else {
          console.log(error);
        }
      }
    };

    if (recordedTeam && recordedTeam.scraped < yesterday) {
      await grabTeam(url);
    } else if (!recordedTeam) {
      await grabTeam(url);
    }
  }

//   closeConnection();
};

run();
