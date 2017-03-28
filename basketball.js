// basketball.js
var request = require('request');

function basketball(error, response, body) {
  if (!error && response.statusCode === 200) {
    var data = JSON.parse(body);
    var next = data.next;
    console.log("Game ID: " + data.id);
    console.log("=====");

    var allPlayers = data.players;

    var teamName1 = allPlayers[0].team_name;

    var team1 = allPlayers.filter(function(a) {return a.team_name === teamName1;});
    var team2 = allPlayers.filter(function(a) {return a.team_name !== teamName1;});

    var teamName2 = team2[0].team_name;

    var score1 = team1.reduce(function(acc, curr){return acc + Number(3*curr.three_pointers_made) + Number(2*(curr.field_goals_made-curr.three_pointers_made)) + Number(curr.free_throws_made);}, 0);
    var score2 = team2.reduce(function(acc, curr){return acc + Number(3*curr.three_pointers_made) + Number(2*(curr.field_goals_made-curr.three_pointers_made)) + Number(curr.free_throws_made);}, 0);
    console.log(teamName1 + " " + score1);
    console.log(teamName2 + " " + score2);

    var PlayerMostRebounds;
    var number_of_rebounds = 0;
    allPlayers.forEach(function(player){
    var numRebounds = Number(player.rebounds_offensive) + Number(player.rebounds_defensive);
    if (numRebounds > number_of_rebounds) {
      number_of_rebounds = numRebounds;
      PlayerMostRebounds = player.first_name + " " + player.last_name;
    }
    });

    console.log("* Most rebounds: " + PlayerMostRebounds + " " + number_of_rebounds);

    var guards = allPlayers.filter(function(player){return player.position_short === 'G';}).filter(function(guard){return guard.three_pointers_attempted > 0;});
    var threePointerPercentages = guards.map(function(guard) {return guard.three_pointers_made / guard.three_pointers_attempted;});
    var highest3Percentage = Math.max.apply(Math, threePointerPercentages);
    var bestGuard = guards[threePointerPercentages.indexOf(highest3Percentage)];
    var guardHighest3Percentage = bestGuard.first_name + bestGuard.last_name;
    var threesMadeAttempted = " (" + bestGuard.three_pointers_made + "/" + bestGuard.three_pointers_attempted + ")";

    console.log("* Guard (G) with highest 3 point percentage: " + guardHighest3Percentage + " at %" + (highest3Percentage*100) + threesMadeAttempted);

    var numPlayersAssist = 0;
    allPlayers.filter(function(player) {if (player.assists > 0) {numPlayersAssist++;}});
    console.log("There were " + numPlayersAssist + " that had at least one assist");

    var team1AttemptedFT = team1.reduce(function(acc, player){return acc + Number(player.free_throws_attempted);}, 0);
    var team2AttemptedFT = team2.reduce(function(acc, player){return acc + Number(player.free_throws_attempted);}, 0);
    var teamMostAttemptedFT = team1AttemptedFT > team2AttemptedFT ? teamName1:teamName2;
    console.log("* " + teamMostAttemptedFT + " attempted the most free throws... " + teamName1 + ": " + team1AttemptedFT + " " + teamName2 + ": " + team2AttemptedFT);

    var team1TurnOverAssists = team1.filter(function(player) {return player.turnovers > player.assists;});
    var team2TurnOverAssists = team2.filter(function(player) {return player.turnovers > player.assists;});

    console.log("* " + teamName1 + " players with more turnovers than assists");
    team1TurnOverAssists.forEach(function(player) {console.log("\t* " + player.first_name + " " + player.last_name + " has an assist to turnover ratio of " + player.assists + ":" + player.turnovers);});
    console.log("* " + teamName2 + " players with more turnovers than assists");
    team2TurnOverAssists.forEach(function(player) {console.log("\t* " + player.first_name + " " + player.last_name + " has an assist to turnover ratio of " + player.assists + ":" + player.turnovers);});
    
    if(next !== "") {
      console.log("wait ... there's more!");
      request(next, basketball);
    } else {
      console.log("Finished!");
    }
  }
}

request('http://foureyes.github.io/csci-ua.0480-fall2016-007/homework/02/0021500750.json', basketball);

