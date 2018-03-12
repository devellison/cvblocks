// Core object of CVBlocks for handling image input and Processing
"use strict";

// Callback stubs for this pointers...
function cvblocks_video_callback()  { gCVBC.videoCallback(); }
function cvblocks_camera_callback(deviceInfos) { gCVBC.cameraCallback(deviceInfos);}
function cvblocks_stream_callback(stream) {gCVBC.streamCallback(stream);}
function cvblocks_code_callback() {gCVBC.onCodeChanged();}

/**
* Core object for CVBlocks.
* Creates the core object for CVBlocks. Should
* be instantiated before other stuff is used.
* e.g.
* var gCVBC = new CVBlocksCore("video","canvas", "selCamera")
 *
 * @constructor
 * @param {string} video_id - id of video tag for input
 * @param {string} image_id - id of img tag for input
 * @param {string} canvas_id - id of canvas tag for output
 * @param {string} hist_id - id of histogram tag for output
 * @param {string} step_sel_id - id of select tag for step selection
 * @param {string} camera_sel_id - id of select tag for camera selection
   @param {string} console_id - id of div for console overlay
 * @param {callback} streamCallback - called when streaming state changes
 */
function CVBlocksCore(video_id,
                      image_id,
                      canvas_id,
                      hist_id,
                      step_sel_id,
                      camera_sel_id,
                      console_id,
                      streamCallback)
{
  //-------------------------------------------------------------------------
  // Constants

  // kPROCSTEP - used to indicate what kind of frame/image a process step
  //             needs as input and produces as output
  this.kPROCSTEP_ANY      = -1;
  this.kPROCSTEP_RGB      = 0;
  this.kPROCSTEP_GRAY     = 1;
  this.kPROCSTEP_RGB2GRAY = 2;

  // exposed variables
  this.debug      = false;
  this.canvas_id  = canvas_id;
  this.image_id   = image_id;
  this.hist_id    = hist_id;
  this.imageIn    = document.getElementById(image_id);
  this.canvas     = document.getElementById(canvas_id);
  this.histogram  = document.getElementById(hist_id);
  this.videoIn    = document.getElementById(video_id);
  this.selStep    = document.getElementById(step_sel_id);
  this.console    = document.getElementById(console_id);

  this.capture    = new cv.VideoCapture(this.videoIn);
  this.context    = this.canvas.getContext("2d");

  this.width      = this.videoIn.width;
  this.height     = this.videoIn.height;

  // actual input frame with alpha
  this.inFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC4);

  // source frame w/o alpha channel
  this.srcFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);

  // frame we're displaying
  this.dispFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC3);
  this.tmpFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
  this.grayFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC1);
  this.grayFrame2 = new cv.Mat(this.height, this.width, cv.CV_8UC1);
  this.hsvFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
  this.rgbFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);

  // Previous frame if we need grayscale for this step
  this.prevGray   = new cv.Mat(this.height, this.width, cv.CV_8UC1);
  this.prevRgb    = new cv.Mat(this.height, this.width, cv.CV_8UC3);

  this.streamcb   = streamCallback; // Called when streaming starts/stops

  // states
  this.streaming  = false;
  this.paused     = false;

  // Processing loop Variables
  this.procStep      = 0;           // Current step - index into procInfos
  this.procInfos     = new Array(); // Array of ProcessInfo
  this.prevFrame     = undefined;   // Previous cv.Mat frame
  this.curFrame      = undefined;   // Current cv.Mat frame
  this.curInfo       = undefined;   // Current ProcessInfo
  this.insideOnFrame = false;       // Inside onFrame function

  this.blocksOnFrame = function(){}; // Blockly onFrame function.

  // frame timers in milliseconds
  this.frameTimeBest  = 0;
  this.frameTimeWorst = 0;
  this.frameTimeTotal = 0;
  this.frameTimeCount = 0;

  this.frameTimeWindowAccum = 0;
  this.frameTimeWindowSize = 100; // Used for a running avg frame rate
  this.frameTimeWindow = [];

  // internal variables
  const kFPS     = 30;
  const kFrameTime = 1000.0/kFPS;
  let camselect  = document.getElementById(camera_sel_id);

  this.log = function(msg)
  {
    var newline = document.createElement("div");
    newline.innerHTML = msg;
    this.console.appendChild(newline);
    // TODO: right now this scrolls automatically, and wins
    // if the user is trying to scroll back in the history.
    // need to add detection of the user scrolling to turn
    // this off, then back on if they scroll to bottom.
    this.console.scrollTop = this.console.scrollHeight;
    // also log it to javascript console
    console.log(msg);
  }
  //-------------------------------------------------------------------------
  // These are the functions required by the Blockly generated code for
  // processing.

  /**
   * Process step information and associated image buffer
   * @constructor
   * @param {number} stepNumber - index of the step
   * @param {string} stepName - friendly name of the step for selection
   * @param {number} width - image width for the processing buffer
   * @param {number} height - image height for the processing buffer
   * @param {kPROCSTEP} procStepType - kind of output the procstep has
   */
  function ProcessInfo(stepNumber, stepName, width, height, procStepType)
  {
    this.name       = stepName;

    if (procStepType == gCVBC.kPROCSTEP_GRAY)
      this.frame = new cv.Mat(height, width, cv.CV_8UC1);
    else
      this.frame = new cv.Mat(height, width, cv.CV_8UC3);

    this.stepNumber = stepNumber;
    this.count      = 0;
    this.time       = 0;
    this.startTime  = 0;

    this.clear = function()
    {
      this.frame.delete();
    }
  }

  /** Called each frame to process the images.
    * Calls Blockly-generated code.
    * @param {cv.Mat} sourceFrame - new video frame to process.
    */
  this.onProcess = function(sourceFrame)
  {
    try
    {
        this.procStep = 0;
        this.beginProcessStep("Original Frame",this.kPROCSTEP_RGB);
          sourceFrame.copyTo(this.curFrame);
        this.endProcessStep();

        // call everything in the OnFrame block.
        this.insideOnFrame = true;
        this.blocksOnFrame();
        this.insideOnFrame = false;
      }
      catch (e)
      {
        this.log("Error in onProcess: " + e);
        this.streaming = false;
        setTimeout(cvblocks_video_callback, 0);
        if (this.debug)
          throw(e);

      }
  }

  /** Resets processing information - must be done when changing code
      or buffer sizes. They are rebuilt by the first processing loop.
   */
  this.resetProcInfos = function(resetCode)
  {
    // reset onFrame() blockly function.
    if (resetCode)
      this.blocksOnFrame = function(){};

    // Clear step selection
    this.selStep.value = 0;
    while (this.selStep.hasChildNodes())
      this.selStep.removeChild(this.selStep.firstChild);

    // Clear process structures and buffers
    while (this.procInfos.length)
    {
      this.procInfos.pop().clear();
    }

    // reset process step to 0
    this.procStep = 0;
  }

  /** resets all buffers for size changes */
  this.resetBuffers = function()
  {
    this.log("Resetting buffers for size change")
    this.width = this.videoIn.width;
    this.height = this.videoIn.height;

    this.inFrame.delete();
    this.srcFrame.delete();
    this.dispFrame.delete();
    this.tmpFrame.delete();
    this.grayFrame.delete();
    this.grayFrame2.delete();
    this.hsvFrame.delete();
    this.rgbFrame.delete();
    this.prevGray.delete();
    this.prevRgb.delete();

    this.inFrame    = new cv.Mat(this.height, this.width, cv.CV_8UC4);
    this.srcFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.dispFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.tmpFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.grayFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC1);
    this.grayFrame2 = new cv.Mat(this.height, this.width, cv.CV_8UC1);
    this.hsvFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.rgbFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.prevGray   = new cv.Mat(this.height, this.width, cv.CV_8UC1);
    this.prevRgb    = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.resetProcInfos(false);
    // If I don't delete and recreate this, I'm getting
    // a quarter of the video processed.
    delete this.capture;
    this.capture    = new cv.VideoCapture(this.videoIn);
  }

  /** Called at the beginning of each process step.
    *  Allocates the buffers and sets up the select tag for viewing
    *  each step on first call.
    *  @param {string} stepName - friendly step name for selection
    *  @param {kPROCSTEP} - describes the kind of image the step uses for input and output
    */
  this.beginProcessStep = function(stepName, procStepType)
  {
    // First time on this step - create a mat for it
    if (this.procInfos.length <= this.procStep)
    {
      var outBufferType = this.kPROCSTEP_RGB;
      switch (procStepType)
      {
        case this.kPROCSTEP_RGB:
          outBufferType = this.kPROCSTEP_RGB;
          break;
        case this.kPROCSTEP_RGB2GRAY:
        case this.kPROCSTEP_GRAY:
          outBufferType = this.kPROCSTEP_GRAY;
          break;
        case this.kPROCSTEP_ANY:
          if (this.prevFrame.step[1] == 1)
            outBufferType = this.kPROCSTEP_GRAY;
          else
            outBufferType = this.kPROCSTEP_RGB;
          break;
      }

      this.procInfos.push(new ProcessInfo(this.procStep, stepName, gCVBC.width, gCVBC.height, outBufferType));
      // Create a new option
      var option = document.createElement('option');
      option.value = this.procStep;
      option.text = this.procStep.toString() + ".) " + stepName;
      this.selStep.appendChild(option);
      this.selStep.selectedIndex = this.procStep;
    }


    // Set current
    this.curInfo = this.procInfos[this.procStep];
    this.curFrame = this.curInfo.frame;
    this.curInfo.startTime = Date.now();


    if (procStepType == this.kPROCSTEP_RGB2GRAY)
    {
        if (this.prevFrame.step[1] == 1)
        {
          cv.cvtColor(this.prevFrame, this.prevRgb, cv.COLOR_GRAY2RGB,0);
          this.prevFrame = this.prevRgb;
        }
    }
    else if ((this.procStep != 0) && (this.curFrame.step[0] != this.prevFrame.step[0]))
    {
      // If the previous frame's buffer is gray and we want color, or
      // vice-versa, then we need to convert.  This avoids having to
      // convert when processing steps match.
      if (this.prevFrame.step[1] == 1)
      {
        cv.cvtColor(this.prevFrame, this.prevRgb, cv.COLOR_GRAY2RGB,0);
        this.prevFrame = this.prevRgb;
      }
      else
      {
        cv.cvtColor(this.prevFrame, this.prevGray, cv.COLOR_RGB2GRAY,0);
        this.prevFrame = this.prevGray;
      }
    }
  }

  /** Called at the end of each process step to save/display the current
    * frame and update for the next frame.
    */
  this.endProcessStep = function()
  {
    // Display if selected
    if (this.selStep.value == this.procStep)
    {
      if (this.curFrame.step[1] == 1)
        cv.cvtColor(this.curFrame, this.dispFrame, cv.COLOR_GRAY2RGB,0);
      else
        this.curFrame.copyTo(this.dispFrame);
    }

    this.prevFrame = this.curFrame;
    this.procStep++;

    this.curInfo.time += Date.now() - this.curInfo.startTime;
    this.curInfo.count++;
    this.curInfo  = "";
    this.curFrame = "";
  }

  //-------------------------------------------------------------------------
  // other exposed functions

  /** resets frame counters for video and processing timing */
  this.resetFrameCounters = function () {
    this.frameTimeWorst = 0;
    this.frameTimeTotal = 0;
    this.frameTimeCount = 0;
    this.frameTimeBest = 0;
    this.frameTimeWindow.length = 0;
    this.frameTimeWindowAccum = 0;
  };

  this.onCodeChanged = function()
  {
    this.resetProcInfos(true);
    var code = Blockly.JavaScript.workspaceToCode(workspacePlayground)
    eval(code);

    if (this.streaming == "image")
      this.videoCallback();
  }
  //-----------------
  // Streaming video functions

  /** Stops streaming and processing from camera / movie */
  this.stop = function() {
    if (this.streaming)
    {
      this.videoIn.pause();
      if (this.streaming == "image")
        setTimeout(cvblocks_video_callback, 0);
      this.streaming = false;
      this.log("Streaming video stopping...");
    }
  };

  /** Callback to grab frame and process it  */
  this.videoCallback = function()
  {
    if (!this.streaming)
    {
        // clean and stop.
        this.onStreamingStopped();
        return;
    }

    var entryTime   = Date.now();
    var frameDelay  = 0;

    this.checkUpdateFrameSize();
    // start processing.
    // if (this.width != this.videoIn.width)
    //    resetBuffers();


    if ((this.streaming == "movie") || (this.streaming == "camera"))
    {
      this.capture.read(this.inFrame);
    }
    else if ((this.streaming == "image"))
    {
      try
      {
          let src = cv.imread(this.image_id);
          src.copyTo(this.inFrame);
          src.delete();
      }
      catch(e)
      {
          this.log("Error loading static image: " + e);
          this.onStreamingStopped();
          if (this.debug)
            throw(e);
          return;
      }
    }

    cv.cvtColor(this.inFrame, this.srcFrame, cv.COLOR_RGBA2RGB,0);
    this.onProcess(this.srcFrame);
    cv.imshow(this.canvas_id,this.dispFrame)
    // -----------------------------------------------------------
    // Schedule next frame. If we're slower than set rate, track
    // worst time and notify when it gets worse.
    var callbackTime = Date.now() - entryTime;
    if (callbackTime > this.frameTimeWorst)
      this.frameTimeWorst = callbackTime;

    if ((this.frameTimeBest == 0) || (this.frameTimeBest > callbackTime))
      this.frameTimeBest = callbackTime;

    if (this.frameTimeWindow.length == this.frameTimeWindowSize)
      this.frameTimeWindowAccum -= this.frameTimeWindow[this.frameTimeCount % this.frameTimeWindowSize];

    this.frameTimeWindow[this.frameTimeCount % this.frameTimeWindowSize] = callbackTime;
    this.frameTimeWindowAccum += callbackTime;

    this.frameTimeTotal += callbackTime;
    this.frameTimeCount++;
    if (this.streaming != "image")
      setTimeout(cvblocks_video_callback, kFrameTime);
  };

  this.onResize = function()
  {
    // Most things are taken care of in the frame handler,
    // but if it's not running, like for a still image,
    // we need an external call.
    if (this.streaming == "image")
    {
      setTimeout(cvblocks_video_callback, 0);
    }
  }

  this.checkUpdateFrameSize = function()
  {
    var w = 0;
    var h = 0;

    // Find our best size
    if (this.streaming == "image")
    {
        w = this.imageIn.naturalWidth;
        h = this.imageIn.naturalHeight;
    }
    else
    {
        w = this.videoIn.videoWidth;
        h = this.videoIn.videoHeight;
    }

    // don't resize on empty frames.
    if ((w == 0) || (h == 0))
      return;

    // match to width
    var r = this.videoIn.width / w;

    var x = Math.round(w * r);
    var y = Math.round(h * r);
    if ((x != this.width) || (y != this.height))
    {
      this.log("updating size to (" + x + ", " + y + " )");
      this.imageIn.width = x;
      this.imageIn.height = y;
      this.videoIn.width = x;
      this.videoIn.height = y;

      this.canvas.w = x;
      this.canvas.h = y;
      this.width = x;
      this.height = y;

      this.resetBuffers();
    }
  }

  /** Called when streaming has stopped, from the video callback */
  this.onStreamingStopped = function()
  {
    this.log("Streaming video stopped.");
    this.videoIn.srcObject = null;
    this.videoIn.source    = null;

    this.context.fillStyle="#FFFFFF";
    this.context.fillRect(0,0,this.canvas.width,this.canvas.height);

    this.streaming       = false;

    this.log("Best frame time: " + this.frameTimeBest  + "ms")
    this.log("Worst frame time: " + this.frameTimeWorst + "ms")
    this.log("Avg frame time: " +
        this.frameTimeTotal / this.frameTimeCount + "ms")
    this.log("Frames: " + this.frameTimeCount);

    if (this.streamcb != undefined)
      this.streamcb(false);
  }

  /** Callback to receive camera device info during enumeration
    * @param {array} deviceInfos - information about all media devices
    *
    * These will have empty labels if running from file://,
    * may have empty labels from http:// in some cases,
    * but should be fine via https://.
    */
  this.cameraCallback = function(deviceInfos)
  {
    for (let i = 0; i !== deviceInfos.length; ++i)
    {
      let deviceInfo = deviceInfos[i];
      if (deviceInfo.kind === 'videoinput')
      {
        let option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        option.text = deviceInfo.label || 'camera ' + (camselect.length + 1);
        camselect.appendChild(option);
      }
    }
  };

  /** Start streaming from the specified URL
   * @param {file} movieUrl - URL to a movie file (.mp4)
   *
   * File type must be supported by HTML5 to work.
   */
  this.startMovieUrl = function(movieUrl)
  {
    this.stop();
    this.resetFrameCounters();
    this.videoIn.src = movieUrl;
    this.streaming = "movie";
    this.videoIn.play();
    this.log("Video streaming started from movie URL.")
    setTimeout(cvblocks_video_callback, 0);

    if (this.streamcb != undefined)
      this.streamcb(true);
  };

  /** Start streaming from the specified local file
   * @param {file} file - file object from input file with path of local movie file (.mp4)
   *
   * File type must be supported by HTML5 to work.
   */
  this.startMovieStream = function(file)
  {
    this.stop();
    this.resetFrameCounters();

    var fileURL = URL.createObjectURL(file);
    let canPlay = gCVBC.videoIn.canPlayType(file.type);
    if (canPlay == '')
    {
      window.alert("Invalid movie type - please use a video/mp4 file (" + fileURL +")");
      return;
    }

    this.videoIn.src = fileURL;
    this.streaming = "movie";
    this.videoIn.play();
    this.log("Video streaming started from movie file.")
    setTimeout(cvblocks_video_callback, 0);

    if (this.streamcb != undefined)
      this.streamcb(true);
  };

  /** Start using a still image */
  this.startImage = function(file)
  {
    this.stop();
    this.resetFrameCounters();

    var reader  = new FileReader();
    reader.addEventListener("load", function ()
    {
      gCVBC.imageIn.src = reader.result;
      gCVBC.streaming = "image";
      setTimeout(cvblocks_video_callback, 0);
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }

    if (this.streamcb != undefined)
      this.streamcb(true);
  };


  /** Start streaming from a camera */
  this.startCameraStream = function()
  {
    this.stop();
    this.log("Starting video stream from camera.")
    this.resetFrameCounters();

    var constraints = { deviceId: { exact: camselect.value } };

    navigator.mediaDevices.getUserMedia({ video: constraints })
      .then(cvblocks_stream_callback).catch(function(err){
                this.log("Unable to acquire camera: " + err);
                if (gCVBC.streamcb != undefined)
                  gCVBC.streamcb(false);
                  window.alert("Unable to acquire camera:" + err)
                return;
              });

    if (this.streamcb != undefined)
      this.streamcb(true);
  };

  /** Callback received when stream ready from the camera
   * @param {stream} stream - stream from camera
   */
  this.streamCallback = function(stream)
  {
    try
    {
      this.videoIn.srcObject = stream;
      this.videoIn.play();
      this.streaming = "camera";
      this.log("Video streaming started from camera.")
      setTimeout(cvblocks_video_callback, 0);
    }
    catch (e)
    {
      this.log("Error starting camera: " + e);
      this.streaming = false;
      if (this.streamcb != undefined)
        this.streamcb(false);
        if (this.debug)
          throw(e);
    }
  };


  //-----------------
  // Video controls

  /** Plays or pauses the video stream */
  this.playPauseVideo = function()
  {
    if (!this.streaming)
      return;

    if (this.paused) {
      this.videoIn.play();
      this.paused = false;
    }
    else {
      this.videoIn.pause();
      this.paused = true;
    }
  };

  /** pauses video stream and steps forward 1/30th second
   *  NOTE: does not work with camera streams, just pauses.
   */
  this.stepForward = function()
  {
    if (!this.streaming)
      return;
    if (!this.paused)
      this.playPauseVideo();
    this.videoIn.currentTime += 1/30;
  };

  /** pauses video stream and steps back 1/30th second
   *  NOTE: does not work with camera streams, just pauses.
   */
  this.stepBack = function(event)
  {
    if (!this.streaming)
      return;
    if (!this.paused)
      this.playPauseVideo();
    if (this.videoIn.currentTime > (1/30))
      this.videoIn.currentTime -= 1/30;
  };


  //-------------------------------------------------------------------------
  // internal functions

  /** Enumerates cameras into the camera selection tag */
  function enumCameras() {
    navigator.mediaDevices.enumerateDevices().then(cvblocks_camera_callback);
  }
  //-------------------------------------------------------------------------
  // initialization

  // Force popup for user to get permissions - THEN we can enumerate and get names
   navigator.mediaDevices.getUserMedia({ video: true, audio: false})
        .then(setTimeout(enumCameras,1));
};
