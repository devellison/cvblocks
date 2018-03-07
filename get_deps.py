# sets up the dependencies for CVBlocks in output/
#
import urllib
import subprocess
import os

#
# Create dependency output directories
#
print("making output/ and subdirectories...")
if not os.path.exists("output"):
    os.mkdir("output")
if not os.path.exists("output/opencv"):
    os.mkdir("output/opencv");
if not os.path.exists("output/filesaver"):
    os.mkdir("output/filesaver")
if not os.path.exists("output/blockly"):
    os.mkdir("output/blockly")

#
# OpenCV (Currently using 3.4.1)
# Main: https://opencv.org/
# Source: https://github.com/opencv/opencv/tree/3.4.1
# You can build opencv.js yourself if desired from the source, but it has a fairly complex setup.
# It was easy for me to do on OSX, but under Windows 10 I had difficulties with it even following the
# instructions step by step.  So cheating a little and pulling the binary here from their docs page.
# Apache 2.0 License
#
print("Downloading opencv.js...")
urllib.urlretrieve("https://docs.opencv.org/3.4.1/opencv.js","output/opencv/opencv.js")
urllib.urlretrieve("https://raw.githubusercontent.com/opencv/opencv/3.4.1/README.md","output/opencv/README.md")
urllib.urlretrieve("https://raw.githubusercontent.com/opencv/opencv/3.4.1/LICENSE","output/opencv/LICENSE")

#
# FileSaver.js (Currently using 1.3.4)
# Main: https://eligrey.com/blog/saving-generated-files-on-the-client-side/
# Source: https://github.com/eligrey/FileSaver.js
# Using the minimized version to save space, but should be swappable.
# MIT License
#
print("Downloading FileSaver.js...")
urllib.urlretrieve("https://raw.githubusercontent.com/eligrey/FileSaver.js/1.3.4/LICENSE.md", "output/filesaver/LICENSE.md");
urllib.urlretrieve("https://raw.githubusercontent.com/eligrey/FileSaver.js/1.3.4/README.md", "output/filesaver/README.md");
urllib.urlretrieve("https://raw.githubusercontent.com/eligrey/FileSaver.js/1.3.4/FileSaver.min.js", "output/filesaver/FileSaver.js");

#
# Blockly
# Main: https://developers.google.com/blockly/
# Source: https://github.com/google/blockly
# For now I'm pulling all of Blockly down.
print("Cloning Blockly...")
subprocess.call(['git.exe', 'clone', 'https://github.com/google/blockly.git', 'output/blockly'])
