import axios from "axios";
import cheerio from "cheerio";
import { client } from "../elasticsearch/client.js";
import { openConnection } from "../database/util.js";
import { Team } from "../models/index.js";

const indexGames = async (games) => {
  const body = games.flatMap((game) => {
    return [
      {
        index: {
          _index: "gamelogs",
          _id: `${game.date.getTime()}-${game.opponent}`,
        },
      },
      game,
    ];
  });
  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  console.log("Submitted");
  console.log(body[1]);

  if (bulkResponse?.errors) {
    const erroredDocuments = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    console.log(erroredDocuments);
  }
};

export const scrapeGames = async (year, team) => {
  const url = `https://www.sports-reference.com/cbb/schools/${team}/${year}-gamelogs.html`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const games = [];
  const rows = $("#sgl-basic").find("tbody tr");
  for (const row of rows) {
    const [date, loc, opponent, gameResult] = $(row).find("td").toArray();
    const gameDate = new Date($(date).text());
    const opp = ($(opponent).find("a").attr("href") || "").trim().split("/")[3];
    const result = $(gameResult).text();
    const isTournament =
      $(loc).text() === "N" &&
      gameDate.getMonth() >= 2 &&
      gameDate.getMonth() < 7
        ? "Y"
        : "N";

    if (opp) {
      const conference = (await Team.findOne({ name: opp })).toObject()
        .conference;
      games.push({
        team,
        date: gameDate,
        opponent: opp,
        result,
        isTournament,
        conference,
      });
    }
  }

  return games;
};

const run = async () => {
  const start = 2011;
  const team = "kentucky";
  await openConnection();
  for (let year = start; year <= 2022; year++) {
    const games = await scrapeGames(year, team);
    await indexGames(games);
  }
};

run();
