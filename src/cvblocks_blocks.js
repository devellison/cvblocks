Blockly.Blocks['cvcolour_hue'] = {
  // Set the colour of the block.
  init: function() {
    this.appendDummyInput()
        .appendField('hue')
        .appendField(new Blockly.FieldAngle('0', this.validator), 'Colour');
    this.setOutput(true, 'Colour');
    this.setTooltip('Paint the block with this colour.');
    this.setHelpUrl('https://www.youtube.com/watch?v=s2_xaEvcVI0#t=55');
  },
  validator: function(text) {
    // Update the current block's colour to match.
    var hue = parseInt(text, 10);
    if (!isNaN(hue)) {
      this.sourceBlock_.setColour(hue);
    }
  },
  mutationToDom: function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('colour', this.getColour());
    return container;
  },
  domToMutation: function(container) {
    this.setColour(container.getAttribute('colour'));
  }
};

Blockly.Blocks['onframe'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("On Frame");
    this.appendStatementInput("INPUTS")
        .setCheck(null);
    this.setColour(105);
 this.setTooltip("OnFrame is called for each image frame.");
 this.setHelpUrl("");
  }
};

/** Disables blocks if they aren't inside onFrame */
function onFrameWatcher(parentBlock)
{
  parentBlock.setOnChange(function(changeEvent) {
    var legal = false;
    var block = parentBlock;
    do {
      if ("onframe" == block.type) {
        legal = true;
        break;
      }
      block = block.getSurroundParent();
    } while (block);

    if (legal) {
      parentBlock.setWarningText(null);
      if (!parentBlock.isInFlyout)
        parentBlock.setDisabled(false);
    } else {
      parentBlock.setWarningText('Must be in an OnFrame block!');
      if (!parentBlock.isInFlyout && !parentBlock.getInheritedDisabled())
        parentBlock.setDisabled(true);
    }});
}


Blockly.Blocks['gaussian'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Gaussian Blur");
    this.appendValueInput("KSIZE")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("kernel size");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Blurs the image");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Gaussian_blur");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['canny_edge'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Canny Edge Detection");
    this.appendValueInput("THRESHOLD1")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Threshold 1");
    this.appendValueInput("THRESHOLD2")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Threshold 2");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Aperture")
        .appendField(new Blockly.FieldDropdown([["3","3"], ["5","5"], ["7","7"]]), "Aperture");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Finds edges in the image");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Canny_edge_detector");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['equalize_histogram'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Equalize Histogram");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Increases contrast");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Histogram_equalization");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['in_range_hsv'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("In Range (HSV)");
    this.appendValueInput("min_h")
        .setCheck(["Number", "Colour"])
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("min Hue");
    this.appendValueInput("max_h")
        .setCheck(["Number", "Colour"])
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("max Hue");
    this.appendValueInput("min_s")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("min Saturization");
    this.appendValueInput("max_s")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("max Saturization");
    this.appendValueInput("min_v")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("min Value");
    this.appendValueInput("max_v")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("max Value");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Sets pixels that fall in the specified range to white; all others are set to black.");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['find_contours'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Find Contours");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Retrieval Mode")
        .appendField(new Blockly.FieldDropdown([["External","cv.RETR_EXTERNAL"], ["List","cv.RETR_LIST"], ["Connected Components","cv.RETR_CCOMP"], ["Tree","cv.RETR_TREE"]]), "MODE");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Approximation Method")
        .appendField(new Blockly.FieldDropdown([["None (all points)","cv.CHAIN_APPROX_NONE"], ["Simple","cv.CHAIN_APPROX_SIMPLE"], ["Teh-Chin Chain Approx (TC89 L1)","cv.CHAIN_APPROX_TC89_L1"], ["Teh-Chin Chain Approx (TC89 KCOS)","cv.CHAIN_APPROX_TC89_KCOS"]]), "METHOD");
    this.appendStatementInput("CONTOURS")
        .setCheck("CONTOURS")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(45);
 this.setTooltip("Finds a list of contours and their hierarchies in the image.");
 this.setHelpUrl("https://docs.opencv.org/2.4/modules/imgproc/doc/structural_analysis_and_shape_descriptors.html#findcontours");
 onFrameWatcher(this);
  }
};

/** Disables blocks if they aren't inside a findContours block */
function findContoursWatcher(parentBlock)
{
  // contained in find_contours
  parentBlock.setOnChange(function(changeEvent) {
    var legal = false;
    var block = parentBlock;
    do {
      if ("find_contours" == block.type) {
        legal = true;
        break;
      }
      block = block.getSurroundParent();
    } while (block);

    if (legal) {
      parentBlock.setWarningText(null);
      if (!parentBlock.isInFlyout)
        parentBlock.setDisabled(false);
    } else {
      parentBlock.setWarningText('Must be in a find_contours block!');
      if (!parentBlock.isInFlyout && !parentBlock.getInheritedDisabled())
        parentBlock.setDisabled(true);
    }});
}

Blockly.Blocks['draw_contours'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Draw Contours")
        .appendField(new Blockly.FieldColour("#ff0000"), "contour_colour");
    this.setPreviousStatement(true, "CONTOURS");
    this.setNextStatement(true, "CONTOURS");
    this.setColour(45);
 this.setTooltip("Draws the contours into the image.");
 this.setHelpUrl("");
 findContoursWatcher(this);
  }
};

Blockly.Blocks['select_contour'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Select the contour with the")
        .appendField(new Blockly.FieldDropdown([["minimum","mincompare"], ["maximum","maxcompare"]]), "compare")
        .appendField(new Blockly.FieldDropdown([["area","maxarea"], ["perimeter","maxperimeter"]]), "maxparam");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Set")
        .appendField(new Blockly.FieldVariable("area"), "areaval")
        .appendField("to contour's area.");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Set")
        .appendField(new Blockly.FieldVariable("perimeter"), "perimeterval")
        .appendField("to contour's perimeter.");
    this.appendStatementInput("contour_functions")
        .setCheck("CONTOURS");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "CONTOURS");
    this.setNextStatement(true, "CONTOURS");
    this.setColour(45);
 this.setTooltip("Selects a single contour from a group");
 this.setHelpUrl("");
 findContoursWatcher(this);
  }
};

Blockly.Blocks['load_frame'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Load Frame ")
        .appendField(new Blockly.FieldVariable("storedFrame"), "STOREDFRAME");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(135);
 this.setTooltip("Load a previously saved frame as the one to process.");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['store_frame'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Store frame")
        .appendField(new Blockly.FieldVariable("storedFrame"), "STOREDFRAME");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(135);
 this.setTooltip("Store a frame to load later in onFrame");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['contour_convex_hull'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Convex Hull");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Set hull area to")
        .appendField(new Blockly.FieldVariable("hullArea"), "CONVEXHULLAREA");
    this.appendStatementInput("NAME")
        .setCheck("CONTOURS")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.setPreviousStatement(true, "CONTOURS");
    this.setNextStatement(true, "CONTOURS");
    this.setColour(45);
 this.setTooltip("Creates a convex hull and calculates the solidity of a contour");
 this.setHelpUrl("");
 findContoursWatcher(this);
  }
};

Blockly.Blocks['gamma_correct'] = {
  init: function() {
    this.appendValueInput("gamma")
        .setCheck("Number")
        .appendField("Gamma");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Gamma correct the image");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};
Blockly.Blocks['dilate'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Dilate")
        .appendField(new Blockly.FieldNumber(5, 3, 100, 1), "kernel_size");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Dilates the image");
 this.setHelpUrl("https://docs.opencv.org/2.4/doc/tutorials/imgproc/erosion_dilatation/erosion_dilatation.html");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['erode'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Erode")
        .appendField(new Blockly.FieldNumber(5, 3, 100, 1), "kernel_size");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Erodes the image");
 this.setHelpUrl("https://docs.opencv.org/2.4/doc/tutorials/imgproc/erosion_dilatation/erosion_dilatation.html");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['morphologyex'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["Erode","cv.MORPH_ERODE "], ["Dilate","cv.MORPH_DILATE"], ["Open","cv.MORPH_OPEN"], ["Close","cv.MORPH_CLOSE"], ["Gradient","cv.MORPH_GRADIENT"], ["Top Hat","cv.MORPH_TOPHAT"], ["Black Hat","cv.MORPH_BLACKHAT"]]), "OPERATION")
        .appendField(new Blockly.FieldNumber(0, 1, 255, 1), "ITERATIONS")
        .appendField("time(s)");
    this.appendDummyInput()
        .appendField("with a (")
        .appendField(new Blockly.FieldNumber(0, 1, 255, 1), "KSIZE_X")
        .appendField("x")
        .appendField(new Blockly.FieldNumber(0, 1, 255, 1), "KSIZE_Y")
        .appendField(")")
        .appendField(new Blockly.FieldDropdown([["rectangle","cv.MORPH_RECT"], ["cross","cv.MORPH_CROSS"], ["ellipse","cv.MORPH_ELLIPSE"]]), "KERNEL_SHAPE")
        .appendField("kernel");
    this.appendDummyInput()
        .appendField("anchored at (")
        .appendField(new Blockly.FieldNumber(-1, -1, 255, 1), "ANCHOR_X")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(-1, -1, 255, 1), "ANCHOR_Y")
        .appendField(")");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Performs a morphological transformation with the given kernel.");
 this.setHelpUrl("https://docs.opencv.org/2.4/doc/tutorials/imgproc/opening_closing_hats/opening_closing_hats.html");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['threshold'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["Binary","cv.THRESH_BINARY"], ["Binary (inverse)","cv.THRESH_BINARY_INV"], ["Truncate","cv.THRESH_TRUNC"], ["To Zero","cv.THRESH_TOZERO"], ["To Zero (inverse)","cv.THRESH_TOZERO_INV"], ["OTSU","cv.THRESH_OTSU"], ["Triangle","cv.THRESH_TRIANGLE"]]), "THRESHOLD_TYPE")
        .appendField("Threshold");
    this.appendValueInput("THRESHOLD_VALUE")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Value");
    this.appendValueInput("MAX_VALUE")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Max Value");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Truncates the colors in an image based on a cutoff value.");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Thresholding_(image_processing)");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['adaptive_threshold'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Adaptive")
        .appendField(new Blockly.FieldDropdown([["Binary","cv.THRESH_BINARY"], ["Binary (inverse)","cv.THRESH_BINARY_INV"]]), "THRESHOLD_TYPE")
        .appendField("Threshold");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Type")
        .appendField(new Blockly.FieldDropdown([["Mean","cv.ADAPTIVE_THRESH_MEAN_C"], ["Gaussian","cv.ADAPTIVE_THRESH_GAUSSIAN_C"]]), "ADAPTIVE_TYPE");
    this.appendValueInput("BLOCK_SIZE")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Block Size");
    this.appendValueInput("ADAPTIVE_CONSTANT")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Constant");
    this.appendValueInput("MAX_VALUE")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Max Value");
    this.setInputsInline(false);
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Truncates the colors in an image based using an adaptive cutoff.");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Thresholding_(image_processing)");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['background_subtractor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Background Removal");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Create object")
        .appendField(new Blockly.FieldVariable("bg_remover"), "BGREMOVER");
    this.appendValueInput("HISTORY_LENGTH")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("History Length");
    this.appendValueInput("THRESHOLD")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("THRESHOLD");
    this.appendValueInput("DETECT_SHADOWS")
        .setCheck("Boolean")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Detect Shadows?");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(270);
 this.setTooltip("Removes the background from video.");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};

Blockly.Blocks['split_image'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Split image into color channels.");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Red Channel")
        .appendField(new Blockly.FieldVariable("image_red"), "REDIMAGE");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Green Channel")
        .appendField(new Blockly.FieldVariable("image_green"), "GREENIMAGE");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Blue Channel")
        .appendField(new Blockly.FieldVariable("image_blue"), "BLUEIMAGE");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Set pipeline to")
        .appendField(new Blockly.FieldDropdown([["input","0"], ["red","1"], ["green","2"], ["blue","3"]]), "PIPE_IMAGE");
    this.setPreviousStatement(true, "Image");
    this.setNextStatement(true, "Image");
    this.setColour(135);
 this.setTooltip("Splits the image into RGB channels, places each in an Image variable.");
 this.setHelpUrl("");
 onFrameWatcher(this);
  }
};
