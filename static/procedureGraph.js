var dragDropWidget = require("./dragDropWidget.js");
var util           = require("./util.js");
var progress       = require("./progressFunctions.js");

function showStatus(message) {
  util.$id("status").innerHTML = message;
}

function createEdges(contents, blocks, nodeDict) {
  var references = progress.getProcedureCalls(contents).concat(
                   progress.getFunctionCalls(contents));
  var edgeDict = {};
  var edges = [];

  // console.log(nodeDict);
  for(var i=0; i<references.length; i++) {
    var reference = references[i];
    if(nodeDict[reference.name] === undefined) {
      continue;
    }

    // for each block definition
    for(var j=0; j<blocks.length; j++) {
      var block = blocks[j];

      // if the called procedure is in the block definition
      if(block.start < reference.index && reference.index < block.end) {
        if (edgeDict[block.name] === undefined) {
          edgeDict[block.name] = {};
        }
        if (edgeDict[block.name][reference.name] === undefined) {
          edgeDict[block.name][reference.name] = true;
          // console.log("edge from " + block.name + " to " + reference.name);
          edges.push({
            from:   block.name,
            to:     reference.name,
            arrows: 'to'
          });
          if(block.object === undefined) {
            switch(nodeDict[block.name].group) {
              case "noInteraction":
              nodeDict[block.name].group = "isNotCalled";
              break;
              case "doesNotCall":
              nodeDict[block.name].group = undefined;
              break;
            }
          }
          switch(nodeDict[reference.name].group) {
            case "noInteraction":
            nodeDict[reference.name].group = "doesNotCall";
            break;
            case "isNotCalled":
            nodeDict[reference.name].group = undefined;
            break;
          }
          break;
        }
      }
    }
  }

  var variables = progress.getGlobalVariables(contents).concat(
                  progress.getGlobalTempTables(contents));
  for(var i=0; i<variables.length; i++) {
    var variable = variables[i];
    var varUses = progress.getVariableUses(variable, contents).concat(
                  progress.getVariableAssignments(variable, contents));

    // for each block definition
    for(var j=0; j<blocks.length; j++) {
      var block = blocks[j];

      // for each variable use
      for(var k=0; k<varUses.length; k++) {
        var varUse = varUses[k];

        // if the called procedure is in the block definition
        if(block.start < varUse && varUse < block.end) {
          if (edgeDict[block.name] === undefined) {
            edgeDict[block.name] = {};
          }
          if (edgeDict[block.name][variable.name] === undefined) {
            edgeDict[block.name][variable.name] = true;
            console.log("edge from " + block.name + " to " + variable.name);
            edges.push({
              from:   block.name,
              to:     variable.name,
              arrows: 'to',
              color: {
                opacity: 0.1
              }
            });
            if(block.object === undefined) {
              switch(nodeDict[block.name].group) {
                case "noInteraction":
                nodeDict[block.name].group = "isNotCalled";
                break;
                case "doesNotCall":
                nodeDict[block.name].group = undefined;
                break;
              }
            }
            break;
          }
        }
      }
    }
  }

  return edges;
}

function showGraph(files) {
  if (files.length < 1) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    var procedures = progress.getProcedureDefinitions(contents);
    var events = progress.getEventDefinitions(contents);
    var functions = progress.getFunctionDefinitions(contents);
    var variables = progress.getGlobalVariables(contents);
    var tempTables = progress.getGlobalTempTables(contents);

    var nodeDict = {};
    var nodesArray = [];
    for(var i=0; i<procedures.length; i++) {
      var procedure = procedures[i];
      var node = {
        id:     procedure.name,
        label:  procedure.name,
        group:  'noInteraction'
      };
      nodeDict[procedure.name] = node;
      nodesArray.push(node);
    }
    for(var i=0; i<events.length; i++) {
      var eventDef = events[i];
      var node = {
        id:     eventDef.name,
        label:  eventDef.name,
        group:  'event'
      }
      nodeDict[eventDef.name] = node;
      nodesArray.push(node);
    }
    for(var i=0; i<functions.length; i++) {
      var functionDef = functions[i];
      var node = {
        id:     functionDef.name,
        label:  functionDef.name,
        group:  'function'
      }
      nodeDict[functionDef.name] = node;
      nodesArray.push(node);
    }
    for(var i=0; i<variables.length; i++) {
      var variable = variables[i];
      var node = {
        id:     variable.name,
        label:  variable.name,
        group:  'variable'

      }
      nodeDict[variable.name] = node;
      nodesArray.push(node);
    }
    for(var i=0; i<tempTables.length; i++) {
      var tempTable = tempTables[i];
      var node = {
        id:     tempTable.name,
        label:  tempTable.name,
        group:  'tempTable'

      }
      nodeDict[tempTable.name] = node;
      nodesArray.push(node);
    }
    var edgesArray = createEdges(contents, procedures.concat(events).concat(functions), nodeDict);

    var nodes = new vis.DataSet(nodesArray);
    var edges = new vis.DataSet(edgesArray);

    /*
    for(var i=0; node = nodesArray[i]; i++) {
      if(node.group === 'noInteraction') {
        nodes.remove({id: node.id});
      }
    }
    */

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
        },
        event: {
          color: {
            background: 'orange'
          }
        },
        function: {
          color: {
            background: 'grey'
          }
        },
        variable: {
          color: {
            background: 'purple'
          }
        },
        tempTable: {
          color: {
            background: 'pink'
          }
        }
      }
    }

    var network = new vis.Network(container, data, options);

    network.on("doubleClick", function (params) {
      var toRemove = params.nodes;
      var node;
      for(var i=0; node = toRemove[i]; i++) {
        nodes.remove(node);
      }
    });

    showStatus("Showing Graph");
  }
  reader.readAsText(files[0]);
}

dragDropWidget.createWidget("filedrag", showGraph)
