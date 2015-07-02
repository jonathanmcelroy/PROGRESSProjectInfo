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
  var procedureStart = /procedure +([^ ]+) +[.:]/gi
  var procedureEnd   = /end procedure\./gi
  
  var vars = [];
  var result;
  while((result = procedureStart.exec(contents)) !== null) {
    var startIndex = procedureStart.lastIndex;
    procedureEnd.lastIndex = startIndex;
    procedureEnd.exec(contents);
    var endIndex = procedureEnd.lastIndex;
    
    vars.push([result[1], startIndex, endIndex]);
  }
  return vars;
}

function getProcedureCalls() {
  var contents = getContents();
  var regex = /run +([^ ]+) +[.:]/gi
  
  var vars = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    vars.push([result[1], regex.lastIndex]);
  }
  return vars;
}

function getProcedureGraph() {
  var contents = getContents();
  var procedures = getProcedureNamesAndIndiced();
  var dict = {};
  for(var i=0; i<procedures.length; i++) {
    var procedure = procedures[i];
    dict[procedure[0]] = [];
  }
  
  var calledProcedures = getProcedureCalls();
  for(var i=0; i<calledProcedures.length; i++) {
    var calledProcedure = calledProcedures[i];
    var calledName = calledProcedure[0];
    var index = calledProcedure[1];
    
    for(var j=0; j<procedures.length; j++) {
      var procedure = procedures[j];
      if(procedure[1] < index && index < procedure[2]) {
        dict[procedure[0]].push(calledName);
      }
    }
  }
  return dict;
}
