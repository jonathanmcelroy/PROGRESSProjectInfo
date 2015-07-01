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
  var usageRegex = new RegExp("(?!(input\\s+)|(define\\s+variable\\s+))" + variable + "(?!\\s*=)", "gi");
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
