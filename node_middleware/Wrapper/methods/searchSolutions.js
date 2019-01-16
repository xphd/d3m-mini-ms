const fs = require("fs");
const appRoot = require("app-root-path");
const evaluationConfig = require(appRoot + "/tufts_gt_wisc_configuration.json");

// import variables
const properties = require("../properties");
const proto = properties.proto;

const userAgentTA3 = properties.userAgentTA3;
const grpcVersion = properties.grpcVersion;
const allowed_val_types = properties.allowed_val_types;

// import functions
const getMappedType = require("../functions/getMappedType");
const getProblemSchema = require("../functions/getProblemSchema");
const handleImageUrl = require("../functions/handleImageUrl");

// import mappings
const metric_mappings = require("../mappings/metric_mappings");
const task_subtype_mappings = require("../mappings/task_subtype_mappings");
const task_type_mappings = require("../mappings/task_type_mappings");

const getSearchSolutionResults = require("./getSearchSolutionResults.js");

function searchSolutions(sessionVar) {
  // remove old solutions
  // sessionVar.solutions = new Map();
  const problemSchema = getProblemSchema();
  console.log(problemSchema.about.problemID);
  return new Promise(function(fulfill, reject) {
    var request = new proto.SearchSolutionsRequest();

    request.setUserAgent(userAgentTA3);
    request.setVersion(grpcVersion);
    if (sessionVar.ta2Ident.user_agent.startsWith("nyu_ta2")) {
      console.log(
        "nyu ta2 detected; setting time bound for searching solutions to 10"
      );
      request.setTimeBound(10);
    } else {
      console.log(
        "non-nyu ta2 detected; setting time bound for searching solutions to 2"
      );
      request.setTimeBound(2);
    }
    request.setAllowedValueTypes(allowed_val_types);

    var problem_desc = new proto.ProblemDescription();
    var problem = new proto.Problem();
    problem.setId(problemSchema.about.problemID);
    if (!problemSchema.about.problemVersion) {
      console.log("problem version not set, setting default value 1.0");
      problem.setVersion("1.0");
    } else {
      problem.setVersion(problemSchema.about.problemVersion);
    }
    problem.setName(problemSchema.about.problemName);
    problem.setDescription(problemSchema.about.problemDescription + "");
    problem.setTaskType(
      getMappedType(task_type_mappings, problemSchema.about.taskType)
    );
    if (task_subtype_mappings[problemSchema.about.taskSubType]) {
      problem.setTaskSubtype(
        getMappedType(task_subtype_mappings, problemSchema.about.taskSubType)
      );
    } else {
      problem.setTaskSubtype(task_subtype_mappings["none"]);
    }

    var metrics = [];

    for (var i = 0; i < problemSchema.inputs.performanceMetrics.length; i++) {
      metrics.push();
      metrics[i] = new proto.ProblemPerformanceMetric();
      metrics[i].setMetric(
        getMappedType(
          metric_mappings,
          problemSchema.inputs.performanceMetrics[i].metric
        )
      );
    }

    problem.setPerformanceMetrics(metrics);

    problem_desc.setProblem(problem);
    var inputs = [];
    // console.log("problem schema:", handleImageUrl(evaluationConfig.problem_schema));
    for (var i = 0; i < problemSchema.inputs.data.length; i++) {
      var targets = [];
      var next_input = new proto.ProblemInput();
      var thisData = problemSchema.inputs.data[i];
      next_input.setDatasetId(thisData.datasetID);
      for (var j = 0; j < thisData.targets.length; j++) {
        var next_target = new proto.ProblemTarget();
        var thisTarget = thisData.targets[j];
        next_target.setTargetIndex(thisTarget.targetIndex);
        next_target.setResourceId(thisTarget.resID);
        next_target.setColumnIndex(thisTarget.colIndex);
        next_target.setColumnName(thisTarget.colName);
        // next_target.setClustersNumber(clusters_num);
        targets.push(next_target);
      }
      next_input.setTargets(targets);
      inputs.push(next_input);
    }

    problem_desc.setInputs(inputs);

    var dataset_input = new proto.Value();
    dataset_input.setDatasetUri(
      "file://" + handleImageUrl(evaluationConfig.dataset_schema)
    );
    request.setInputs(dataset_input);
    request.setProblem(problem_desc);

    // console.log("REQUEST", JSON.stringify(request, null, 4));

    console.log("searchSolutions begin");
    const client = properties.client;
    client.searchSolutions(request, (err, searchSolutionsResponse) => {
      if (err) {
        console.log("Error!searchSolutions");
        // console.log(err);
        // console.log(searchSolutionsResponse);
        reject(err);
      } else {
        // Added by Alex, for the purpose of Pipeline Visulization
        let responseStr = JSON.stringify(searchSolutionsResponse);
        fs.writeFileSync("responses/searchSolutionsResponse.json", responseStr);

        sessionVar.searchID = searchSolutionsResponse.search_id;
        // setTimeout(() => getSearchSolutionResults(sessionVar, fulfill, reject), 180000);
        getSearchSolutionResults(sessionVar, fulfill, reject);
      }
    });
    console.log("searchSolutions end");
  });
}

module.exports = searchSolutions;
