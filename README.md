# CollegeBasketball

## Setup - Install

1. Install docker
2. Install Mongo

## Setup - Pre-run

1. Make sure Docker is running
2. Start a mongodb server with `mongod`

## Setup - Environment

1. Update env.sh with proper connection config for MongoDB and Elasticsearch

## Scraping

Thius application runs on data from [sports-reference](https://www.sports-reference.com/cbb/). Sports-reference has a [scraping policy](https://www.sports-reference.com/bot-traffic.html) of no more than 20 request per minute (or you run the risk of being blocklisted for a period of time), so this application waits 5 seconds before making any request. This is more than the 3 seconds needed, but helps ensure we don't dangerously interfere with their traffic. 

1. Run `node scraping/scrape-scoreboard.js`
   * This will (slowly) grab all the games and populate the `performances`, `player`, and `games` Mongo collections 
   * *Note:* This will only track games with two D1 opponents. This is because sports-reference doesn't track D2 teams, so the analysis is wonky. In any case, D2 games _usually_ aren't indicative of a teams average performance
2. Update year in parse-games
3. Run `node scraping/parse-games.js`
   * This will grab all the teams associated with games and populate the `teams` collection with their season averages

## Analysis

The correlation coefficient in these cases is the [Tetrachoric correlation](https://www.statology.org/tetrachoric-correlation/). Knowing the team's record above and below a given stat threshold, we can calculate how correlated that stat is. 

### Get Correlations

This script will traverse through a team's games to find out what signals lead to their wins. These signals can include team stats, individual player stats, or opponent stats. For example, as of 03/06/2023, Kentucky has this as their strongest correlation:

```json
{
    r: 0.9206092404659743,
    stat: 'opponent_pts',
    value: 74.60000000000008,
    player: 'all',
    recordOver: '1-7',
    recordUnder: '20-3',
    team: 'kentucky',
    type: 'team-performance'
}
```
This indicates that Kentucky has a strong winrate when they keep their opponents under 74.5 points. 

### Compare Teams

This script will looks for correlations between a team's winrate and their opponent averages. For example, as of 03/06/2023, running the script for Kentucky and Duke yields this result (and more):
```plaintext
duke averages 25.8 fgm
kentucky has won 85.7% (18-3) when opponents average 27.3 or less fgm (r=0.885)
This favors kentucky
```
This indicates that Kentucky has a strong winning correlation against low-offense teams