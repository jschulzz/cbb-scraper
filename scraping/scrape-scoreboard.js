const { BASE_URL } = process.env;
import { load } from "cheerio";
import { makeRequest } from "./requester.js";

import { scrapeGame } from "./scrape-game.js";
import { scrapeTeam } from "./scrape-team.js";

const scrapeDayOfGames = async (url) => {
  console.log("Scraping Scoreboard Day", url)
  const response = await makeRequest(url);
  const $ = load(response.data);

  const gameLinks = $("table.teams")
    .filter((i, el) => {
      return $(el).find("td.desc").text().trim() === "Men's";
    })
    .filter((i, el) => {
      return $(el).find("a").map((j, a) => $(a).attr("href")).length === 3;
    })
    .map((i, el) => {
      return $(el).find("td.gamelink a").attr("href");
    })
    .toArray().filter(x => !!x);

  for (const gameLink of gameLinks) {
    try {
      await scrapeGame(gameLink);
    } catch (error) {
      console.error("unable to scrape", error);
    }
  }
};

const endDate = new Date(2023, 2, 5);
for (
  let date = new Date(2023, 2, 3);
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
