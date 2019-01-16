"use strict";
const express = require("express");
const app = express();
var console = require("console");
var fs = require("fs");

const grpcClientWrapper = require("./Wrapper/Wrapper");

const configFilePath = "./config_files/tufts_gt_wisc_configuration.json";

//rewrite config file if necessary
var tinyconf = require("./lib/js/vendor/tinyconf");
try {
  var configPaths = [require.resolve(configFilePath)];
  //avoid require to read in json to avoid complications with caching at this point
  tinyconf(
    process.argv,
    "static/local_testing_data/",
    JSON.parse(fs.readFileSync(configPaths[0], "utf8")),
    configPaths
  );
} catch (err) {
  console.log("no fallback config file found", err);
  tinyconf(process.argv, "static/local_testing_data/", {}, [configFilePath]);
}

// var child_process = require("child_process");

var evaluationConfig = require(configFilePath);

evaluationConfig.user_problem_root =
  evaluationConfig.user_problem_root || "/output/problems";

// Load the grpc client wrapper

// var grpcConfig = require(appRoot + "/lib/js/grpc_client_wrapper.js");

// var grpcClientWrapper = null;

if (evaluationConfig.running_mode != "development") {
  // console.log("connecting to ta2");
  let ta2ConnectionString = "localhost:50051"; // FL
  // let ta2ConnectionString = 'localhost:45042' // MOCK
  // let ta2ConnectionString = 'localhost:50052' // TAMU
  if ("TA2_PORT" in process.env) {
    // make port for ta2 configurable through env var
    ta2ConnectionString = "localhost:" + process.env["TA2_PORT"];
  }
  // console.log("ta2 connection string: ", ta2ConnectionString);
  // console.log(grpcConfig);
  // grpcClientWrapper = grpcConfig.connect(ta2ConnectionString);
  grpcClientWrapper.connect(ta2ConnectionString);
  grpcClientWrapper.setEvaluationConfig(evaluationConfig);
  function exit() {
    console.log("exiting...");
    process.exit();
  }

  console.log("BACKEND STARTED IN INTEGRATION TEST MODE");
  // grpcClientWrapper.helloLoop();
  grpcClientWrapper
    .helloLoop()
    .then(grpcClientWrapper.searchSolutions)
    .then(grpcClientWrapper.scoreSolutions)
    .then(grpcClientWrapper.describeSolutions)
    .then(grpcClientWrapper.fitSolutions)
    .then(grpcClientWrapper.produceSolutions)
    .then(grpcClientWrapper.endSearchSolutions)
    .then(function(context) {
      return new Promise(function(fulfill, reject) {
        console.log("FINAL RESULT", context);
        fulfill();
      });
    })
    // test api, then exit container
    .then(exit)
    .catch(err => console.log("ERROR!", err));
}

//Tabular data pre-processing fire
const COORD_FACTOR = 1e7;
const NUM_PIPELINES = 5;

var initializers = require("./initializers");
initializers.set(app);

/***************************************************************************
 * END UTILITY FUNCTIONS
 * Here, we have utility functions for each of the socket connections
 ***************************************************************************/
