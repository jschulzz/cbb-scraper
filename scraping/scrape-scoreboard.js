const { BASE_URL } = process.env;
import axios from "axios";
import cheerio from "cheerio";

import { scrapeGame } from "./scrape-game.js";
import { scrapeTeam } from "./scrape-team.js";

const scrapeDayOfGames = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const gameLinks = $("td.gamelink")
    .map((i, el) => {
      return $(el).find("a").attr("href");
    })
    .toArray();

  for (const gameLink of gameLinks) {
    try {
      await scrapeGame(gameLink);
    } catch (error) {
      console.error("unable to scrape", error);
    }
  }
};

const endDate = new Date(2022, 3, 15);
for (
  let date = new Date(2022, 2, 1 );
  date <= endDate;
  date.setDate(date.getDate() + 1)
) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  //   const url = `${BASE_URL}/cbb/boxscores`;
  const url = `${BASE_URL}/cbb/boxscores/index.cgi?month=${month}&day=${day}&year=${year}`;
  console.log(`Scraping ${year}-${month}-${day}`);
  await scrapeDayOfGames(url);
}
