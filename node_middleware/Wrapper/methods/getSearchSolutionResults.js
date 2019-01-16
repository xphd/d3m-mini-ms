const fs = require("fs");

// import variables
const properties = require("../properties");
const proto = properties.proto;

function getSearchSolutionResults(sessionVar, fulfill, reject) {
  // this is needed so that fulfill or reject can be calle later
  let _fulfill = fulfill;
  let _reject = reject;
  let getSearchSolutionsResultsRequest = new proto.GetSearchSolutionsResultsRequest();
  getSearchSolutionsResultsRequest.setSearchId(sessionVar.searchID);

  // Added by Alex, for the purpose of Pipeline Visulization
  let pathPrefix = "responses/getSearchSolutionsResultsResponses/";
  if (!fs.existsSync(pathPrefix)) {
    fs.mkdirSync(pathPrefix);
  }

  return new Promise(function(fulfill, reject) {
    console.log("starting get search solution results call");
    // if (sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) {
    //   let timeBoundInMinutes = 1;
    //   console.log("NYU detected; making sure they stop sending solutions after a " + timeBoundInMinutes + "min time bound");
    /*
        setTimeout(function() {
          console.log("That's enough nyu! Calling endSearchSolutions");
          obj.endSearchSolutions(sessionVar);
        }, timeBoundInMinutes * 60 * 1000 * 5);
        */
    // setTimeout needs time in ms
    // }
    const client = properties.client;
    let call = client.getSearchSolutionsResults(
      getSearchSolutionsResultsRequest
    );
    call.on("data", function(getSearchSolutionsResultsResponse) {
      // console.log("searchSolutionResponse", getSearchSolutionsResultsResponse);
      // ta2s so not seem to send COMPLETED
      // if (getSearchSolutionsResultsResponse.progress.state === "COMPLETED") {

      // console.log("DATA CALL", getSearchSolutionsResultsResponse);

      let solutionID = getSearchSolutionsResultsResponse.solution_id;
      // if ( (!sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) ||
      // ignore of internal_score is NaN or 0 for nyu
      //      (getSearchSolutionsResultsResponse.internal_score)) {
      if (solutionID) {
        let solution = { solutionID: solutionID, scores: {} };
        sessionVar.solutions.set(solution.solutionID, solution);

        // console.log(sessionVar.solutions)

        // Added by Alex, for the purpose of Pipeline Visulization
        let pathPrefix = "responses/getSearchSolutionsResultsResponses/";
        let pathMid = solutionID;
        let pathAffix = ".json";
        let path = pathPrefix + pathMid + pathAffix;
        let responseStr = JSON.stringify(getSearchSolutionsResultsResponse);
        fs.writeFileSync(path, responseStr);
        let id = solutionID;
        let index = Array.from(sessionVar.solutions.values()).length;
        console.log("new solution:", index, id);
        // );
      } else {
        console.log("ignoring empty solution id");
      }
      // } else {
      //   console.log("ignoring solution (nyu / 0 or NaN)", solutionID);
      // }
    });
    call.on("error", function(err) {
      console.log("Error!getSearchSolutionResults");
      _reject(err);
    });
    call.on("end", function(err) {
      console.log("End of result: getSearchSolutionResults");

      if (err) console.log("err is ", err);
      _fulfill(sessionVar);
    });
  });
}

module.exports = getSearchSolutionResults;
