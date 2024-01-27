import { openConnection, closeConnection } from "../database/util.js";
import { Team, Game } from "../models/index.js";

// player averages
export const getMaxAverages = (dataset, dataTransformer, initialValue) => {
  const averages = dataset[0];
  const newAverages = {};
  Object.entries(averages).forEach(([key, value]) => {
    newAverages[key] = [initialValue];
  });
  dataset.forEach((player) => {
    Object.entries(newAverages).forEach(([stat, leaders]) => {
      if (player[stat] > leaders[0].value || leaders[0].value === 0) {
        newAverages[stat] = [dataTransformer(player, stat)];
      } else if (player[stat] === leaders[0].value) {
        newAverages[stat].push(dataTransformer(player, stat));
      }
    });
  });

  return newAverages;
};

const run = async () => {
  openConnection();

  const allPlayers = (await Team.find({}))
    .map((team) =>
      team.toObject().players.map((player) => {
        return { ...player, team: team.name };
      })
    )
    .flat();
  const allTeams = (await Team.find({})).map((team) => team.toObject());
  const allTeamGames = (await Game.find({}))
    .map((game) => {
      game = game.toObject();
      const date = game.date;
      const teams = game.teams.map((team) => {
        return { ...team, date };
      });
      return teams;
    })
    .flat();
  const allPlayerGames = (await Game.find({}))
    .map((game) => {
      game = game.toObject();
      const date = game.date;
      const players = game.teams.map((team) => {
        return team.players.map((player) => {
          return { ...player, date, team: team.team };
        });
      });
      return players.flat();
    })
    .flat();

  const teamGames = getMaxAverages(
    allTeamGames,
    (team, stat) => {
      return {
        value: team[stat],
        team: team.team,
        date: team.date,
      };
    },
    { value: 0, date: 0, team: "" }
  );
  const playerGames = getMaxAverages(
    allPlayerGames,
    (player, stat) => {
      return {
        value: player[stat],
        name: player.name,
        date: player.date,
        team: player.team,
      };
    },
    { value: 0, name: "", date: 0, team: "" }
  );

  const players = getMaxAverages(
    allPlayers,
    (player, stat) => {
      return {
        value: player[stat],
        player: player.name,
        team: player.team,
      };
    },
    { value: 0, player: "", team: "" }
  );

  Object.entries(teamGames).forEach(([stat, leaders]) => {
    console.log(
      `\n${leaders.length} teams achieved ${leaders[0].value} ${stat} in a game`
    );
    if (leaders.length < 20) {
      leaders.forEach((leader) => {
        console.log(`\t${leader.team} - ${leader.date}`);
      });
    }
  });
  Object.entries(playerGames).forEach(([stat, leaders]) => {
    console.log(
      `\n${leaders.length} players achieved ${leaders[0].value} ${stat} in a game`
    );
    if (leaders.length < 20) {
      leaders.forEach((leader) => {
        console.log(`\t${leader.name} - ${leader.team} \t ${leader.date}`);
      });
    }
  });
  Object.entries(players).forEach(([stat, leaders]) => {
    console.log(
      `\n${leaders.length} players achieved ${leaders[0].value} ${stat} per game`
    );
    if (leaders.length < 20) {
      leaders.forEach((leader) => {
        console.log(`\t${leader.player} - ${leader.team}`);
      });
    }
  });
  const teams = getMaxAverages(
    allTeams,
    (team, stat) => {
      return { value: team[stat], name: team.name };
    },
    { value: 0, name: "" }
  );

  Object.entries(teams).forEach(([stat, leaders]) => {
    console.log(
      `\n${leaders.length} teams achieved ${leaders[0].value} ${stat} per game`
    );
    if (leaders.length < 20) {
      leaders.forEach((leader) => {
        console.log(`\t${leader.name}`);
      });
    }
  });
  closeConnection();
};

run();
