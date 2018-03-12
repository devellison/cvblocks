"use strict";
//-------------------------------------------------------------------
// Create the global CVBlocksCore object
var gIsFullSize = false;
var gCVBC = new CVBlocksCore("videoSource",
                             "imgSource",
                             "videoOut",
                             "histogram",
                             "selStep",
                             "camera_select",
                             "consoleOverlay",
                             streamCallback);

// Inject Blockly into our div
var toolbox = document.getElementById("toolbox");
var options = {
	toolbox : toolbox,
	collapse : true,
	comments : true,
	disable : true,
	maxBlocks : Infinity,
	trashcan : true,
	horizontalLayout : false,
	toolboxPosition : 'start',
	css : true,
	media : 'blockly/media/',
	rtl : false,
	scrollbars : true,
	sounds : true,
	oneBasedIndex : false,
	grid : {
		spacing : 10,
		length : 1,
		colour : '#888',
		snap : true
	},
	zoom : {
		controls : true,
		wheel : true,
		startScale : 1,
		maxScale : 3,
		minScale : 0.3,
		scaleSpeed : 1.2
	}
};

//var workspacePlayground = Blockly.inject('blocklyDiv',options);

//---------------
  var blocklyArea = document.getElementById('blocklyArea');
  var blocklyDiv = document.getElementById('blocklyDiv');
  var codeOverlay = document.getElementById('codeOverlay');
  var consoleOverlay = document.getElementById('consoleOverlay');
  var workspacePlayground = Blockly.inject(blocklyDiv,options);
  var onresize = function(e) {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    // Position code overlay as well
    codeOverlay.style.left   = blocklyDiv.style.left;
    codeOverlay.style.top    = blocklyDiv.style.top;
    codeOverlay.style.width  = blocklyDiv.style.width;
    codeOverlay.style.height = blocklyDiv.style.height;
    // Position console overlay
    consoleOverlay.style.left   = blocklyDiv.style.left;
    consoleOverlay.style.top    = blocklyDiv.style.top;
    consoleOverlay.style.width  = blocklyDiv.style.width;
    consoleOverlay.style.height = blocklyDiv.style.height;
    Blockly.svgResize(workspacePlayground);
    gCVBC.onResize();
  };
  onresize();
  window.addEventListener("resize", onresize());
//--------------

workspacePlayground.addChangeListener(cvblocks_code_callback);
// Initialze to blank workspace
Blockly.Xml.domToWorkspace(document.getElementById('workspaceBlocks'), workspacePlayground);
document.getElementById('btnImportBlocks').addEventListener("change",onImportBlocks);


/** Track average frame processing time */
var trackFrameTime = function()
{
  if (gCVBC.frameTimeWindow.length >= 1)
  {
    var avgFrameTime = gCVBC.frameTimeWindowAccum / gCVBC.frameTimeWindow.length;
    document.getElementById("frameTime").innerHTML = avgFrameTime.toFixed(2);
  }

  if (gCVBC.procInfos.length > gCVBC.selStep.value)
  {
    var stepCount  = gCVBC.procInfos[gCVBC.selStep.value].count;
    if (stepCount > 0)
    {
      var avgStepTime = gCVBC.procInfos[gCVBC.selStep.value].time / stepCount;
      document.getElementById("stepTime").innerHTML = avgStepTime.toFixed(2);
    }
  }
  else {
    document.getElementById("stepTime").innerHTML = "-";
  }
  setTimeout(trackFrameTime,1000);
}
trackFrameTime();

/** This function is called by CVBlocks when video streaming is stopped
  * or started.  It allows the GUI to do things the core code shouldn't
  * care about.
  */
function streamCallback(streamingStarted)
{

  if (streamingStarted)
  {
    document.getElementById("video_out_div").style = "display: block";
    document.getElementById("sidebar_input_div").style = "display: none";
  }
  else
  {
    document.getElementById("video_out_div").style = "display: none";
    document.getElementById("sidebar_input_div").style = "display: block";
    if (gIsFullSize)
      toggleFullSize();
  }
}

function toggleFullSize()
{
  if (gIsFullSize == false)
  {
    // get actual source sizes
    var width, height;

    if (gCVBC.streaming == "image")
    {
      width = document.getElementById("imgSource").naturalWidth;
      height = document.getElementById("imgSource").naturalHeight;
    }
    else
    {
      width = document.getElementById("videoSource").videoWidth;
      height = document.getElementById("videoSource").videoHeight;
    }

    document.getElementById("blocklyDiv").style = "display: none";
    document.getElementById("blocklyArea").style = "display: none";
    document.getElementById("cvblocks_div").style = "display: none;background-color: #e0e0e0";
    document.getElementById("sidebar_div").style = "width: 100%";
    document.getElementById("video_out_div").width = "width: 100%";
    document.getElementById("videoSource").width = width;
    document.getElementById("videoSource").height = height;
    document.getElementById("imgSource").width = width;
    document.getElementById("imgSource").height = height;
    document.getElementById("videoOut").width = width;
    document.getElementById("videoOut").height = height;
    gIsFullSize = true;
  }
  else
  {
    document.getElementById("videoSource").width = 360;
    document.getElementById("videoSource").height = 180;
    document.getElementById("videoOut").width = 360;
    document.getElementById("videoOut").height = 180;
    document.getElementById("imgSource").width = 360;
    document.getElementById("imgSource").height = 180;
    document.getElementById("sidebar_div").style = "width: 400px%";
    document.getElementById("video_out_div").width = "width: 100%";
    document.getElementById("cvblocks_div").style = "display: block; background-color: #f0f0f0";
    document.getElementById("blocklyArea").style = "display: block";
    document.getElementById("blocklyDiv").style = "display: block;position: absolute";
    gIsFullSize = false;
  }
  onresize();
}

function startMovieUrl(event)
{
  var movieUrl = document.getElementById("movieUrl").value;
  gCVBC.startMovieUrl(movieUrl);
}
/** export the blocks to an xml file */
function onExportBlocks()
{
  var xml = Blockly.Xml.workspaceToDom(workspacePlayground);
  var xml_text = Blockly.Xml.domToText(xml);
  var blob = new Blob([xml_text], {type: "text/plain;charset=utf-8"});
  var filename = getSaveFilename("exportName","myBlocks",".xml");

  saveAs(blob, filename);
}

/** import blocks from an xml file */
function onImportBlocks(event)
{
  var file = document.getElementById('btnImportBlocks').files[0];
  var reader = new FileReader();
  workspacePlayground.clear();
  reader.onload = function(theFile) {
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(reader.result), workspacePlayground);
  };
  reader.readAsText(file);
}

var gViewingCode = false;
var gViewingConsole = false;

function viewCode()
{
  var viewButton = document.getElementById("btnViewCode");
  if (gViewingCode)
  {
    codeOverlay.style.display = "none";
    viewButton.innerHTML = "View generated code.."
    gViewingCode = false;
  }
  else
  {
    var code = Blockly.JavaScript.workspaceToCode(workspacePlayground);
    codeOverlay.innerHTML = "<pre>" + code + "</pre>";
    codeOverlay.style.display = "block";
    viewButton.innerHTML = "Hide generated code.."
    gViewingCode = true;
  }
}

function viewConsole()
{
  var viewButton = document.getElementById("btnViewConsole");
  if (gViewingConsole)
  {
    consoleOverlay.style.display = "none";
    viewButton.innerHTML = "View console.."
    gViewingConsole = false;
  }
  else
  {
    consoleOverlay.style.display = "block";
    viewButton.innerHTML = "Hide console.."
    gViewingConsole = true;
  }
}

/** export generated javascript code - mostly just for debugging right now */
function onExportCode()
{
  var code = Blockly.JavaScript.workspaceToCode(workspacePlayground);
  var blob = new Blob([code], {type: "text/plain;charset=utf-8"});
  var filename = getSaveFilename("exportCodeName", "cvblockCode",".js");

  saveAs(blob, filename);
}

/** retrieve filename from a text input and add extension if needed */
function getSaveFilename(input_id, defaultFilename, extension)
{
  var filename = document.getElementById(input_id).value;
  if (filename.length == 0)
    filename = defaultFilename;

  var parts = filename.split(".");
  // Add file extension if not found.
  if( parts.length == 1)
    filename = filename + extension;

  return filename;
}
