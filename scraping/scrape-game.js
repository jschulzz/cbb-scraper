import axios from "axios";
import cheerio from "cheerio";

import { openConnection, closeConnection } from "../database/util.js";
import { Game } from "../models/game.js";
import { scrapeStatRow } from "./utils.js";
const { BASE_URL } = process.env;

export const scrapeGame = async (url) => {
  openConnection();

  if (!url.includes("https:")) {
    url = `${BASE_URL}${url}`;
  }

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const date = $("h1").text().trim().split("Score,")[1].trim();
  const teamIds = $("#inpage_nav ul li a")
    .map((i, el) => $(el).attr("href"))
    .toArray()
    .filter((href) => href.includes("box-score-basic"))
    .map((href) => href.slice(21));

//   console.log(teamIds);

  const teams = teamIds.map((teamId) => {
    const box = $(`table#box-score-basic-${teamId}`);
    const teamStats = scrapeStatRow($(box).find("tfoot tr"), { box: true });
    const home = url.includes(teamId);

    const players = $(box)
      .find("tbody tr")
      .map((i, el) => {
        return {
          name: $(el).find("th").attr("csk"),
          ...scrapeStatRow($(el), { box: true }),
        };
      })
      .toArray()
      .filter((x) => x.name);

    return { ...teamStats, home, team: teamId, players };
  });

  if (teams[0].pts > teams[1].pts) {
    teams[0].win = true;
    teams[1].win = false;
  } else {
    teams[0].win = false;
    teams[1].win = true;
  }

  const game = {
    link: url,
    scraped: Date.now(),
    date: Date.parse(date),
    teams,
  };

  await Game.updateOne(
    { link: url },
    {
      $set: game,
    },
    { upsert: true }
  );

};
