"use strict";

/** convert a byte to a hex string with leading 0 if necessary */
function byte2hex(b) {
    var hex = b.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

/** convert an rgb (0-255) value to a hex value ('#afbeaf') */
function rgb2hex(r, g, b) {
    return "#" + byte2hex(r) + byte2hex(g) + byte2hex(b);
}

/** convert a hex color value ('#afbeaf') to an rgb (0-255) value */
function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {r: parseInt(result[1], 16),g: parseInt(result[2], 16),b: parseInt(result[3], 16)} : null;
}

/** convert an hsv (0.0 - 1.0) value to an rgb value (0-255) */
function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {r: Math.round(r * 255),g: Math.round(g * 255),b: Math.round(b * 255)};
}

/** convert an rgb (0-255) value to an hsv (0.0 - 1.0) value */
function rgb2hsv(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    return {h: h,s: s,v: v };
}

/** convert to opencv's hsv, where hue is 0-179 */
function rgb2hsv_opencv(r, g, b) {
  var hsv = rgb2hsv(r,g,b);
  return {h: Math.round(hsv.h * 179),s: Math.round(hsv.s * 255),v: Math.round(hsv.v * 255)};
}

function cvblocks_gaussian(kSize)
{
  // If we're not in an onFrame event, bail - it's
  // not set up the way we need.
  if (!gCVBC.insideOnFrame)
    return;

    // If kSize is not odd, make it so.
    if (!(kSize & 1))
      kSize++;

  gCVBC.beginProcessStep("Gaussian Blur");
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

    gCVBC.beginProcessStep("Canny Edge Detector");
    cv.cvtColor(gCVBC.prevFrame, gCVBC.grayFrame, cv.COLOR_RGB2GRAY, 0);
    cv.Canny(gCVBC.grayFrame, gCVBC.grayFrame2, thresh1, thresh2, aperture, cv.BORDER_DEFAULT);
    cv.cvtColor(gCVBC.grayFrame2, gCVBC.curFrame, cv.COLOR_GRAY2RGBA, 0);
    gCVBC.endProcessStep();
}

function cvblocks_equalize()
{
  if (!gCVBC.insideOnFrame)
    return;

    gCVBC.beginProcessStep("Equalize Histogram");
    // We're currently staying in RGB mode.
    // So even for grayscale images, we need to split to HSV,
    // then equalize the brightness.
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

    cv.cvtColor(gCVBC.hsvFrame, gCVBC.rgbFrame, cv.COLOR_HSV2RGB, 0);
    cv.cvtColor(gCVBC.rgbFrame, gCVBC.curFrame, cv.COLOR_RGB2RGBA, 0);
    gCVBC.endProcessStep();
}

function figureOutHue(hueInput)
{
  // minh and maxh may be colors specified as '#ffa0c0'.
  if (typeof hueInput === 'string' || hueInput instanceof String)
  {

      var rgb_val = hex2rgb(hueInput);
      var hsv_val = rgb2hsv_opencv(rgb_val.r,rgb_val.g,rgb_val.b);
      return hsv_val.h;
  }
  else
  {
      return hueInput;
  }
}

function cvblocks_inrange_hsv(minh,maxh,mins,maxs,minv,maxv)
{
  if (!gCVBC.insideOnFrame)
    return;

    // This could be an RGB string '#ffa0c0' or it could be a number.
    // If a number, do we want it to be interpreted 0-255 or 0-360 for hue angle?
    // Either way, we need to send it 0-179 to OpenCV for hue, and 0-255 for s/v
    var min_hue = figureOutHue(minh);
    var max_hue = figureOutHue(maxh);

    gCVBC.beginProcessStep("In Range (HSV)");
    // We're currently staying in RGB mode.
    // So even for grayscale images, we need to split to HSV,
    // then equalize the brightness.
    cv.cvtColor(gCVBC.prevFrame, gCVBC.hsvFrame, cv.COLOR_RGB2HSV, 0);

    let low = new cv.Mat(gCVBC.hsvFrame.rows, gCVBC.hsvFrame.cols, gCVBC.hsvFrame.type(), [min_hue,mins,minv,0]);
    let high = new cv.Mat(gCVBC.hsvFrame.rows, gCVBC.hsvFrame.cols,  gCVBC.hsvFrame.type(), [max_hue,maxs,maxv,255]);
    cv.inRange(gCVBC.hsvFrame, low, high, gCVBC.grayFrame); // ,gTmpFrame
    low.delete();
    high.delete();

    cv.cvtColor(gCVBC.grayFrame, gCVBC.curFrame, cv.COLOR_GRAY2RGB, 0);
    gCVBC.endProcessStep();
}

function cvblocks_gamma_correct(gamma)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Gamma Correct");

  var gammaLut = new cv.Mat(1,256,cv.CV_8U);
  for (var i = 0; i < 256; ++i)
    gammaLut[i] = Math.pow(i/255.0, gamma) * 255.0;
  cv.cvLUT(gCVBC.prevFrame, gammaLut, gCVBC.curFrame);
  gammaLut.delete();

  gCVBC.endProcessStep();
}


function cvblocks_find_contours(mode, method)
{
  if (!gCVBC.insideOnFrame)
    return null;

  gCVBC.beginProcessStep("Find Contours");

  // Copy in the original  frame to current - we're not otherwise setting
  // the current frame by the find itself - but the source frame
  // would look prettier than what we likely have if we're drawing
  // contours on it.
  gCVBC.srcFrame.copyTo(gCVBC.curFrame);

  // find contours only works on 8UC1 images, so convert to that.
  cv.cvtColor(gCVBC.prevFrame, gCVBC.grayFrame, cv.COLOR_RGB2GRAY, 0);

  var contour_info = {contours: new cv.MatVector(),
                       hierarchy: new cv.Mat()};

  cv.findContours(gCVBC.grayFrame,
                  contour_info.contours,
                  contour_info.hierarchy,
                  mode,
                  method);

  // Note - no endProcessStep because there's a second function here.
  return contour_info;
}

function cvblocks_draw_contours(contour_info, contour_colour)
{
  if (!gCVBC.insideOnFrame)
    return;

  if ((contour_info == undefined) || (contour_info == null))
    return;

  var rgb = hex2rgb(contour_colour);
  var color = new cv.Scalar(rgb.r,rgb.g,rgb.b,255);
  try {
    cv.drawContours(gCVBC.curFrame, contour_info.contours,
                    -1, color, 1, cv.LINE_8,
                    contour_info.hierarchy);

  } catch (e) {
    console.log('error: '+e);
  }
}

function cvblocks_end_contours(contour_info)
{
  if (!gCVBC.insideOnFrame)
    return;

    contour_info.contours.delete();
    contour_info.hierarchy.delete();
  gCVBC.endProcessStep(true);
}

function cvblocks_select_contour(contour_info, compare, maxparam, areaval, perimeterval)
{
  if (!gCVBC.insideOnFrame)
    return;

  var selectedIndex = -1;

  contour_info.area = 0;
  let maxArea = 0;
  if (contour_info.contours.size())
  {
    selectedIndex = 0;
    maxArea = cv.contourArea(contour_info.contours.get(0));

    for (let i = 1; i < contour_info.contours.size(); ++i)
    {
      let curArea = cv.contourArea(contour_info.contours.get(i));
      if (curArea > maxArea)
      {
        maxArea = curArea;
        // perimeterval =
        selectedIndex = i;
      }
    }
  }
  contour_info.area = maxArea;

  var selectedContours = new cv.MatVector();
  var selectedHierarchy = new cv.Mat();

  if (selectedIndex >= 0)
    selectedContours.push_back(contour_info.contours.get(selectedIndex));

  // TODO: We will actually want contour_info to be a stack eventually,
  //       so that we can push a new pair on and pop it off to Restore
  //       the original contours to blocks proceeding us.
  contour_info.contours.delete();
  contour_info.hierarchy.delete();

  contour_info.contours = selectedContours;
  contour_info.hierarchy = selectedHierarchy;

  return contour_info;
}

function cvblocks_convex_hull(contour_info)
{
  if (!gCVBC.insideOnFrame)
    return;

  var hull = new cv.Mat();
  var hullHierarchy = new cv.Mat();

  contour_info.hullArea = 0;
  if (contour_info.contours.size())
  {

    cv.convexHull(contour_info.contours.get(0), hull, false, true);
    contour_info.hullArea = cv.contourArea(hull, false);
    var hullArray = new cv.MatVector();
    hullArray.push_back(hull);
  }

  contour_info.contours.delete();
  contour_info.hierarchy.delete();

  contour_info.contours = hullArray;
  contour_info.hierarchy = hullHierarchy;
}


function cvblocks_load_frame(storedFrame)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Load Frame");

  if (storedFrame == null)
    storedFrame = gCVBC.srcFrame;
  gCVBC.curFrame = storedFrame;

  gCVBC.endProcessStep();
}

function cvblocks_store_frame()
{
  if (!gCVBC.insideOnFrame)
    return;
  gCVBC.beginProcessStep("Store Frame");

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

    gCVBC.beginProcessStep("Erode");
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

    gCVBC.beginProcessStep("Dilate");

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

    gCVBC.beginProcessStep("MorphologyEx" );

    if (ax >= kx)
      ax = kx - 1;
    if (ay >= ky)
      ay = ky - 1;

    let kSize = new cv.Size(kx,ky);
    let kAnchor = new cv.Point(ax,ay);
    let kernel = new cv.Mat();
    kernel = cv.getStructuringElement(kShape,kSize,kAnchor);
    switch (operation)
    {
      case cv.MORPH_HITMISS:
        // these don't like RGBA
        cv.cvtColor(gCVBC.prevFrame, gCVBC.grayFrame, cv.COLOR_RGBA2GRAY, 0);
        cv.morphologyEx(gCVBC.grayFrame, gCVBC.grayFrame2, operation, kernel, kAnchor, iterations);
        cv.cvtColor(gCVBC.grayFrame2, gCVBC.curFrame, cv.COLOR_GRAY2RGBA, 0);
        break;
      case cv.MORPH_GRADIENT:
      case cv.MORPH_TOPHAT:
      case cv.MORPH_BLACKHAT:
        // these don't like RGBA
        cv.cvtColor(gCVBC.prevFrame, gCVBC.rgbFrame, cv.COLOR_RGBA2RGB, 0);
        cv.morphologyEx(gCVBC.rgbFrame, gCVBC.rgbFrame2, operation, kernel, kAnchor, iterations);
        cv.cvtColor(gCVBC.rgbFrame2, gCVBC.curFrame, cv.COLOR_RGB2RGBA, 0);
        break;
      default:
        cv.morphologyEx(gCVBC.prevFrame, gCVBC.curFrame, operation, kernel, kAnchor, iterations);
        break;
    }

    kernel.delete();

    gCVBC.endProcessStep();
}


function cvblocks_threshold(thresh_value, max_value, operation)
{
  if (!gCVBC.insideOnFrame)
    return;

  gCVBC.beginProcessStep("Threshold" );

  switch (operation)
  {
    case cv.THRESH_OTSU:
    case cv.THRESH_TRIANGLE:
      // these don't like RGBA
      cv.cvtColor(gCVBC.prevFrame, gCVBC.grayFrame, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(gCVBC.grayFrame, gCVBC.grayFrame2, thresh_value, max_value, operation);
      cv.cvtColor(gCVBC.grayFrame2, gCVBC.curFrame, cv.COLOR_GRAY2RGBA, 0);
      break;
    default:
      // Alpha truncation sucks. Avoid it.
      cv.cvtColor(gCVBC.prevFrame, gCVBC.rgbFrame, cv.COLOR_RGBA2RGB, 0);
      cv.threshold(gCVBC.rgbFrame, gCVBC.rgbFrame2, thresh_value, max_value,  operation);
      cv.cvtColor(gCVBC.rgbFrame2, gCVBC.curFrame, cv.COLOR_RGB2RGBA, 0);
      break;
  }

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

    gCVBC.beginProcessStep("Adaptive Threshold" );

  cv.cvtColor(gCVBC.prevFrame, gCVBC.grayFrame, cv.COLOR_RGBA2GRAY, 0);
  cv.adaptiveThreshold(gCVBC.grayFrame, gCVBC.grayFrame2, max_value, adapt_type, thresh_type, block_size, adapt_const);
  cv.cvtColor(gCVBC.grayFrame2, gCVBC.curFrame, cv.COLOR_GRAY2RGBA, 0);

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

  gCVBC.beginProcessStep("Background Remover" );

  // retrieve a mask into gray Frame
  bg_subtractor.apply(gCVBC.prevFrame, gCVBC.grayFrame);

  // Mask the previous frame into current frame.
  let maskVector = new cv.MatVector();
  let alphaFrame = new cv.Mat(gCVBC.prevFrame.rows,gCVBC.prevFrame.cols, cv.CV_8UC1,new cv.Scalar(255));
  maskVector.push_back(gCVBC.grayFrame);
  maskVector.push_back(gCVBC.grayFrame);
  maskVector.push_back(gCVBC.grayFrame);
  maskVector.push_back(alphaFrame);
  cv.merge(maskVector, gCVBC.rgbFrame);
  cv.bitwise_and(gCVBC.prevFrame, gCVBC.rgbFrame, gCVBC.curFrame);
  maskVector.delete();
  alphaFrame.delete();

  gCVBC.endProcessStep();

}
