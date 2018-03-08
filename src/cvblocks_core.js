// Core object of CVBlocks for handling image input and Processing
"use strict";

// Callback stubs for this pointers...
function cvblocks_video_callback()  { gCVBC.videoCallback(); }
function cvblocks_camera_callback(deviceInfos) { gCVBC.cameraCallback(deviceInfos);}
function cvblocks_stream_callback(stream) {gCVBC.streamCallback(stream);}

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
 * @param {callback} streamCallback - called when streaming state changes
 */
function CVBlocksCore(video_id,
                      image_id,
                      canvas_id,
                      hist_id,
                      step_sel_id,
                      camera_sel_id,
                      streamCallback)
{
  //-------------------------------------------------------------------------
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

  this.capture    = new cv.VideoCapture(this.videoIn);
  this.context    = this.canvas.getContext("2d");

  this.width      = this.videoIn.width;
  this.height     = this.videoIn.height;


  this.srcFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC4);
  this.dispFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC4);
  this.tmpFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC4);
  this.grayFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC1);
  this.grayFrame2 = new cv.Mat(this.height, this.width, cv.CV_8UC1);
  this.hsvFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
  this.rgbFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
  this.rgbFrame2  = new cv.Mat(this.height, this.width, cv.CV_8UC3);

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
   */
  function ProcessInfo(stepNumber, stepName, width, height)
  {
    this.name       = stepName;
    this.frame      = new cv.Mat(height, width, cv.CV_8UC4);
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

        this.beginProcessStep("Original Frame");
          sourceFrame.copyTo(this.curFrame);
        this.endProcessStep();

        // call everything in the OnFrame block.
        this.insideOnFrame = true;
        this.blocksOnFrame();
        this.insideOnFrame = false;
      }
      catch (e)
      {
        console.log("Error in onProcess: " + e);
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
    this.width = this.videoIn.width;
    this.height = this.videoIn.height;

    this.srcFrame.delete();
    this.dispFrame.delete();
    this.tmpFrame.delete();
    this.grayFrame.delete();
    this.grayFrame2.delete();
    this.hsvFrame.delete();
    this.rgbFrame.delete();
    this.rgbFrame2.delete();

    this.srcFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC4);
    this.dispFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC4);
    this.tmpFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC4);
    this.grayFrame  = new cv.Mat(this.height, this.width, cv.CV_8UC1);
    this.grayFrame2 = new cv.Mat(this.height, this.width, cv.CV_8UC1);
    this.hsvFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.rgbFrame   = new cv.Mat(this.height, this.width, cv.CV_8UC3);
    this.rgbFrame2  = new cv.Mat(this.height, this.width, cv.CV_8UC3);
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
    */
  this.beginProcessStep = function(stepName)
  {
    // First time on this step - create a mat for it
    if (this.procInfos.length <= this.procStep)
    {
      this.procInfos.push(new ProcessInfo(this.procStep, stepName, gCVBC.width, gCVBC.height));
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
  }

  /** Called at the end of each process step to save/display the current
    * frame and update for the next frame.
    * @param {bool} reusePrev - if true, skips updating prevFrame
  */
  this.endProcessStep = function(reusePrev)
  {
    // Display if selected
    if (this.selStep.value == this.procStep)
    {
      this.curFrame.copyTo(gCVBC.dispFrame);
      // TODO:Update histogram
    }

    // Prep for next frame - some calls may not want their current frame
    // to affect future steps.  If reusePrev is true, then we skip updating
    // prevFrame.
    if ((reusePrev == undefined) || (!reusePrev))
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

  //-----------------
  // Streaming video functions

  /** Stops streaming and processing from camera / movie */
  this.stop = function() {
    if (this.streaming)
    {
      this.videoIn.pause();
      this.streaming = false;
      console.log("Streaming video stopping...");
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
    // start processing.
    if (this.width != this.videoIn.width)
      this.resetBuffers();

    if ((this.streaming == "movie") || (this.streaming == "camera"))
    {
      this.capture.read(this.srcFrame);
    }
    else if ((this.streaming == "image"))
    {
      try
      {
          let src = cv.imread(image_id);
          src.copyTo(this.srcFrame);
          src.delete();
      }
      catch(e)
      {
          console.log("Error loading static image: " + e);
          this.onStreamingStopped();
          if (this.debug)
            throw(e);
          return;
      }
    }

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

    setTimeout(cvblocks_video_callback, kFrameTime);
  };

  /** Called when streaming has stopped, from the video callback */
  this.onStreamingStopped = function()
  {
    console.log("Streaming video stopped.");
    this.videoIn.srcObject = null;
    this.videoIn.source    = null;

    this.context.fillStyle="#FFFFFF";
    this.context.fillRect(0,0,this.canvas.width,this.canvas.height);

    this.streaming       = false;

    console.log("Best frame time: " + this.frameTimeBest  + "ms")
    console.log("Worst frame time: " + this.frameTimeWorst + "ms")
    console.log("Avg frame time: " +
        this.frameTimeTotal / this.frameTimeCount + "ms")
    console.log("Frames: " + this.frameTimeCount);

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
    console.log("Video streaming started from movie URL.")
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
    console.log("Video streaming started from movie file.")
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
    console.log("Starting video stream from camera.")
    this.resetFrameCounters();

    var constraints = { deviceId: { exact: camselect.value } };

    navigator.mediaDevices.getUserMedia({ video: constraints })
      .then(cvblocks_stream_callback).catch(function(err){
                console.log("Unable to acquire camera: " + err);
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
      console.log("Video streaming started from camera.")
      setTimeout(cvblocks_video_callback, 0);
    }
    catch (e)
    {
      console.log("Error starting camera: " + e);
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
