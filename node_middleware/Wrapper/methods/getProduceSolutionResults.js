const fs = require("fs");

// import variables
const properties = require("../properties");
const proto = properties.proto;

function getProduceSolutionResults(
  solution,
  produceSolutionRequestID,
  fulfill,
  reject
) {
  // console.log("get produce solution called");
  let _fulfill = fulfill;
  let _reject = reject;
  let getProduceSolutionResultsRequest = new proto.GetProduceSolutionResultsRequest();
  getProduceSolutionResultsRequest.setRequestId(produceSolutionRequestID);

  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    let call = client.GetProduceSolutionResults(
      getProduceSolutionResultsRequest
    );
    call.on("data", function(getProduceSolutionResultsResponse) {
      // console.log("getProduceSolutionResultsResponse", getProduceSolutionResultsResponse);
      if (getProduceSolutionResultsResponse.progress.state === "COMPLETED") {
        // fitting solution is finished
        let exposedOutputs = getProduceSolutionResultsResponse.exposed_outputs;
        // console.log("PRODUCE SOLUTION COMPLETED", produceSolutionResponseID);
        // console.log("EXPOSED OUTPUTS", exposedOutputs);
        let steps = Object.keys(exposedOutputs);
        if (steps.length !== 1) {
          console.log("EXPOSED OUTPUTS:", exposedOutputs);
          console.log("ONLY USING FIRST STEP OF", steps);
        }
        solution.fit.outputCsv = exposedOutputs[steps[0]]["csv_uri"].replace(
          "file://",
          ""
        );
        if (!solution.fit.outputCsv.trim()) {
          console.log(
            "WARNING: solution " +
              solution.solutionID +
              " has not output file; removing from results set"
          );
          sessionVar.solutions.delete(solution.solutionID);
        }
        // console.log("solution.fit.outputCsv", solution.fit.outputCsv);
      }

      // Added by Alex, for the purpose of Pipeline Visulization
      let pathPrefix = "responses/getProduceSolutionResultsResponses/";
      let pathMid = produceSolutionRequestID;
      let pathAffix = ".json";
      let path = pathPrefix + pathMid + pathAffix;
      let responseStr = JSON.stringify(getProduceSolutionResultsResponse);
      fs.writeFileSync(path, responseStr);
    });
    call.on("error", function(err) {
      console.log("Error!getProduceSolutionResults", produceSolutionRequestID);
      _reject(err);
    });
    call.on("end", function(err) {
      console.log("End of produce solution results", produceSolutionRequestID);
      if (err) console.log("err is ", err);
      _fulfill(produceSolutionRequestID);
    });
  });
}
module.exports = getProduceSolutionResults;
