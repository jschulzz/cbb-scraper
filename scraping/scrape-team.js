import axios from "axios";
import cheerio from "cheerio";

import { Team } from "../models/index.js";
import { openConnection, closeConnection } from "../database/util.js";

const { BASE_URL } = process.env;

export const scrapeStatRow = (row) => {
  const stats = [
    { db_stat: "fgm", web_stat: "fg_per_g" },
    { db_stat: "fga", web_stat: "fga_per_g" },
    { db_stat: "2pm", web_stat: "fg2_per_g" },
    { db_stat: "2pa", web_stat: "fg2a_per_g" },
    { db_stat: "3pm", web_stat: "fg3_per_g" },
    { db_stat: "3pa", web_stat: "fg3a_per_g" },
    { db_stat: "ftm", web_stat: "ft_per_g" },
    { db_stat: "fta", web_stat: "fta_per_g" },
    { db_stat: "orb", web_stat: "orb_per_g" },
    { db_stat: "drb", web_stat: "drb_per_g" },
    { db_stat: "trb", web_stat: "trb_per_g" },
    { db_stat: "ast", web_stat: "ast_per_g" },
    { db_stat: "stl", web_stat: "stl_per_g" },
    { db_stat: "blk", web_stat: "blk_per_g" },
    { db_stat: "tov", web_stat: "tov_per_g" },
    { db_stat: "pf", web_stat: "pf_per_g" },
    { db_stat: "pts", web_stat: "pts_per_g" },
  ];

  const results = {};

  stats.forEach(({ db_stat, web_stat }) => {
    results[db_stat] = +row.find(`td[data-stat=${web_stat}]`).text().trim();
  });
  return results;
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
  const stats = scrapeStatRow(teamStatRow);
  console.log(stats);

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
      },
    },
    { upsert: true }
  );
  closeConnection();

  //   mongoose.connection.close();
};

scrapeTeam("https://www.sports-reference.com/cbb/schools/kentucky/2021.html");
