#!/usr/bin/env python

import sys
import os
import re
from lxml import etree
from shutil import copy

# Files to copy from src/ to output/
source_files = ['cvblocks_blocks.js',       # Blockly block definitions
                'cvblocks_gen.js',          # Blockly code generators
                'cvblocks_functions.js',    # Functions called by generated code
                'cvblocks.css',             # Style sheet for CVBlocks
                'cvblocks_core.js',         # Core engine for CVBlocks
                'cvblocks.js'];             # Glue code between CVBlocks and other parts - mostly the host HTML

output_dir   = "output/"
template_dir = "templates/"
# This fills in the commented areas in the index_template.html with the toolbox
# and workspace xml I'm generating from the Blockly Developer Tools.
#
# Right now Blockly really doesn't appear to like shorthand tags or empty
# categories, and the Developer tools don't like nested categories, so
# it patches those up as best it can then warns of any manual editing
# that might be needed.
#
def generate_index():
    toolboxFile = open(template_dir + "index_template.html","r")
    workspaceFile = open(template_dir + "workspace_blocks.xml","r")
    output = open(output_dir + "index.html","w")

    for line in toolboxFile:
        if '<!-- begin Blockly toolbox -->' in line:
            output.write(line)
            tree = etree.parse(template_dir + "toolbox.xml")
            nodes = tree.xpath('//*')
            filters = nodes[1]
            xmlnode = nodes[0]
            core = etree.Element('category', name='Core',colour='#000000')
            xmlnode.append(core)

            #
            # gather all the nodes into an array
            #
            treeIter = tree.iter('{*}category')
            allnodes = []
            fixupnodes = []
            for curNode in treeIter:
                allnodes.append(curNode)

            # group everything between filters and contours into filters,
            # and all core operations in core
            inFilter = False
            inShapes = False

            rootStandalones = ['Utilities','Motion']
            coreSet = ['Variables','Math','Logic','Colour','Loops','Lists','Functions','Text']

            for curNode in allnodes:
                if curNode.get('name') == 'Filters':
                    inShapes = False
                    inFilter = True
                    filers = curNode
                elif curNode.get('name') == 'Shapes':
                    inFilter = False
                    inShapes = True
                    shapes = curNode;
                elif curNode.get('name') in rootStandalones:
                    inShapes = False
                    inFilter = False

                if (inFilter == True) & (curNode.get('name') != 'Filters'):
                    filters.append(curNode)
                if (inShapes == True) & (curNode.get('name') != 'Shapes'):
                    shapes.append(curNode)
                if curNode.get('name') in coreSet:
                    core.append(curNode)

            outputTree = etree.tostring(tree, pretty_print=True)

            # self-closed tags break Blockly.  Add closing tags. This one gets full tags...
            outputTree = re.sub(r'<([^/>\s]*)\s+([^/>]*)/>',r'<\1 \2></\1>',outputTree)
            outputTree = re.sub(r'<([^/>\s]*)/>',r'<\1></\1>',outputTree)
            output.write(outputTree);

        elif '<!-- begin Blockly workspace -->' in line:
            output.write(line)
            for workspaceLine in workspaceFile:
                output.write(workspaceLine)
        else:
            output.write(line)


if not os.path.exists("output"):
    os.mkdir("output")

generate_index()
#print "Copying src/ files to output/"
for item in source_files:
    #print("src/" + item + " -> output/" + item)
    copy("src/" + item, output_dir)
copy("LICENSE",output_dir + "LICENSE")
