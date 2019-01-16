const grpc = require("grpc");
const appRoot = require("app-root-path");

const PROTO_PATH = appRoot + "/lib/js" + "/protos/v2018.7.7/core.proto";

const properties = {
  // dynamic
  client: null,
  sessionVar: {
    searchID: "",

    ta2Ident: null,
    connected: false,
    solutions: new Map(),
    //produceSolutionRequests: [],
    //solutionResults: [],
    // NIST eval plan: only ranks 1-20 are considered (lower is better)
    rankVar: 20
  },

  // static
  proto: grpc.load(PROTO_PATH),
  userAgentTA3: "TA3-TGW",
  grpcVersion: "2018.7.7",
  allowed_val_types: [1, 2, 3]
};

module.exports = properties;
