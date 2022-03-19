import axios from "axios";
import cheerio from "cheerio";

import { Team, Player } from "../models/index.js";
import { scrapeStatRow } from "./utils.js";
import { openConnection, closeConnection } from "../database/util.js";

const { BASE_URL } = process.env;

const scrapePlayerRow = (row) => {
  const stats = scrapeStatRow(row);
  const name = row.find("td[data-stat=player] a").text().trim();
  const id = row.find("td[data-stat=player]").attr("data-append-csv");
  return { ...stats, name, id };
};

export const scrapeTeam = async (url) => {
  openConnection();

  if (!url.includes("https:")) {
    url = `${BASE_URL}${url}`;
  }

  const response = await axios.get(url);

  const $ = cheerio.load(response.data);

  const school_name = url.split("/")[5];
  const logo_url = $("img.teamlogo").attr("src");
  const full_name = $("img.teamlogo").attr("alt").slice(0, -5).trim();

  const header = $("div[data-template=Partials/Teams/Summary]");
  const topStats = {};
  const paragraphs = header.find("p");
  paragraphs.each((i, el) => {
    const label = $(el).find("strong").text().replace(/\s/g, " ").trim();
    topStats[label] = $(el).text().replace(/\s/g, " ").trim().split(": ")[1];
  });
  const coach = topStats["Coach:"];
  const scored = +topStats["PS/G:"].split(" ")[0];
  const allowed = +topStats["PA/G:"].split(" ")[0];
  const srs = topStats["SRS:"] ? +topStats["SRS:"].split(" ")[0] : undefined;
  const sos = topStats["SOS:"] ? +topStats["SOS:"].split(" ")[0] : undefined;
  const o_rtg = +topStats["ORtg:"].split(" ")[0];
  const d_rtg = +topStats["DRtg:"].split(" ")[0];
  const fullRecord = topStats["Record:"].split(" ");
  const record = fullRecord[0];
  const conference = fullRecord.join(" ").split("in ")[1].slice(0, -1);
  const teamStatRow = $("#schools_per_game")
    .find("tbody")
    .find("tr:nth-child(1)");

  const players = $("#per_game")
    .find("tbody")
    .find("tr")
    .map((idx, _el) => {
        const stats = scrapePlayerRow($(_el));
      return {
        player_id: stats.id,
        player_name: stats.name,
        stats
      };
    })
    .toArray();
  const stats = scrapeStatRow(teamStatRow);

  for (const player of players) {
    await Player.updateOne(
      { id: player.player_id },
      {
        $set: {
          id: player.player_id,
          name: player.player_name,
          team_id: school_name,
          ...player.stats
        },
      },
      { upsert: true }
    );
  }

  await Team.updateOne(
    { name: school_name },
    {
      $set: {
        id: school_name,
        ...stats,
        points_allowed: allowed,
        sos,
        o_rtg,
        d_rtg,
        link: url,
        name: school_name,
        logo_url,
        mascot: full_name,
        scraped: Date.now(),
        wins: +record.split("-")[0],
        losses: +record.split("-")[1],
        year: 2021,
        conference,
        player_ids: players.map((player) => player.player_id),
      },
    },
    { upsert: true }
  );
};
