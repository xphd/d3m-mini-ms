const fs = require("fs");
const _ = require("lodash");

// import variables
const properties = require("../properties");
const proto = properties.proto;

function getScoreSolutionResults(solution, scoreRequestID, fulfill, reject) {
  let _fulfill = fulfill;
  let _reject = reject;
  let getScoreSolutionResultsRequest = new proto.GetScoreSolutionResultsRequest();
  getScoreSolutionResultsRequest.setRequestId(scoreRequestID);
  const client = properties.client;
  let call = client.getScoreSolutionResults(getScoreSolutionResultsRequest);
  call.on("data", function(getScoreSolutionResultsResponse) {
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
      solution.scores = {};
      for (let i = 0; i < metrics.length; i++) {
        // solution.scores = { f1Macro: _.mean(values) };
        console.log("METRICS", metrics[i], values, "num values", values.length);
        solution.scores[metrics[i].metric] = _.mean(values);
      }
    } else {
      console.log(
        "scoreSolutionResultsResponse INTERMEDIATE",
        getScoreSolutionResultsResponse
      );
    }

    // Added by Alex, for the purpose of Pipeline Visulization
    let pathPrefix = "responses/getScoreSolutionResultsResponses/";
    let pathMid = scoreRequestID;
    let pathAffix = ".json";
    let path = pathPrefix + pathMid + pathAffix;
    let responseStr = JSON.stringify(getScoreSolutionResultsResponse);
    fs.writeFileSync(path, responseStr);
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
module.exports = getScoreSolutionResults;
