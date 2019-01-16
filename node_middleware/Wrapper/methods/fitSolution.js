const fs = require("fs");
const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

// import variables
const properties = require("../properties");
const proto = properties.proto;

// import functions
const handleImageUrl = require("../functions/handleImageUrl.js");

const getFitSolutionResults = require("./getFitSolutionResults.js");

function fitSolution(solution, sessionVar) {
  // TODO: fix function
  let fitSolutionRequest = new proto.FitSolutionRequest();
  fitSolutionRequest.setSolutionId(solution.solutionID);
  var dataset_input = new proto.Value();
  dataset_input.setDatasetUri(
    "file://" + handleImageUrl(evaluationConfig.dataset_schema)
  );
  fitSolutionRequest.setInputs(dataset_input);
  fitSolutionRequest.setExposeOutputs(solution.finalOutput);
  fitSolutionRequest.setExposeValueTypes([proto.ValueType.CSV_URI]);
  // leave empty: repeated SolutionRunUser users = 5;
  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    client.fitSolution(fitSolutionRequest, function(err, fitSolutionResponse) {
      if (err) {
        reject(err);
      } else {
        let fitSolutionResponseID = fitSolutionResponse.request_id;
        getFitSolutionResults(solution, fitSolutionResponseID, fulfill, reject);

        // Added by Alex, for the purpose of Pipeline Visulization
        let pathPrefix = "responses/fitSolutionResponses/";
        let pathMid = solution.solutionID;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(fitSolutionResponse);
        fs.writeFileSync(path, responseStr);
      }
    });
  });
}
module.exports = fitSolution;
