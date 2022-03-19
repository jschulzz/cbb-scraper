import axios from "axios";
import cheerio from "cheerio";

import { openConnection, closeConnection } from "../database/util.js";
import { Game, Team, Performance, Player } from "../models/index.js";
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
  const teams = [];

  for (const teamId of teamIds) {
    const box = $(`table#box-score-basic-${teamId}`);
    const teamStats = scrapeStatRow($(box).find("tfoot tr"), { box: true });
    const home = url.includes(teamId);

    const performances = $(box)
      .find("tbody tr")
      .map((i, el) => {
        const stats = scrapeStatRow($(el), { box: true });
        // console.log(stats);
        return {
          player_name: $(el).find("th").attr("csk"),
          player_id: $(el).find("th").attr("data-append-csv"),
          stats,
        };
      })
      .toArray()
      .filter((x) => x.player_id);

    const performanceIds = [];

    for (const [idx, performance] of performances.entries()) {
      await Player.updateOne(
        { id: performance.player_id },
        {
          $set: {
            id: performance.player_id,
            name: performance.player_name, 
            team_id: teamId,
          },
        },
        { upsert: true }
      );

      const performanceId = `${Date.parse(date)}-${performance.player_id}`;
      performanceIds.push(performanceId);

      await Performance.updateOne(
        { id: performanceId },
        {
          $set: {
            id: performanceId,
            player_id: performance.player_id,
            team_id: teamId,
            opponent_id: teamIds.find((id) => id !== teamId),
            minutes: performance.minutes,
            started: idx <= 4,
            ...performance.stats,
          },
        },
        { upsert: true }
      );
    }

    teams.push({ ...teamStats, home, team_id: teamId, performanceIds });
  }

  if (teams[0].pts > teams[1].pts) {
    teams[0].win = true;
    teams[1].win = false;
  } else {
    teams[0].win = false;
    teams[1].win = true;
  }

  await Game.updateOne(
    { id: url },
    {
      $set: {
        id: url,
        link: url,
        date: Date.parse(date),
        scraped: Date.now(),
        teams,
      },
    },
    { upsert: true }
  );
};
