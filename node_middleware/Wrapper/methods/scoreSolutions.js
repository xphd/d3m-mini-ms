const fs = require("fs");

const scoreSolution = require("./scoreSolution.js");

function scoreSolutions(sessionVar) {
  // console.log("scoreSolutions called");
  let solutions = Array.from(sessionVar.solutions.values());

  let chain = Promise.resolve();
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i];
    chain = chain.then(solutionID => {
      return scoreSolution(solution);
    });
  }

  // Added by Alex, for the purpose of Pipeline Visulization
  // onetime response
  let pathPrefix = "responses/scoreSolutionResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }
  pathPrefix = "responses/getScoreSolutionResultsResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }

  return new Promise(function(fulfill, reject) {
    let _fulfill = fulfill;
    chain
      .then(function(res) {
        for (let i = 0; i < solutions.length; i++) {
          let solution = solutions[i];
          if (!solution.scores) {
            console.log(
              "WARNING: solution " +
                solution.solutionID +
                " has no scores; removing from results set"
            );
            sessionVar.solutions.delete(solution.solutionID);
          }
        }
        _fulfill(sessionVar);
      })
      .catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
  });
}

module.exports = scoreSolutions;
