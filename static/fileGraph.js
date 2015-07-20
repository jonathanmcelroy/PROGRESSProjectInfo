var dragDropWidget = require("./dragDropWidget.js");
var util           = require("./util.js");
var progress       = require("./progressFunctions.js");

function showStatus(message) {
  util.$id("status").innerHTML = message;
}

function createEdges(contents, procedures, nodeDict) {
  var calledProcedures = getProcedureCalls(contents);
  var edgeDict = {};
  var edges = [];

  for(var i=0; i<calledProcedures.length; i++) {
    var calledProcedure = calledProcedures[i];
    if(nodeDict[calledProcedure.name] === undefined) {
      continue;
    }

    // for each procedure definition
    for(var j=0; j<procedures.length; j++) {
      var procedure = procedures[j];

      // if the called procedure is in the procedure definition
      if(procedure.start < calledProcedure.index && calledProcedure.index < procedure.end) {
        if (edgeDict[procedure.name] === undefined) {
          edgeDict[procedure.name] = {};
        }
        if (edgeDict[procedure.name][calledProcedure.name] === undefined) {
          edgeDict[procedure.name][calledProcedure.name] = true;
          edges.push({
            from:   procedure.name,
            to:     calledProcedure.name,
            arrows: 'to'
          });

          switch(nodeDict[procedure.name].group) {
            case "noInteraction":
            nodeDict[procedure.name].group = "isNotCalled";
            break;
            case "doesNotCall":
            nodeDict[procedure.name].group = undefined;
            break;
          }
          switch(nodeDict[calledProcedure.name].group) {
            case "noInteraction":
            nodeDict[calledProcedure.name].group = "doesNotCall";
            break;
            case "isNotCalled":
            nodeDict[calledProcedure.name].group = undefined;
            break;
          }
          break;
        }
      }
    }
  }
  return edges;
}

function getGraph() {
  document.getElementById("network").innerHTML = "Getting graph"
  var request = new XMLHttpRequest()
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      if (request.status == 200) {
        showGraph(request.responseText)
      }
      else {
        document.getElementById("network").innerHTML = "Could not get graph"
      }
    }
  }
  request.open("GET", "http://localhost:8000/progress/jsonGraph", true)
  request.send()
}

function showGraph(graphText) {
  var container = document.getElementById("network")
  container.innerHTML = "Showing graph"
  var graph = JSON.parse(graphText)
  options = {
    nodes: {
      shape: 'dot',
      size: 10
    },
    physics: false
  }
  var network = new vis.Network(container, graph, options);
  network.clusterByHubsize(3, options)
}

document.getElementById("show-network").onclick = getGraph;
