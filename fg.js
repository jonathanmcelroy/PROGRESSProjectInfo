(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require("./util.js");

function fileDragHover(e) {
  e.stopPropagation();
  e.preventDefault();
  e.target.className = (e.type == "dragover" ? "hover" : "");
}

function dropHandler(f) {
  return function(e) {
    fileDragHover(e);

    var files = e.target.files || e.dataTransfer.files;
    f(files);
  };
}

function createWidget(id, f) {
  var filedrag = util.$id(id);
  filedrag.addEventListener("dragover",  fileDragHover,  false);
  filedrag.addEventListener("dragleave", fileDragHover,  false);
  filedrag.addEventListener("drop",      dropHandler(f), false);
}

module.exports.createWidget = createWidget;
},{"./util.js":4}],2:[function(require,module,exports){
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
},{"./dragDropWidget.js":1,"./progressFunctions.js":3,"./util.js":4}],3:[function(require,module,exports){
function getVariables(contents) {
  var varDefRegex = /define\s+variable\s+((?:\w|-)+)/gi;
  
  // TODO: this can be done functionally
  var vars = [];
  var result;
  while((result = varDefRegex.exec(contents)) !== null) {
    vars.push(result[1]);
  }
  return vars;
}

function testForVariableAssignment(variable, contents) {
  var assignmentRegex = new RegExp("(" + variable + "\\s*=)|(output\\s+" + variable + ")", "gi");
  return (assignmentRegex.test(contents));
}

function testForVariableUsage(variable, contents) {
  var usageRegex = new RegExp("^(?!(.*input\\s+)|(\\s*define\\s+variable\\s+)).*" + variable + "(?!\\s*=)", "gi");
  return (usageRegex.test(contents));
}

function getAllUnusedOrUndefinedVariables(contents) {
  var variables = getVariables(contents);
  for(var i=0; i<variables.length; i++) {
    var variable = variables[i];
    if(!testForVariableUsage(variable, contents)) {
      console.log(variable + " not used");
    } else if(!testForVariableAssignment(variable, contents)) {
      console.log(variable + " not defined");
    }
  }
}

function getProcedureNamesAndIndices(contents) {
  var procedureStart = /procedure +([\w-]+) +[.:]/gi
  var procedureEnd   = /end procedure\./gi
  
  var vars = [];
  var result;
  while((result = procedureStart.exec(contents)) !== null) {
    var startIndex = procedureStart.lastIndex;
    procedureEnd.lastIndex = startIndex;
    procedureEnd.exec(contents);
    var endIndex = procedureEnd.lastIndex;
    
    vars.push({
      name:   result[1],
      start:  startIndex,
      end:    endIndex
    });
  }
  return vars;
}

function getProcedureCalls(contents) {
  var regex = /run +([\w-]+)/gi
  
  var vars = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    vars.push({
      name: result[1],
      index: regex.lastIndex
    });
  }
  return vars;
}

function getFileDependancies(contents) {
  var regex = /((?:appsrv|browse|controls|etrails|forms|help|html|images|reports|sdo-cl|system|viewers|windows)[\\\/][\w-]+\.[ipw])/gmi;
  var files = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    files.push(result[1]);
  }
  return files;
}

module.exports.getVariables                     = getVariables;
module.exports.testForVariableAssignment        = testForVariableAssignment;
module.exports.testForVariableUsage             = testForVariableUsage;
module.exports.getAllUnusedOrUndefinedVariables = getAllUnusedOrUndefinedVariables;
module.exports.getProcedureNamesAndIndices      = getProcedureNamesAndIndices;
module.exports.getProcedureCalls                = getProcedureCalls;
module.exports.getFileDependancies              = getFileDependancies;
},{}],4:[function(require,module,exports){
function $id(id) {
  return document.getElementById(id);
}

module.exports.$id = $id;
},{}]},{},[2]);
