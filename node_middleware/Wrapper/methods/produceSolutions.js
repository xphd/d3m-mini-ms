const fs = require("fs");

const produceSolution = require("./produceSolution.js");

function produceSolutions(sessionVar) {
  let solutions = Array.from(sessionVar.solutions.values());
  let chain = Promise.resolve();
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i];
    chain = chain.then(solutionID => {
      return produceSolution(solution, sessionVar);
    });
  }

  // Added by Alex, for the purpose of Pipeline Visulization
  let pathPrefix = "responses/produceSolutionResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }
  pathPrefix = "responses/getProduceSolutionResultsResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }

  return new Promise(function(fulfill, reject) {
    chain
      .then(function(res) {
        console.log("produce solutions RES", res);
        fulfill(sessionVar);
      })
      .catch(function(err) {
        // console.log("produce solutions ERR", err);
        reject(err);
      });
  });
}

module.exports = produceSolutions;
