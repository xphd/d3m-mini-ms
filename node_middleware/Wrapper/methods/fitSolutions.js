const fs = require("fs");

const fitSolution = require("./fitSolution.js");

function fitSolutions(sessionVar) {
  console.log("fitSolutions called");

  // Added by Alex, for the purpose of Pipeline Visulization
  let pathPrefix = "responses/fitSolutionResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }
  pathPrefix = "responses/getFitSolutionResultsResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }

  let solutions = Array.from(sessionVar.solutions.values());

  let chain = Promise.resolve();
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i];
    chain = chain.then(solutionID => {
      return fitSolution(solution, sessionVar);
    });
  }
  return new Promise(function(fulfill, reject) {
    chain
      .then(function(res) {
        // console.log("RES", res);
        fulfill(sessionVar);
      })
      .catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
  });
}

module.exports = fitSolutions;
