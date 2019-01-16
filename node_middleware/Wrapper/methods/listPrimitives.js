// import variables
const properties = require("../properties");
const proto = properties.proto;

function listPrimitives() {
  console.log("listPrimitives.js");
  return new Promise(function(fulfill, reject) {
    const client = properties.client;
    let request = new proto.ListPrimitivesRequest();
    client.listPrimitives(request, (err, response) => {
      if (err) {
        console.log("Error!listPrimitives");
      } else {
        console.log(response);
      }
    });
  });
}

module.exports = listPrimitives;
