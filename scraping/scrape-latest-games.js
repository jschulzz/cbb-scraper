const { BASE_URL } = process.env;
import { closeConnection, openConnection } from "../database/util.js";
import { Game } from "../models/index.js";
import { scrapePage } from "./scrape-scoreboard.js";

const url = `${BASE_URL}/cbb/boxscores`;
// const url = `${BASE_URL}/cbb/boxscores/index.cgi?month=11&day=9&year=2021`;
const run = async () => {
  openConnection();

  const [lastGame] = await Game.find({}).sort({ date: -1 }).limit(1);

  const lastRecordedGame = Date.parse(lastGame.toObject().date);
  console.log(lastRecordedGame);
  const startDate = new Date(lastRecordedGame);
  const endDate = new Date();
  for (
    const date = startDate;
    startDate < endDate;
    startDate.setDate(startDate.getDate() + 1)
  ) {
    const url = `${BASE_URL}/cbb/boxscores/index.cgi?month=${
      date.getMonth() + 1
    }&day=${date.getDate() + 1}&year=${date.getFullYear()}`;
    console.log(url);
    await scrapePage(url);
  }

  closeConnection();
};

run();
