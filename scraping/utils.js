export const scrapeStatRow = (row, options) => {
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
    if (options?.box) {
      web_stat = web_stat.slice(0, -6);
    }
    results[db_stat] = +row.find(`td[data-stat=${web_stat}]`).text().trim();
  });
  return results;
};
