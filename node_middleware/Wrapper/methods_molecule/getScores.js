const fs = require("fs");
const _ = require("lodash");
const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

// import variables
const properties = require("../properties");
const proto = properties.proto;

// import mappings
const metric_mappings = require("../mappings/metric_mappings");

// import functions
const getMappedType = require("../functions/getMappedType");
const handleImageUrl = require("../functions/handleImageUrl");

function getScores(solutionIDs_selected, metrics) {
  console.log("getScores");
  let chain = Promise.resolve();

  let pathPrefix = "responses/getScoreResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }
  for (let i = 0; i < solutionIDs_selected.length; i++) {
    let solutionID = solutionIDs_selected[i];
    chain = chain.then(() => {
      return getScore(solutionID, metrics);
    });
  }

  return new Promise(function(fulfill, reject) {
    let _fulfill = fulfill;
    chain
      .then(function(res) {
        _fulfill();
      })
      .catch(function(err) {
        // console.log("ERR", err);
        reject(err);
      });
  });
}

function getScore(solutionID, metrics) {
  console.log("scoring solution with id", solutionID);
  let scoreSolutionRequest = new proto.ScoreSolutionRequest();
  scoreSolutionRequest.setSolutionId(solutionID);

  let dataset_input = new proto.Value();
  dataset_input.setDatasetUri(
    "file://" + handleImageUrl(evaluationConfig.dataset_schema)
  );
  scoreSolutionRequest.setInputs(dataset_input);

  let mapped_metrics = metrics.map(metric =>
    getMappedType(metric_mappings, metric)
  );
  let problemPerformanceMetrics = mapped_metrics.map(mapped_metric => {
    let newMetric = new proto.ProblemPerformanceMetric();
    newMetric.setMetric(mapped_metric);
    return newMetric;
  });
  scoreSolutionRequest.setPerformanceMetrics(problemPerformanceMetrics);

  let scoringConfiguration = new proto.ScoringConfiguration();

  scoringConfiguration.setMethod(proto.EvaluationMethod.HOLDOUT);
  scoringConfiguration.setTrainTestRatio(0.8);

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
        getScoresResponse(solutionID, scoreRequestID, fulfill, reject);
      }
    });
  });
}

function getScoresResponse(solutionID, scoreRequestID, fulfill, reject) {
  let _fulfill = fulfill;
  let _reject = reject;
  let getScoreSolutionResultsRequest = new proto.GetScoreSolutionResultsRequest();
  getScoreSolutionResultsRequest.setRequestId(scoreRequestID);
  const client = properties.client;
  let call = client.getScoreSolutionResults(getScoreSolutionResultsRequest);
  call.on("data", function(getScoreSolutionResultsResponse) {
    // Added by Alex, for the purpose of Pipeline Visulization
    let pathPrefix = "responses/getScoreResponses/";
    let pathMid = solutionID;
    let pathAffix = ".json";
    let path = pathPrefix + pathMid + pathAffix;
    let responseStr = JSON.stringify(getScoreSolutionResultsResponse);
    fs.writeFileSync(path, responseStr);

    if (getScoreSolutionResultsResponse.progress.state === "COMPLETED") {
      // console.log("scoreSolutionResultsResponse", getScoreSolutionResultsResponse);
      /*
          let targets = getScoreSolutionResultsResponse.scores.map(score => score.targets);
          */
      let value_keys = getScoreSolutionResultsResponse.scores.map(
        score => score.value.value
      );
      let metrics = getScoreSolutionResultsResponse.scores.map(
        score => score.metric
      );
      let values = value_keys.map(
        (key, i) => getScoreSolutionResultsResponse.scores[i].value[key]
      );
      values = values.map(thing => thing[thing.raw]);
      // console.log("METRICS", metrics);
      // console.log("VALUES", values);
      // solution.scores = {};
      let solution = properties.sessionVar.solutions.get(solutionID);
      for (let i = 0; i < metrics.length; i++) {
        // solution.scores = { f1Macro: _.mean(values) };
        let metric = metrics[i];
        console.log("METRICS", metric, values, "num values", values.length);
        console.log(values);

        // solution.scores[metric.metric] = _.mean(values);
        solution.scores[metric.metric] = values[i];
        console.log("solution:", solutionID);
        console.log(solution);
      }
    } else {
      console.log(
        "scoreSolutionResultsResponse INTERMEDIATE",
        getScoreSolutionResultsResponse
      );
    }
    // // Added by Alex, for the purpose of Pipeline Visulization
    // let pathPrefix = "responses/getScoreResponses/";
    // let pathMid = solutionID;
    // let pathAffix = ".json";
    // let path = pathPrefix + pathMid + pathAffix;
    // let responseStr = JSON.stringify(getScoreSolutionResultsResponse);
    // fs.writeFileSync(path, responseStr);
  });
  call.on("error", function(err) {
    console.log("Error!getScoreSolutionResults: ", scoreRequestID);
    _reject(err);
  });
  call.on("end", function(err) {
    console.log("End of score solution result: ", scoreRequestID);
    if (err) console.log("err is ", err);
    _fulfill(scoreRequestID);
  });
}

module.exports = getScores;
