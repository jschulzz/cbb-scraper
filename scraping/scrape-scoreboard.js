const { BASE_URL } = process.env;
import axios from "axios";
import cheerio from "cheerio";

import { scrapeGame } from "./scrape-game.js";

export const scrapePage = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const gameLinks = $("td.gamelink")
    .map((i, el) => {
      return $(el).find("a").attr("href");
    })
    .toArray();

  for (const gameLink of gameLinks) {
    try {
      console.log(gameLink);
      await scrapeGame(gameLink);
    } catch (error) {
      console.error("unable to scrape", error);
    }
  }
};
