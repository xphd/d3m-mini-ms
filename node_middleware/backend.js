// This backend is used to work with vue frontend
// it reads files in the folder of "responses" and send wanted infors to frontend

"use strict";
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const fs = require("fs");

const grpcClientWrapper = require("./Wrapper/Wrapper.js");
const helloLoop = grpcClientWrapper.helloLoop;
const searchSolutions = grpcClientWrapper.searchSolutions;
const scoreSolutions = grpcClientWrapper.scoreSolutions;
const describeSolutions = grpcClientWrapper.describeSolutions;
const getAllSolutions = grpcClientWrapper.getAllSolutions;

const app = express();
const server = http.createServer(app);
const serverSocket = socketIO(server, { origins: "*:*" });

const TA2PORT = "localhost:50051";
const PORT = 9090;
server.listen(PORT);
console.log("Server listening " + PORT);

serverSocket.on("connection", socket => {
  socket.on("requestStart", () => {
    grpcClientWrapper.connect(TA2PORT);
    helloLoop()
      .then(searchSolutions)
      .then(scoreSolutions)
      .then(describeSolutions)
      .then(() => {
        console.log("Search-Score-Describe Done!!!");
        socket.emit("responseStart");
      });
  });

  // socket.on("helloSearch", () => {
  //   grpcClientWrapper.connect(TA2PORT);
  //   grpcClientWrapper.helloLoop().then(grpcClientWrapper.searchSolutions);
  // });

  // socket.on("getAllSolutions", () => {
  //   console.log("getAllSolutions");
  //   let solutions = grpcClientWrapper.getAllSolutions();
  //   // let solution = console.log(Array.from(solutions.keys()));
  //   socket.emit("getAllSolutionsResponse", Array.from(solutions.keys()));
  // });

  socket.on(
    "scoreSelectedSolutions",
    (solutionIDs_selected, metrics_selected) => {
      console.log("scoreSelectedSolutions");
      // console.log(solutionIDs_selected, metrics_selected);

      // let metrics = ["accuracy"];
      grpcClientWrapper.getScores(solutionIDs_selected, metrics_selected);
    }
  );

  socket.on("describeSolutions", solutionIDs_selected => {
    console.log("describeSolutions");
    grpcClientWrapper.getDescription(solutionIDs_selected);
  });

  // model selection
  socket.on("requestSolutions", () => {
    console.log("Server: requestSolutions received");

    // get score(s)
    // let scoreSolutionPath = "./responses/scoreSolutionResponses/";
    // let getScoreSolutionPath = "./responses/getScoreSolutionResultsResponses/";
    // solutions.forEach(solution => {
    //   let id = solution.id;
    //   let filename1 = scoreSolutionPath + id + ".json";
    //   let tempObj = fs.readFileSync(filename1, "utf-8");

    //   let request_id = JSON.parse(tempObj).request_id;
    //   let filename2 = getScoreSolutionPath + request_id + ".json";
    //   let tempObj2 = fs.readFileSync(filename2, "utf-8");

    //   // hardcode at this moment
    //   let score = JSON.parse(tempObj2).scores[0].value.raw.double;

    //   solution.score = score;
    // });

    let solutions = getAllSolutions();

    // get pipelineSize
    let describeSolutionPath = "./responses/describeSolutionResponses/";
    solutions.forEach(solution => {
      let id = solution.id;
      let filename = describeSolutionPath + id + ".json";
      let tempObj = fs.readFileSync(filename, "utf-8");
      let size = JSON.parse(tempObj).pipeline.steps.length;
      solution.pipelineSize = size;
    });

    socket.emit("responseSolutions", solutions);
  });

  socket.on("requestPipeline", solutionId => {
    console.log("Server: requestPipeline, id:", solutionId);
    let pipelinePath = "./responses/describeSolutionResponses/";
    let filename = pipelinePath + solutionId + ".json";
    let pipelineStr = fs.readFileSync(filename, "utf8");
    let pipelineStrJSON = JSON.parse(pipelineStr);
    let pipeline = pipelineStrJSON["pipeline"];
    socket.emit("responsePipeline", pipeline);
  });
});
