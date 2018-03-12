Blockly.JavaScript['gaussian'] = function(block) {
  var value_ksize = Blockly.JavaScript.valueToCode(block, 'KSIZE', Blockly.JavaScript.ORDER_ATOMIC);

  if ((value_ksize == undefined) || (value_ksize.length == 0))
    value_ksize = "3";

  var code = 'cvblocks_gaussian(' + value_ksize + ');\n';
  return code;
};

Blockly.JavaScript['mean_blur'] = function(block) {
  var value_ksize = Blockly.JavaScript.valueToCode(block, 'KSIZE', Blockly.JavaScript.ORDER_ATOMIC);
  if ((value_ksize == undefined) || (value_ksize.length == 0))
    value_ksize = "3";

  var code = 'cvblocks_mean_blur(' + value_ksize + ');\n';
  return code;
};

Blockly.JavaScript['median_blur'] = function(block) {
  var value_ksize = Blockly.JavaScript.valueToCode(block, 'KSIZE', Blockly.JavaScript.ORDER_ATOMIC);
  if ((value_ksize == undefined) || (value_ksize.length == 0))
    value_ksize = "3";

  var code = 'cvblocks_median_blur(' + value_ksize + ');\n';
  return code;
};

Blockly.JavaScript['bilateral_filter'] = function(block) {
  var value_diameter = Blockly.JavaScript.valueToCode(block, 'DIAMETER', Blockly.JavaScript.ORDER_ATOMIC);
  var value_sigmacolor = Blockly.JavaScript.valueToCode(block, 'SIGMACOLOR', Blockly.JavaScript.ORDER_ATOMIC);
  var value_sigmaspace = Blockly.JavaScript.valueToCode(block, 'SIGMASPACE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_bilateral_filter( ' +
            + value_diameter + ', '
            + value_sigmacolor + ', '
            + value_sigmaspace
            + ' );\n';
  return code;
};


Blockly.JavaScript['onframe'] = function(block) {
  var statements_inputs = Blockly.JavaScript.statementToCode(block, 'INPUTS');
  var code = 'gCVBC.blocksOnFrame = function()\n{\n'+ statements_inputs + '\n};\n';
  return code;
};

Blockly.JavaScript['canny_edge'] = function(block) {
  var value_threshold1 = Blockly.JavaScript.valueToCode(block, 'THRESHOLD1', Blockly.JavaScript.ORDER_ATOMIC);
  var value_threshold2 = Blockly.JavaScript.valueToCode(block, 'THRESHOLD2', Blockly.JavaScript.ORDER_ATOMIC);
  var dropdown_aperture = block.getFieldValue('Aperture');

  if ((value_threshold1 == undefined) || (value_threshold1.length == 0))
    value_threshold1 = "30";

  if ((value_threshold2 == undefined) || (value_threshold2.length == 0))
    value_threshold2 = "30";

  var code = 'cvblocks_canny( ' + value_threshold1
             + ", " + value_threshold2
             + ", " + dropdown_aperture + ' );\n';

  return code;
};

Blockly.JavaScript['equalize_histogram'] = function(block) {
  var code = 'cvblocks_equalize();\n';
  return code;
};

Blockly.JavaScript['cvcolour_hue'] = function(block) {
  var angle_hue = block.getFieldValue('Colour');
  var code = "'" + Blockly.hueToRgb(angle_hue) + "'";
  return [code,Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['in_range_hsv'] = function(block) {
  var value_min_h = Blockly.JavaScript.valueToCode(block, 'min_h', Blockly.JavaScript.ORDER_ATOMIC);
  var value_max_h = Blockly.JavaScript.valueToCode(block, 'max_h', Blockly.JavaScript.ORDER_ATOMIC);
  var value_min_s = Blockly.JavaScript.valueToCode(block, 'min_s', Blockly.JavaScript.ORDER_ATOMIC);
  var value_max_s = Blockly.JavaScript.valueToCode(block, 'max_s', Blockly.JavaScript.ORDER_ATOMIC);
  var value_min_v = Blockly.JavaScript.valueToCode(block, 'min_v', Blockly.JavaScript.ORDER_ATOMIC);
  var value_max_v = Blockly.JavaScript.valueToCode(block, 'max_v', Blockly.JavaScript.ORDER_ATOMIC);

  if (!value_min_h.length)
    value_min_h = "0";
  if (!value_max_h.length)
    value_max_h = "179";

  var code = 'cvblocks_inrange_hsv('
  + value_min_h + ', '
  + value_max_h + ', '
  + value_min_s + ', '
  + value_max_s + ', '
  + value_min_v + ', '
  + value_max_v + ');\n';

  return code;
};


Blockly.JavaScript['gamma_correct'] = function(block) {
  var value_gamma = Blockly.JavaScript.valueToCode(block, 'gamma', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_gamma_correct(' + value_gamma + ')\n';
  return code;
};

Blockly.JavaScript['store_frame'] = function(block) {
  var variable_outframe = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('STOREDFRAME'), Blockly.Variables.NAME_TYPE);
  var code = variable_outframe + ' = cvblocks_store_frame();\n';
  return code;
};

Blockly.JavaScript['load_frame'] = function(block) {
  var variable_inframe = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('STOREDFRAME'), Blockly.Variables.NAME_TYPE);
  var code = 'cvblocks_load_frame(' + variable_inframe + ');\n';
  return code;
};

Blockly.JavaScript['erode'] = function(block) {
  var number_kernel_size = block.getFieldValue('kernel_size');
  var code = 'cvblocks_erode(' + number_kernel_size + ');\n';
  return code;
};

Blockly.JavaScript['dilate'] = function(block) {
  var number_kernel_size = block.getFieldValue('kernel_size');
  // TODO: Assemble JavaScript into code variable.
  var code = 'cvblocks_dilate(' + number_kernel_size + ');\n';
  return code;
};

Blockly.JavaScript['morphologyex'] = function(block) {
  var dropdown_operation = block.getFieldValue('OPERATION');
  var number_iterations = block.getFieldValue('ITERATIONS');
  var number_ksize_x = block.getFieldValue('KSIZE_X');
  var number_ksize_y = block.getFieldValue('KSIZE_Y');
  var dropdown_kernel_shape = block.getFieldValue('KERNEL_SHAPE');
  var number_anchor_x = block.getFieldValue('ANCHOR_X');
  var number_anchor_y = block.getFieldValue('ANCHOR_Y');
  var code = 'cvblocks_morphex( '
    + dropdown_operation + ', '
    + number_ksize_x + ', ' + number_ksize_y + ', '
    + dropdown_kernel_shape + ', '
    + number_anchor_x + ', ' + number_anchor_y + ', '
    + number_iterations
    + ');\n'
  return code;
};

Blockly.JavaScript['threshold'] = function(block) {
  var dropdown_threshold_type = block.getFieldValue('THRESHOLD_TYPE');
  var value_threshold_value = Blockly.JavaScript.valueToCode(block, 'THRESHOLD_VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var value_max_value = Blockly.JavaScript.valueToCode(block, 'MAX_VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_threshold('
      + value_threshold_value + ', '
      + value_max_value + ', '
      + dropdown_threshold_type + ');\n';
  return code;
};

Blockly.JavaScript['adaptive_threshold'] = function(block) {
  var dropdown_threshold_type = block.getFieldValue('THRESHOLD_TYPE');
  var dropdown_adaptive_type = block.getFieldValue('ADAPTIVE_TYPE');
  var value_block_size = Blockly.JavaScript.valueToCode(block, 'BLOCK_SIZE', Blockly.JavaScript.ORDER_ATOMIC);
  var value_adaptive_constant = Blockly.JavaScript.valueToCode(block, 'ADAPTIVE_CONSTANT', Blockly.JavaScript.ORDER_ATOMIC);
  var value_max_value = Blockly.JavaScript.valueToCode(block, 'MAX_VALUE', Blockly.JavaScript.ORDER_ATOMIC);

  var code = 'cvblocks_adaptive_threshold('
     + value_max_value + ', '
     + value_adaptive_constant + ', '
     + value_block_size + ', '
     + dropdown_threshold_type + ', '
     + dropdown_adaptive_type + ');\n';
  return code;
};

Blockly.JavaScript['background_subtractor'] = function(block) {
  var variable_bgremover = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('BGREMOVER'), Blockly.Variables.NAME_TYPE);
  var value_history_length = Blockly.JavaScript.valueToCode(block, 'HISTORY_LENGTH', Blockly.JavaScript.ORDER_ATOMIC);
  var value_threshold = Blockly.JavaScript.valueToCode(block, 'THRESHOLD', Blockly.JavaScript.ORDER_ATOMIC);
  var value_detect_shadows = Blockly.JavaScript.valueToCode(block, 'DETECT_SHADOWS', Blockly.JavaScript.ORDER_ATOMIC);

  var code = 'if (' + variable_bgremover + ' == undefined)\n'
                + '     ' + variable_bgremover + ' = cvblocks_new_bg_subtractor ( '
                + value_history_length + ', ' + value_threshold + ', ' + value_detect_shadows + ');\n'
                + 'cvblocks_background_subtractor(' + variable_bgremover + ');\n';
  return code;
};


Blockly.JavaScript['split_image'] = function(block) {
  var dropdown_pipe_image = block.getFieldValue('PIPE_IMAGE');
  // TODO: Assemble JavaScript into code variable.
  var code = 'cvblocks_split_image( ' + dropdown_pipe_image + ' );\n';
  return code;
};

Blockly.JavaScript['image_operation'] = function(block) {
  var dropdown_operation = block.getFieldValue('OPERATION');
  var variable_storedframe = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('STOREDFRAME'), Blockly.Variables.NAME_TYPE);
  // TODO: Assemble JavaScript into code variable.
  var code = '\n';
  return code;
};

Blockly.JavaScript['sobel'] = function(block) {
  var value_order_dx = Blockly.JavaScript.valueToCode(block, 'order_dx', Blockly.JavaScript.ORDER_ATOMIC);
  var value_order_dy = Blockly.JavaScript.valueToCode(block, 'order_dy', Blockly.JavaScript.ORDER_ATOMIC);
  var dropdown_kernel_size = block.getFieldValue('KERNEL_SIZE');
  var value_scale = Blockly.JavaScript.valueToCode(block, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC);
  var value_delta = Blockly.JavaScript.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_sobel('
            + value_order_dx + ", "
            + value_order_dy + ", "
            + dropdown_kernel_size + ", "
            + value_scale + ", "
            + value_delta
            + ');\n';
  return code;
};

Blockly.JavaScript['laplacian'] = function(block) {
  var dropdown_kernel_size = block.getFieldValue('KERNEL_SIZE');
  var value_scale = Blockly.JavaScript.valueToCode(block, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC);
  var value_delta = Blockly.JavaScript.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_laplacian('
            + dropdown_kernel_size + ", "
            + value_scale + ", "
            + value_delta
            + ');\n';
  return code;
};

Blockly.JavaScript['scharr'] = function(block) {
  var value_order_dx = Blockly.JavaScript.valueToCode(block, 'order_dx', Blockly.JavaScript.ORDER_ATOMIC);
  var value_order_dy = Blockly.JavaScript.valueToCode(block, 'order_dy', Blockly.JavaScript.ORDER_ATOMIC);
  var value_scale = Blockly.JavaScript.valueToCode(block, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC);
  var value_delta = Blockly.JavaScript.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'cvblocks_scharr('
            + value_order_dx + ", "
            + value_order_dy + ", "
            + value_scale + ", "
            + value_delta
            + ');\n';
  return code;
};

Blockly.JavaScript['image_operation'] = function(block) {
  var dropdown_operation = block.getFieldValue('OPERATION');
  var variable_storedframe = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('STOREDFRAME'), Blockly.Variables.NAME_TYPE);
  var code = 'cvblocks_image_operation( '
           + dropdown_operation + ', '
           + variable_storedframe + ');\n';
  return code;
};
/*----------------------------------------------------------------------------
 * CONTOURS
 *----------------------------------------------------------------------------
 */
 Blockly.JavaScript['find_contours'] = function(block) {
   var variable_contour_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CONTOUR_VAR'), Blockly.Variables.NAME_TYPE);
   var dropdown_mode = block.getFieldValue('MODE');
   var dropdown_method = block.getFieldValue('METHOD');

   if (block.parentBlock_ == null)
       return '/* cvblocks_find_contours ignored - no parent! */';

   var code = variable_contour_var + ' = cvblocks_find_contours(' + dropdown_mode + ', ' + dropdown_method + ');\n'
   return code;
 };

 Blockly.JavaScript['draw_contours'] = function(block) {
   var variable_contours = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CONTOURS'), Blockly.Variables.NAME_TYPE);
   var colour_contour_colour = block.getFieldValue('contour_colour');

   var code = 'cvblocks_draw_contours(' + variable_contours + ', "' + colour_contour_colour + '");\n'
   return code;
 };

 Blockly.JavaScript['contour_convex_hull'] = function(block) {
   var variable_source_contour = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('SOURCE_CONTOUR'), Blockly.Variables.NAME_TYPE);
   var variable_convex_hull = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CONVEX_HULL'), Blockly.Variables.NAME_TYPE);
   var code = variable_convex_hull + ' = cvblocks_convex_hull( ' + variable_source_contour + ');\n';
   return code;
 };

 Blockly.JavaScript['select_contour'] = function(block) {
   var variable_selected_contour = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('SELECTED_CONTOUR'), Blockly.Variables.NAME_TYPE);
   var dropdown_compare = block.getFieldValue('compare');
   var dropdown_param = block.getFieldValue('param');
   var variable_contours = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CONTOURS'), Blockly.Variables.NAME_TYPE);
   // TODO: Assemble JavaScript into code variable.
   var code = variable_selected_contour + ' = cvblocks_select_contour( ' + variable_contours + ', '
              + '"' + dropdown_compare + '", '
              + '"' + dropdown_param + '");\n'
   return code;
 };

 Blockly.JavaScript['contour_area'] = function(block) {
   var variable_selected_contour = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('SELECTED_CONTOUR'), Blockly.Variables.NAME_TYPE);
   var code = 'cvblocks_contour_area( ' + variable_selected_contour + ')';
   // TODO: Change ORDER_NONE to the correct strength.
   return [code, Blockly.JavaScript.ORDER_NONE];
 };

 Blockly.JavaScript['bounding_rect'] = function(block) {
   var variable_selectedcontour = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('SELECTEDCONTOUR'), Blockly.Variables.NAME_TYPE);
   var variable_rect = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('RECT'), Blockly.Variables.NAME_TYPE);
   var code = variable_rect + ' = cvblocks_bounding_rect( '
              + variable_selectedcontour + ' );\n';
   return code;
 };

 Blockly.JavaScript['hough_linesp'] = function(block) {
   var variable_lines = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LINES'), Blockly.Variables.NAME_TYPE);
   var value_rho = Blockly.JavaScript.valueToCode(block, 'RHO', Blockly.JavaScript.ORDER_ATOMIC);
   var angle_theta = block.getFieldValue('THETA');
   var value_threshold = Blockly.JavaScript.valueToCode(block, 'THRESHOLD', Blockly.JavaScript.ORDER_ATOMIC);
   var value_minlinelength = Blockly.JavaScript.valueToCode(block, 'MINLINELENGTH', Blockly.JavaScript.ORDER_ATOMIC);
   var value_maxlinegap = Blockly.JavaScript.valueToCode(block, 'MAXLINEGAP', Blockly.JavaScript.ORDER_ATOMIC);
   var code = variable_lines + ' = cvblocks_hough_linesp( '
            + value_rho + ', '
            + angle_theta + ', '
            + value_threshold + ', '
            + value_minlinelength + ', '
            + value_maxlinegap
            + ' );\n'
   return code;
 };

 Blockly.JavaScript['hough_circles'] = function(block) {
  var variable_circles = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CIRCLES'), Blockly.Variables.NAME_TYPE);
  var value_dp = Blockly.JavaScript.valueToCode(block, 'DP', Blockly.JavaScript.ORDER_ATOMIC);
  var value_mindist = Blockly.JavaScript.valueToCode(block, 'MINDIST', Blockly.JavaScript.ORDER_ATOMIC);
  var value_param1 = Blockly.JavaScript.valueToCode(block, 'PARAM1', Blockly.JavaScript.ORDER_ATOMIC);
  var value_param2 = Blockly.JavaScript.valueToCode(block, 'PARAM2', Blockly.JavaScript.ORDER_ATOMIC);
  var value_minradius = Blockly.JavaScript.valueToCode(block, 'MINRADIUS', Blockly.JavaScript.ORDER_ATOMIC);
  var value_maxradius = Blockly.JavaScript.valueToCode(block, 'MAXRADIUS', Blockly.JavaScript.ORDER_ATOMIC);
  var code = variable_circles + ' = cvblocks_hough_circles( '
           + value_dp + ', '
           + value_mindist + ', '
           + value_param1 + ', '
           + value_param2 + ', '
           + value_minradius + ', '
           + value_maxradius
           + ' );\n'
  return code;
};

Blockly.JavaScript['draw_lines'] = function(block) {
  var variable_lines = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LINES'), Blockly.Variables.NAME_TYPE);
  var colour_line_colour = block.getFieldValue('line_colour');
  var code = 'cvblocks_draw_lines(' + variable_lines + ', "' + colour_line_colour + '");\n'
  return code;
};

Blockly.JavaScript['draw_circles'] = function(block) {
  var variable_circles = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('CIRCLES'), Blockly.Variables.NAME_TYPE);
  var colour_circle_colour = block.getFieldValue('circle_colour');
  var code = 'cvblocks_draw_circles(' + variable_circles + ', "' + colour_circle_colour + '");\n'
  return code;
};

Blockly.JavaScript['draw_rect'] = function(block) {
  var variable_drawrect = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('DRAWRECT'), Blockly.Variables.NAME_TYPE);
  var colour_rect_colour = block.getFieldValue('RECT_COLOUR');
  var code = 'cvblocks_draw_rect(' + variable_drawrect + ', "' + colour_rect_colour + '");\n'
  return code;
};

Blockly.JavaScript['log'] = function(block) {
  var value_logmessage = Blockly.JavaScript.valueToCode(block, 'LOGMESSAGE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'cvblocks_log(' + value_logmessage + ');\n';
  return code;
};
