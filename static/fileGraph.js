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

function showGraph(files) {
  var file;
  for(var fileI=0; file = files[fileI]; fileI++) {
    console.log(file);
    var reader = new FileReader();
    reader.onload = function(e) {
      /*
      var contents = e.target.result;
      var fileFiles = progress.getFileDependancies(contents);

      var nodeDict = {};
      var nodes = [];
      for(var i=0; i<procedures.length; i++) {
        var procedure = procedures[i];

        var node = {
          id:     procedure.name,
          label:  procedure.name,
          group:  'noInteraction'
        };

        nodeDict[procedure.name] = node;
        nodes.push(node);
      }

      var edges = createEdges(contents, procedures, nodeDict);

      var container = document.getElementById("network");
      var data = {
        nodes: nodes,
        edges: edges
      };
      var options = {
        nodes: {
          shape: 'dot',
          size: 10
        },
        groups: {
          isNotCalled: {
            color: {
              background: 'lime'
            }
          },
          doesNotCall: {
            color: {
              background: 'yellow'
            }
          },
          noInteraction: {
            color: {
              background: 'red'
            }
          }
        },
        layout: {
          hierarchical: {
            // direction: "UD"
            sortMethod: "directed"
          }
        }
      }

      var node;
      for(var i=0; node = nodes[i]; i++) {
        while(node !== undefined && node.group === 'noInteraction') {
          nodes.splice(i, 1);
          node = nodes[i];
        }
      }

      var network = new vis.Network(container, data, options);
      showStatus("Showing Graph");
      */
    }
    reader.readAsText(files[0]);
  }
}

dragDropWidget.createWidget("filedrag", showGraph);