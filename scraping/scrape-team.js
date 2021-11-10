import axios from "axios";
import cheerio from "cheerio";

import { Team } from "../models/index.js";
import { scrapeStatRow } from "./utils.js";
import { openConnection, closeConnection } from "../database/util.js";

const { BASE_URL } = process.env;

const scrapePlayerRow = (row) => {
  const stats = scrapeStatRow(row);
  const name = row.find("td[data-stat=player]").attr("csk");
  const minutes = +row.find("td[data-stat=mp_per_g]").text().trim();
  return { ...stats, name, started: false, minutes };
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
  const [_record, _coach, _scored, _allowed, _srs, _sos, _o_rtg, _drtg] =
    header.find("p");
  const record = $(_record).text().replace(/\s/g, " ").trim().split(" ")[1];
  const coach = $(_coach).text().replace(/\s/g, " ").trim().split(": ")[1];
  const scored = +$(_scored)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];
  const allowed = +$(_allowed)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];
  const srs = +$(_srs)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];
  const sos = +$(_sos)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];
  const o_rtg = +$(_o_rtg)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];
  const d_rtg = +$(_drtg)
    .text()
    .replace(/\s/g, " ")
    .trim()
    .split(": ")[1]
    .split(" ")[0];

  const teamStatRow = $("#schools_per_game")
    .find("tbody")
    .find("tr:nth-child(1)");

  const players = $("#per_game")
    .find("tbody")
    .find("tr")
    .map((idx, _el) => {
      return scrapePlayerRow($(_el));
    })
    .toArray();
  const stats = scrapeStatRow(teamStatRow);
  console.log(players);

  await Team.updateOne(
    { name: school_name },
    {
      $set: {
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
        players,
      },
    },
    { upsert: true }
  );
  closeConnection();

  //   mongoose.connection.close();
};

scrapeTeam("https://www.sports-reference.com/cbb/schools/kentucky/2021.html");
