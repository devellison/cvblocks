# cvblocks
Exposing OpenCV to the Blockly environment for learning and rapid prototyping.

CVBlocks is designed to allow Blockly programming of
computer vision / image processing pipelines for learning and to quickly
prototype and test ideas.

It's still very much in its infancy - I'm doing basic architecture right now
before really plowing in to implementing the tons of blocks I hope it will
eventually have available.

You can play with it at https://www.bzlearning.com/cvblocks/ (although it
may not always be fully up to date with the code here).  It also works fine
if you run it locally from files.  If you intend to set it up on a website,
you'll probably need to use HTTPS for the camera option to function.

## Getting Started
CVBlocks depends on OpenCV, Blockly, and FileSaver.js.  Each of these
is under its own Open Source license for distribution - please read them!
The CVBlocks code itself is now under the MIT license.

You'll need Python 2.7 to run the dependency and build scripts:
https://www.python.org/downloads/

For python automation, I'm using the lxml library from http://lxml.de/
You may need to install it - see http://lxml.de/installation.html .

### Dependencies for CVBlocks
Run `get_deps.py` to retrieve all three dependencies into subdirectories
of the `./output/` directory.
```
./get_deps.py
```

### Building
Setting up the `index.html` file requires combining a few .xml files generated
by the Blockly Developer Tools with the `index_template.html` file.  `build.py`
does this combination and patches up a few glitches and limitations (like
removing empty categories and setting up the nested tree structure).
```
./build.py
```

### Optional
If you want to debug Blockly uncompressed, you'll currently also need the
closure library in `./outputs/closure-library`.  See the following:
https://developers.google.com/blockly/guides/modify/web/closure

## Running
For the most part, just point a modern browser at `./output/index.html`.

Chrome is the browser I'm developing it on, but it at least mostly works with
FireFox and Safari.  It does not currently work at all with Microsoft's
browsers.
