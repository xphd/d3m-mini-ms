const fs = require("fs");

// import variables
const properties = require("../properties");
const proto = properties.proto;

function getDescriptions(solutionIDs_selected) {
  console.log("describeSolutions called");
  // let solutions = Array.from(sessionVar.solutions.values());
  let solutionIDs = solutionIDs_selected;
  let chain = Promise.resolve();
  for (let i = 0; i < solutionIDs.length; i++) {
    let solutionID = solutionIDs[i];
    chain = chain.then(() => {
      return getDescription(solutionID);
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

function getDescription(solutionID) {
  // doing the shortcut now and see how far this takes us
  // console.log("WARNING: TAKING THE DESCRIBE-SOLUTION SHORTCUT FOR NOW");
  // return new Promise(function(fulfill, reject) {
  //   solution.finalOutput = "outputs.0";
  //   fulfill(solution);
  // });
  // THIS DOES NOT GET EXECUTED FOR NOW
  console.log("request describe solution with id", solutionID);
  let describeSolutionRequest = new proto.DescribeSolutionRequest();
  describeSolutionRequest.setSolutionId(solutionID);

  // Added by Alex, for the purpose of Pipeline Visulization
  let pathPrefix = "responses/describeSolutionResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }

  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    let solution = properties.sessionVar.solutions.get(solutionID);
    client.describeSolution(describeSolutionRequest, function(
      err,
      describeSolutionResponse
    ) {
      if (err) {
        reject(err);
      } else {
        // this is a PipelineDescription message
        let pipeline = describeSolutionResponse.pipeline;
        // console.log(pipeline);
        let outputs = pipeline.outputs;
        console.log(outputs);
        let finalOutput = outputs[outputs.length - 1].data;
        console.log("selecting final output for ", solutionID, finalOutput);

        solution.finalOutput = finalOutput;
        fulfill(solution);

        // Added by Alex, for the purpose of Pipeline Visulization
        let pathPrefix = "responses/describeSolutionResponses/";
        let pathMid = solutionID;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(describeSolutionResponse);
        fs.writeFileSync(path, responseStr);
      }
    });
  });
}

module.exports = getDescriptions;
