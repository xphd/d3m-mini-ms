const fs = require("fs");

// import variables
const properties = require("../properties");
const proto = properties.proto;

function getFitSolutionResults(
  solution,
  fitSolutionResponseID,
  fulfill,
  reject
) {
  let _fulfill = fulfill;
  let _reject = reject;
  let getFitSolutionResultsRequest = new proto.GetFitSolutionResultsRequest();
  getFitSolutionResultsRequest.setRequestId(fitSolutionResponseID);

  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    let call = client.getFitSolutionResults(getFitSolutionResultsRequest);
    call.on("data", function(getFitSolutionResultsResponse) {
      // console.log("getfitSolutionResultsResponse", getFitSolutionResultsResponse);
      if (getFitSolutionResultsResponse.progress.state === "COMPLETED") {
        // fitting solution is finished
        let fitID = getFitSolutionResultsResponse.fitted_solution_id;
        let exposedOutputs = getFitSolutionResultsResponse.exposed_outputs;
        // console.log("FITTED SOLUTION COMPLETED", fitID);
        // console.log("EXPOSED OUTPUTS", exposedOutputs);
        solution.fit = {
          fitID: fitID,
          exposedOutputs: exposedOutputs
        };

        // Added by Alex, for the purpose of Pipeline Visulization
        let pathPrefix = "responses/getFitSolutionResultsResponses/";
        let pathMid = solution.solutionID;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(getFitSolutionResultsResponse);
        fs.writeFileSync(path, responseStr);
      }
    });
    call.on("error", function(err) {
      console.log("Error!getFitSolutionResults", fitSolutionResponseID);
      _reject(err);
    });
    call.on("end", function(err) {
      console.log("End of fitted solution results", fitSolutionResponseID);
      if (err) console.log("err is ", err);
      _fulfill(fitSolutionResponseID);
    });
  });
}

module.exports = getFitSolutionResults;
