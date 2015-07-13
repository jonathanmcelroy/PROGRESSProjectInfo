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

dragDropWidget.createWidget("filedrag", showGraph);

},{"./dragDropWidget.js":1,"./progressFunctions.js":3,"./util.js":4}],3:[function(require,module,exports){
function inComment(index, contents) {
  var commentStart = /\/\*/g;
  var commentEnd = /\*\//g;
  while(commentStart.exec(contents) !== null) {
    commentEnd.lastIndex = commentStart.lastIndex;
    commentEnd.exec(contents);
    if (commentStart.lastIndex < index && index < commentEnd) {
      return true;
    }
  }
  return false;
}

function inString(index, contents) {
  var stringStart = /"/g;
  var stringEnd = /"/g;
  while(stringStart.exec(contents) !== null) {
    stringEnd.lastIndex = stringStart.lastIndex;
    stringEnd.exec(contents);
    if (stringStart.lastIndex < index && index < stringEnd) {
      return true;
    }
  }
  return false;
}

function getVariables(contents) {
  var regex = /define\s+variable\s+([\w-]+)/gi;
  
  // TODO: this can be done functionally
  var vars = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    vars.push(result[1]);
  }
  return vars;
}


function getGlobalVariables(contents) {
  var regex = /^define\s+variable\s+([\w-]+)/gmi;
  
  // TODO: this can be done functionally
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

function getGlobalTempTables(contents) {
  var regex = /^define\s+temp-table\s+([\w-]+)/gmi;
  
  // TODO: this can be done functionally
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

function getEventDefinitions(contents) {
  var eventStart = /^on +([\w-]+) +of +(menu-item [\w-]+|[\w-]+)/gmi;
  var eventEnd = /end\.\s*\/\* _UIB-CODE-BLOCK-END \*\//gi;

  var events = [];
  var result;
  while((result = eventStart.exec(contents)) !== null) {
    var startIndex = eventStart.lastIndex;
    eventEnd.lastIndex = startIndex;
    eventEnd.exec(contents);
    var endIndex = eventEnd.lastIndex;
    
    events.push({
      eventName: result[2],
      object: result[2],
      name:   result[1] + ": " + result[2],
      start:  startIndex,
      end:    endIndex
    });
  }
  return events;
}

function getProcedureDefinitions(contents) {
  var procedureStart = /procedure +([\w-]+) +[.:]/gi;
  var procedureEnd   = /end procedure\./gi;
  
  var procedures = [];
  var result;
  while((result = procedureStart.exec(contents)) !== null) {
    var startIndex = procedureStart.lastIndex;
    procedureEnd.lastIndex = startIndex;
    procedureEnd.exec(contents);
    var endIndex = procedureEnd.lastIndex;
    
    procedures.push({
      name:   result[1],
      start:  startIndex,
      end:    endIndex
    });
  }
  return procedures;
}

function getFunctionDefinitions(contents) {
  var functionStart = /function +([\w-]+) +returns +[\w-]+\s*\([^)]*\) *:/gi;
  var functionEnd   = /end function\./gi;
  
  var functions = [];
  var result;
  while((result = functionStart.exec(contents)) !== null) {
    var startIndex = functionStart.lastIndex;
    functionEnd.lastIndex = startIndex;
    functionEnd.exec(contents);
    var endIndex = functionEnd.lastIndex;
    
    functions.push({
      name:   result[1],
      start:  startIndex,
      end:    endIndex
    });
  }
  return functions;
}

function getVariableUses(variable, contents) {
  var regex = new RegExp("^(?!.*input\\s+" + variable.name +"|\\s*define\\s+variable\\s+" + variable.name + "|.*-" + variable.name + ").*\\b" + variable.name + "\\b(?!\\s*=|-)", "gmi");
  var indices = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    indices.push(regex.lastIndex);
  }
  return indices; 
}

function getVariableAssignments(variable, contents) {
  var regex = new RegExp("(" + variable.name + "\\s*=)|(output\\s+" + variable.name + ")", "gi");
  var indices = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    indices.push(regex.lastIndex);
  }
  return indices; 
}

function getTempTableUses(tempTable, contents) {
  var regex = new RegExp("^(?!.*input\\s+temp-table\\s+" + tempTable.name +"|\\s*define\\s+temp-table\\s+" + tempTable.name + "|.*-" + tempTable.name + ").*\\b" + tempTable.name + "\\b(?!-)", "gmi");
  var indices = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    indices.push(regex.lastIndex);
  }
  return indices; 
}

function getTempTableAssignments(tempTable, contents) {
  var regex = new RegExp("(" + tempTable.name + "\\s*=)|(output\\s+" + tempTable.name + ")", "gi");
  var indices = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    indices.push(regex.lastIndex);
  }
  return indices; 
}


function getProcedureCalls(contents) {
  var regex = /run +([\w-]+)/gi
  
  var procedures = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    procedures.push({
      name: result[1],
      index: regex.lastIndex
    });
  }
  return procedures;
}

function getFunctionCalls(contents) {
  var regex = /([\w-]+)\s*\((?!.*?\)\s*forward)/gi;

  var functions = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    functions.push({
      name: result[1],
      index: regex.lastIndex
    });
  }
  return functions;
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


module.exports.getVariables                     = getVariables;
module.exports.getGlobalVariables               = getGlobalVariables;
module.exports.getGlobalTempTables               = getGlobalTempTables;
module.exports.getEventDefinitions              = getEventDefinitions; 
module.exports.getProcedureDefinitions          = getProcedureDefinitions;
module.exports.getFunctionDefinitions           = getFunctionDefinitions;

module.exports.getVariableUses                  = getVariableUses;
module.exports.getTempTableUses                  = getTempTableUses;
module.exports.getVariableAssignments           = getVariableAssignments;
module.exports.getProcedureCalls                = getProcedureCalls;
module.exports.getFunctionCalls                 = getFunctionCalls;
module.exports.getFileDependancies              = getFileDependancies;

module.exports.testForVariableUsage             = testForVariableUsage;
},{}],4:[function(require,module,exports){
function $id(id) {
  return document.getElementById(id);
}

module.exports.$id = $id;
},{}]},{},[2]);
