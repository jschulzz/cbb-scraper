import { readFileSync, writeFileSync } from "fs";
import Graph from "graphology";
import { openConnection } from "../database/util.js";
import { Game, Team } from "../models/index.js";

const BFS = (graph, start, end) => {
  const MAX_DEPTH = 6;
  const paths = [];
  const queue = [{ pathEnd: start, path: [start] }];
  const explored = [];
  while (queue.length) {
    const { pathEnd, path } = queue.shift();
    if (path.length > MAX_DEPTH) {
      continue;
    }
    if (pathEnd === end) {
      paths.push(path);
    } else {
      explored.push(pathEnd);
    }

    const neighbors = graph.filterOutNeighbors(
      pathEnd,
      (neighbor, attributes) => true
      // attributes.conference === graph.getNodeAttributes(pathEnd).conference
    );
    neighbors.forEach((neighbor) => {
      if (!explored.includes(neighbor)) {
        queue.push({ pathEnd: neighbor, path: [...path, neighbor] });
      }
    });
  }
  return paths;
};
const DFS = (graph, start, end, MAX_DEPTH = 6) => {
  const stack = [{ pathEnd: start, path: [start] }];
  const paths = [];
  while (stack.length) {
    const { pathEnd, path } = stack.pop();
    if (path.length > MAX_DEPTH) {
      continue;
    }
    if (pathEnd === end && path.length === MAX_DEPTH) {
      return [path];
    }
    if (pathEnd === end && path.length > 1) {
      paths.push([...path]);
    } else {
      //   const neighbors = graph.outNeighbors(pathEnd);
      const neighbors = graph.filterOutNeighbors(
        pathEnd,
        (neighbor, attributes) =>
          attributes.conference === graph.getNodeAttributes(pathEnd).conference
      );

      neighbors.forEach((n) => {
        if (!path.includes(n) || n === start)
          stack.push({ pathEnd: n, path: [...path, n] });
      });
    }
  }
  return paths;
};

const generateGraph = async () => {
  await openConnection();
  const allGames = await Game.find({});
  const graph = new Graph({ multi: true });

  for (const game of allGames) {
    const winnerName = game.toObject().teams.find((team) => team.win).team;
    const loserName = game.toObject().teams.find((team) => !team.win).team;

    const winner = await Team.findOne({ name: winnerName });
    const loser = await Team.findOne({ name: loserName });
    if (!winner || !loser) {
      continue;
    }

    if (!graph.hasNode(winnerName)) {
      graph.addNode(winnerName, { conference: winner.conference });
    }
    if (!graph.hasNode(loserName)) {
      graph.addNode(loserName, { conference: loser.conference });
    }
    graph.addEdge(winnerName, loserName);
  }
  console.log("Graph Generated!");
  const graphExport = graph.export();
  writeFileSync("graphFile.json", JSON.stringify(graphExport));
};

const buildGraph = async () => {
  const graph = new Graph({ multi: true });
  graph.import(JSON.parse(readFileSync("graphFile.json")));
  //   const graph = await generateGraph();
  //   console.log(graph);
  return graph;
};

const run = async () => {
  const graph = await buildGraph();
  const paths = DFS(graph, "kentucky", "kentucky", 16)
    .sort((a, b) => (a.length < b.length ? 1 : -1))
    .slice(0, 1);

    
  console.log(paths);
};

run();
