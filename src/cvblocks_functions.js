"use strict";

// Enumerations / constants
function CVBlocks_const()
{
  // cvblocks_image_operation constants
  this.op_add_image = 0;
  this.op_sub_image = 1;
  this.op_or_image  = 2;
  this.op_and_image = 3;
  this.op_xor_image = 4;

  this.split_red    = 1;
  this.split_green  = 2;
  this.split_blue   = 3;
  this.split_hue    = 4;
  this.split_saturation = 5;
  this.split_value  = 6;
  //
  return this;
}
var gCVBC_CONST = new CVBlocks_const();



// Functions
function cvblocks_gaussian(kSize)
{
  // If we're not in an onFrame event, bail - it's
  // not set up the way we need.
  if (!gCVBC.insideOnFrame)
    return;

    // If kSize is not odd, make it so.
    if (!(kSize & 1))
      kSize++;

  gCVBC.beginProcessStep("Gaussian Blur",-1);
    let kernelSize = new cv.Size(kSize, kSize);
    cv.GaussianBlur(gCVBC.prevFrame, gCVBC.curFrame, kernelSize, 0, 0, cv.BORDER_DEFAULT);
  gCVBC.endProcessStep();
}

function cvblocks_canny(thresh1, thresh2, aperture)
{
  // If we're not in an onFrame event, bail - it's
  // not set up the way we need.
  if (!gCVBC.insideOnFrame)
    return;

    // If aperture is not odd, make it so.
    if (!(aperture & 1))
      aperture++;

    if (aperture > 7)
      aperture = 7;

    gCVBC.beginProcessStep("Canny Edge Detector",1);
    cv.Canny(gCVBC.prevFrame, gCVBC.curFrame, thresh1, thresh2, aperture, cv.BORDER_DEFAULT);
    gCVBC.endProcessStep();
}

function cvblocks_sobel(dx, dy, kernel, scale, delta)
{
  // If we're not in an onFrame event, bail - it's
  // not set up the way we need.
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Sobel Operator",1);
    // kernel must be larger than order of derivative
    // TODO: These all cause assertions to fail - what needs
    // to be done in such cases (in all of this code) is to pop
    // a warning flag on the block and stop processing or something
    // similar when bad data is input.
    if (kernel != -1) // Special case for Scharr, although we may do it separately
    {
      if (kernel <= dx)
        kernel = dx + 1;
      if (kernel <= dy)
        kernel = dy + 1;
    }
    if (dx + dy == 0)
      dx++;

    cv.Sobel(gCVBC.prevFrame, gCVBC.curFrame, cv.CV_8U, dx, dy, kernel, scale, delta, cv.BORDER_DEFAULT);
  gCVBC.endProcessStep();
}

function cvblocks_scharr(dx, dy, scale, delta)
{
  // If we're not in an onFrame event, bail - it's
  // not set up the way we need.
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Scharr Operator",1);

  if (dx + dy != 1)
  {
    dx = 1;
    dy = 0;
  }

  cv.Scharr(gCVBC.prevFrame, gCVBC.curFrame, cv.CV_8U, dx, dy, scale, delta, cv.BORDER_DEFAULT);
  gCVBC.endProcessStep();
}

function cvblocks_image_operation(operation, image)
{
  if (!gCVBC.insideOnFrame)
    return;
  if (image == undefined)
    return;

  var want_gray = 0;
  if (image.step[1] == 1)
    want_gray = 1;

  gCVBC.beginProcessStep("Image Operation", want_gray);

  switch (operation)
  {
    case gCVBC_CONST.op_add_image:
      cv.add(gCVBC.prevFrame,image,gCVBC.curFrame);
      break;
    case gCVBC_CONST.op_sub_image:
      cv.subtract(gCVBC.prevFrame,image,gCVBC.curFrame);
      break;
    case gCVBC_CONST.op_and_image:
      cv.bitwise_and(gCVBC.prevFrame,image,gCVBC.curFrame);
      break;
    case gCVBC_CONST.op_or_image:
      cv.bitwise_or(gCVBC.prevFrame,image,gCVBC.curFrame);
      break;
    case gCVBC_CONST.op_xor_image:
      cv.bitwise_xor(gCVBC.prevFrame,image,gCVBC.curFrame);
      break;
  }

  gCVBC.endProcessStep();
}

function cvblocks_split_image(which)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Split Image",2);

  var split_list;
  var convert_hsv = false;

  switch (which)
  {
    case gCVBC_CONST.split_red:
      split_list = [0,0];
      break;
    case gCVBC_CONST.split_green:
      split_list = [1,0];
      break;
    case gCVBC_CONST.split_blue:
      split_list = [2,0];
      break;
    case gCVBC_CONST.split_hue:
      split_list = [0,0];
      convert_hsv = true;
      break;
    case gCVBC_CONST.split_saturation:
      split_list = [1,0];
      convert_hsv = true;
      break;
    case gCVBC_CONST.split_value:
      split_list = [2,0];
      convert_hsv = true;
      break;
  }

  var inputVector = new cv.MatVector();
  var outputVector = new cv.MatVector();
  if (convert_hsv)
  {
    cv.cvtColor(gCVBC.prevFrame, gCVBC.hsvFrame, cv.COLOR_RGB2HSV,0);
    inputVector.push_back(gCVBC.hsvFrame);
  }
  else
  {
      inputVector.push_back(gCVBC.prevFrame);
  }

  outputVector.push_back(gCVBC.curFrame);

  cv.mixChannels( inputVector, outputVector, split_list);

  inputVector.delete();
  outputVector.delete();

  gCVBC.endProcessStep();
}

function cvblocks_equalize()
{
  if (!gCVBC.insideOnFrame)
    return;

    gCVBC.beginProcessStep("Equalize Histogram",-1);

    if (gCVBC.curFrame.step[1] == 1)
    {
      // Grayscale is easy
      cv.equalizeHist(gCVBC.prevFrame, gCVBC.curFrame);
    }
    else
    {
      // Our previous image is RGB, but we need to equalize in HSV
      // then convert back to RGB
      cv.cvtColor(gCVBC.prevFrame, gCVBC.hsvFrame, cv.COLOR_RGB2HSV, 0);

      let inputVector = new cv.MatVector();
      let outputVector = new cv.MatVector();

      // Pull out the V channel from HSV, equalize it, then stuff it back in.
      inputVector.push_back(gCVBC.hsvFrame);
      outputVector.push_back(gCVBC.grayFrame);
      let hsvToGray = [2,0];
      cv.mixChannels( inputVector, outputVector, hsvToGray);

      cv.equalizeHist(gCVBC.grayFrame, gCVBC.grayFrame);

      let grayToHSV = [0,2];
      cv.mixChannels( outputVector, inputVector, grayToHSV);

      inputVector.delete();
      outputVector.delete();

      cv.cvtColor(gCVBC.hsvFrame, gCVBC.curFrame, cv.COLOR_HSV2RGB, 0);
    }
    gCVBC.endProcessStep();
}

function figureOutHue(hueInput)
{
  var hueAngle;
  // minh and maxh may be colors specified as '#ffa0c0'.
  if (typeof hueInput === 'string' || hueInput instanceof String)
  {
      var color = tinycolor(hueInput);
      // toHSV returns [0-1] values, openCV expects 0-179 for Hue
      hueAngle = color.toHsv().h;
  }
  else
    hueAngle = hueInput;

  // Hue in the app shows 0-360. We need to scale it to 0-179
  return (hueAngle/360)*179;
}


function cvblocks_inrange_hsv(minh,maxh,mins,maxs,minv,maxv)
{
  if (!gCVBC.insideOnFrame)
    return;

    // This could be an RGB string '#ffa0c0' or it could be a number.
    // If a number, do we want it to be interpreted 0-255 or 0-360 for hue angle?
    // Either way, we need to send it 0-179 to OpenCV for hue
    var min_hue = figureOutHue(minh);
    var max_hue = figureOutHue(maxh);

    gCVBC.beginProcessStep("In Range (HSV)",2);
    // We're currently staying in RGB mode.
    // So even for grayscale images, we need to split to HSV,
    // then equalize the brightness.
    cv.cvtColor(gCVBC.prevFrame, gCVBC.hsvFrame, cv.COLOR_RGB2HSV, 0);

    let low = new cv.Mat(gCVBC.hsvFrame.rows, gCVBC.hsvFrame.cols, gCVBC.hsvFrame.type(), [min_hue,mins,minv,0]);
    let high = new cv.Mat(gCVBC.hsvFrame.rows, gCVBC.hsvFrame.cols,  gCVBC.hsvFrame.type(), [max_hue,maxs,maxv,255]);
    cv.inRange(gCVBC.hsvFrame, low, high, gCVBC.curFrame); // ,gTmpFrame
    low.delete();
    high.delete();

    gCVBC.endProcessStep();
}

function cvblocks_gamma_correct(gamma)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Gamma Correct",-1);

  var gammaLut = new cv.Mat(1,256,cv.CV_8U);
  for (var i = 0; i < 256; ++i)
    gammaLut[i] = Math.pow(i/255.0, gamma) * 255.0;
  cv.cvLUT(gCVBC.prevFrame, gammaLut, gCVBC.curFrame);
  gammaLut.delete();

  gCVBC.endProcessStep();
}


function cvblocks_load_frame(storedFrame)
{
  if (!gCVBC.insideOnFrame)
    return;

  if (storedFrame == null)
    storedFrame = gCVBC.srcFrame;

  var want_gray = 0;
  if (storedFrame.step[1] == 1)
    want_gray = 1;

  gCVBC.beginProcessStep("Load Frame", want_gray);

  gCVBC.curFrame = storedFrame;

  gCVBC.endProcessStep();
}

function cvblocks_store_frame()
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Store Frame", -1);

  let storedFrame = gCVBC.prevFrame;
  // Might just not beginProcessStep/endProcessStep,
  // since there's no change to the image and we
  // have to make a copy to keep the chain going.
  gCVBC.prevFrame.copyTo(gCVBC.curFrame);

  gCVBC.endProcessStep();
  return storedFrame;
}

function cvblocks_erode(kernelSize)
{
  if (!gCVBC.insideOnFrame)
    return;

    gCVBC.beginProcessStep("Erode",-1);
    if ((kernelSize == null) || (kernelSize <= 1))
      kernelSize = 3;

      let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
      let anchor = new cv.Point(-1, -1);
      let iterations = 1;

      cv.erode(gCVBC.prevFrame, gCVBC.curFrame, kernel, anchor, iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    gCVBC.endProcessStep();
}

function cvblocks_dilate(kernelSize)
{
  if (!gCVBC.insideOnFrame)
    return;

    gCVBC.beginProcessStep("Dilate", -1);

    let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    let iterations = 1;

    cv.dilate(gCVBC.prevFrame, gCVBC.curFrame, kernel, anchor, iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    gCVBC.endProcessStep();
}

function cvblocks_morphex(operation, kx, ky, kShape, ax, ay, iterations)
{
  if (!gCVBC.insideOnFrame)
    return;

    var want_gray = -1;
    if (operation == cv.MORPH_HITMISS)
      want_gray = 1;
    gCVBC.beginProcessStep("MorphologyEx", want_gray);

    if (ax >= kx)
      ax = kx - 1;
    if (ay >= ky)
      ay = ky - 1;

    let kSize = new cv.Size(kx,ky);
    let kAnchor = new cv.Point(ax,ay);
    let kernel = new cv.Mat();
    kernel = cv.getStructuringElement(kShape,kSize,kAnchor);
    cv.morphologyEx(gCVBC.prevFrame, gCVBC.curFrame, operation, kernel, kAnchor, iterations);

    kernel.delete();

    gCVBC.endProcessStep();
}


function cvblocks_threshold(thresh_value, max_value, operation)
{
  if (!gCVBC.insideOnFrame)
    return;

  var want_gray = -1;
  if (( operation == cv.THRESH_OTSU) || (operation == cv.THRESH_TRIANGLE))
    want_gray = 1;

  gCVBC.beginProcessStep("Threshold", want_gray);

  cv.threshold(gCVBC.prevFrame, gCVBC.curFrame, thresh_value, max_value,  operation);

  gCVBC.endProcessStep();
}

function cvblocks_adaptive_threshold(max_value, adapt_const, block_size, thresh_type, adapt_type)
{
  if (!gCVBC.insideOnFrame)
    return;

  // blocksize must be ODD
  if (isNaN(block_size) || (block_size <= 3))
    block_size = 3;

  if ((block_size % 2) == 0)
    block_size++;

  gCVBC.beginProcessStep("Adaptive Threshold",1);


  cv.adaptiveThreshold(gCVBC.prevFrame, gCVBC.curFrame, max_value, adapt_type, thresh_type, block_size, adapt_const);


  gCVBC.endProcessStep();
}

function cvblocks_new_bg_subtractor( history, threshold, shadows)
{
  if (isNaN(history) || (history < 1))
    history = 100;
  if (isNaN(threshold) || (threshold < 0))
    threshold = 15;
  return new cv.BackgroundSubtractorMOG2(history, threshold, shadows);
}

function cvblocks_background_subtractor(bg_subtractor)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Background Remover",0);

  // retrieve a mask into gray Frame
  bg_subtractor.apply(gCVBC.prevFrame, gCVBC.grayFrame);

  // Mask the previous frame into current frame.
  let maskVector = new cv.MatVector();
  maskVector.push_back(gCVBC.grayFrame);
  maskVector.push_back(gCVBC.grayFrame);
  maskVector.push_back(gCVBC.grayFrame);
  cv.merge(maskVector, gCVBC.rgbFrame);
  cv.bitwise_and(gCVBC.prevFrame, gCVBC.rgbFrame, gCVBC.curFrame);
  maskVector.delete();

  gCVBC.endProcessStep();

}

/*----------------------------------------------------------------------------
 * CONTOURS
 *----------------------------------------------------------------------------
 */

function cvblocks_find_contours(mode, method)
{
  if (!gCVBC.insideOnFrame)
    return null;

  gCVBC.beginProcessStep("Find Contours",1);

  // Copy in the original  frame to current - we're not otherwise setting
  // the current frame by the find itself... may just remove the
  // beginProcessStep, but then we have to do color conversion ourselves
  gCVBC.prevFrame.copyTo(gCVBC.curFrame);

  var found_contours = new cv.MatVector();
  var hierarchy = new cv.Mat();

  cv.findContours(gCVBC.prevFrame,
                  found_contours,
                  hierarchy,
                  mode,
                  method);

  hierarchy.delete();

  gCVBC.endProcessStep();

  return found_contours;
}

function cvblocks_draw_contours(contours, contour_colour)
{
  if (!gCVBC.insideOnFrame)
    return;

  if (undefined == contours)
    return;

  gCVBC.beginProcessStep("Draw Contours",0);
  gCVBC.prevFrame.copyTo(gCVBC.curFrame);

  var tmpColor = tinycolor(contour_colour);
  var rgb = tmpColor.toRgb();
  var color = new cv.Scalar(rgb.r,rgb.g,rgb.b,255);
  try
  {
    cv.drawContours(gCVBC.curFrame, contours,
                    -1, color, 1, cv.LINE_8);
  }
  catch (e)
  {
     console.log('error: '+e);
     if (gCVBC.debug)
      throw(e);
  }

  gCVBC.endProcessStep();
}

function cvblocks_select_contour(contours, compare, param)
{
  var selectedIndex = -1;
  let selectedParam = 0;

  if (undefined == contours)
    return undefined;

  if (contours.size())
  {
    selectedIndex = 0;
    selectedParam = cv.contourArea(contours.get(0));

    for (let i = 1; i < contours.size(); ++i)
    {
      var curParam;

      if (param == "area")
        curParam = cv.contourArea(contours.get(i));

      if (   ((compare == "maxcompare") && (curParam > selectedParam))
          || ((compare == "mincompare") && (curParam < selectedParam)) )
      {
        selectedParam = curParam;
        selectedIndex = i;
      }
    }
  }

  var selectedContours = new cv.MatVector();

  if (selectedIndex >= 0)
    selectedContours.push_back(contours.get(selectedIndex));

  return selectedContours;
}

function cvblocks_convex_hull(contours)
{
  if (!gCVBC.insideOnFrame)
    return;

  if (undefined == contours)
    return undefined;

  var hullArray = new cv.MatVector();

  if (contours.size())
  {
    var hull = new cv.Mat();
    cv.convexHull(contours.get(0), hull, false, true);
    hullArray.push_back(hull);
  }
  return hullArray;
}

function cvblocks_contour_area(selectedContours)
{
  if (undefined == selectedContours)
    return 0;

  if (selectedContours.size() == 0)
    return 0;

  return cv.contourArea(selectedContours.get(0));
}
