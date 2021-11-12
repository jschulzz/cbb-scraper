const { BASE_URL } = process.env;
import axios from "axios";
import cheerio from "cheerio";

import { scrapeGame } from "./scrape-game.js";
import { scrapeTeam } from "./scrape-team.js";

const url = `${BASE_URL}/cbb/boxscores`;
// const url = `${BASE_URL}/cbb/boxscores/index.cgi?month=11&day=9&year=2021`;

const scrapePage = async () => {
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

scrapePage();
