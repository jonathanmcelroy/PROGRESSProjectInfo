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
  var regex = /^define\s+variable\s+([\w#$%&_-]+)(?:\s+as\s+([\w#$%&_-]+))?/gmi;

  // TODO: this can be done functionally
  var vars = [];
  var result;
  while((result = regex.exec(contents)) !== null) {
    vars.push({
      name: result[1],
      index: regex.lastIndex,
      type: result[2]
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
