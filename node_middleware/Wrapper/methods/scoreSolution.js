const fs = require("fs");
const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

// import variables
const properties = require("../properties");
const proto = properties.proto;

// import mappings
const metric_mappings = require("../mappings/metric_mappings");

// import functions
const getMappedType = require("../functions/getMappedType");
const getProblemSchema = require("../functions/getProblemSchema");
const handleImageUrl = require("../functions/handleImageUrl");

const getScoreSolutionResults = require("./getScoreSolutionResults.js");

function scoreSolution(solution) {
  console.log("scoring solution with id", solution.solutionID);
  let scoreSolutionRequest = new proto.ScoreSolutionRequest();
  scoreSolutionRequest.setSolutionId(solution.solutionID);

  let dataset_input = new proto.Value();
  dataset_input.setDatasetUri(
    "file://" + handleImageUrl(evaluationConfig.dataset_schema)
  );
  scoreSolutionRequest.setInputs(dataset_input);

  const problemSchema = getProblemSchema();

  let metrics = problemSchema.inputs.performanceMetrics.map(d => d.metric);
  let mapped_metrics = metrics.map(metric =>
    getMappedType(metric_mappings, metric)
  );
  let problemPerformanceMetrics = mapped_metrics.map(mapped_metric => {
    let newMetric = new proto.ProblemPerformanceMetric();
    newMetric.setMetric(mapped_metric);
    return newMetric;
  });
  scoreSolutionRequest.setPerformanceMetrics(problemPerformanceMetrics);

  // TODO: the user stuff is actually all optional
  // let solutionRunUser = new proto.SolutionRunUser;
  // solutionRunUser.setId("user1");
  // solutionRunUser.setChoosen(false);
  // solutionRunUser.setReason("none");
  // scoreSolutionRequest.setUsers(solutionRunUser);

  // TODO: scoringConfiguration lets us influence cross valuation
  // and many other evaluation parameters; ignore for now
  let scoringConfiguration = new proto.ScoringConfiguration();
  // TODO: we should do better here
  // scoringConfiguration.setMethod(proto.EvaluationMethod.TRAINING_DATA);
  // I think TRAINING_DATA is pretty much what we did last time, but it's unsupported so far
  // scoringConfiguration.setMethod(proto.EvaluationMethod.HOLDOUT);
  scoringConfiguration.setMethod(proto.EvaluationMethod.HOLDOUT);
  scoringConfiguration.setTrainTestRatio(0.8);
  // TODO: use holdout for now, but let users specify in the future
  // scoringConfiguration.setFolds(2);
  scoreSolutionRequest.setConfiguration(scoringConfiguration);

  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    client.scoreSolution(scoreSolutionRequest, function(
      err,
      scoreSolutionResponse
    ) {
      if (err) {
        reject(err);
      } else {
        let scoreRequestID = scoreSolutionResponse.request_id;

        // Added by Alex, for the purpose of Pipeline Visulization
        let pathPrefix = "responses/scoreSolutionResponses/";
        // let pathMid = scoreRequestID;
        let pathMid = solution.solutionID;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(scoreSolutionResponse);
        fs.writeFileSync(path, responseStr);

        getScoreSolutionResults(solution, scoreRequestID, fulfill, reject);
      }
    });
  });
}

module.exports = scoreSolution;
