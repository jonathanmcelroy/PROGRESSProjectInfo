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
