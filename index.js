function getContents() {
  return document.getElementById("text").value;
}

function getVariables() {
  var contents = getContents();
  var varDefRegex = /define\s+variable\s+((?:\w|-)+)/gi;
  
  // TODO: this can be done functionally
  var vars = [];
  var result;
  while((result = varDefRegex.exec(contents)) !== null) {
    vars.push(result[1]);
  }
  return vars;
}

function testForAssignment(variable) {
  var contents = getContents();
  var assignmentRegex = new RegExp("(" + variable + "\\s*=)|(output\\s+" + variable + ")", "gi");
  return (assignmentRegex.test(contents));
}

function testForUsage(variable) {
  var contents = getContents();
  var usageRegex = new RegExp("^(?!(.*input\\s+)|(\\s*define\\s+variable\\s+)).*" + variable + "(?!\\s*=)", "gi");
  return (usageRegex.test(contents));
}

function getAllUnusedOrUndefinedVariables() {
  var variables = getVariables();
  for(var i=0; i<variables.length; i++) {
    var variable = variables[i];
    if(!testForUsage(variable)) {
      console.log(variable + " not used");
    } else if(!testForAssignment(variable)) {
      console.log(variable + " not defined");
    }
  }
}

function getProcedureNamesAndIndices() {
  var contents = getContents();
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

function getProcedureCalls() {
  var contents = getContents();
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

function getProcedureGraph() {
  var contents = getContents();
  var procedures = getProcedureNamesAndIndices();

  var nodeDict = {}

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
  
  // for each call to a procedure
  var calledProcedures = getProcedureCalls();

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

  var container = document.getElementById("network");
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {
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
    }
  }
  var network = new vis.Network(container, data, options);
}
