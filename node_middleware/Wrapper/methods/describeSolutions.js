const describeSolution = require("./describeSolution.js");

function describeSolutions(sessionVar) {
  console.log("describeSolutions called");
  let solutions = Array.from(sessionVar.solutions.values());

  let chain = Promise.resolve();
  for (let i = 0; i < solutions.length; i++) {
    let solution = solutions[i];
    chain = chain.then(solutionID => {
      return describeSolution(solution);
    });
  }
  return new Promise(function(fulfill, reject) {
    let _fulfill = fulfill;
    let _reject = reject;
    chain
      .then(function(res) {
        _fulfill(sessionVar);
      })
      .catch(function(err) {
        _reject(err);
      });
  });
}

module.exports = describeSolutions;
