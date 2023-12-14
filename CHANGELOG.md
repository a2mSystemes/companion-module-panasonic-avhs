# companion-module-panasonic-avhs CHANGELOG

## Companion v3 module new versions

**V1.0.7**

- Rewrite for compatibility with Companion V3 support
- Added presets for XPT switching, AUTO trans, and CUT trans
- Removed for AVHS-410 timing control action (not working on AVHS410)  as I am not able to make it work
- Removed AVHS-410 PinP 1, PinP 2, FTB, DSK CUT TARGETS as I am not able to make it work
- fixed AVHS-410 Key AUTO trans 

## Legacy module version (kept for continuity)

**V1.0.4**

- Added Tally feedback for AV-HS410
- Changed error handling on Multicast
- Added the option to disble Tally/Multicast on AV-HS410, if dissabled it will default to port 60040 (only needs one plugin then)

**V1.0.3**

- Bug-Fix: Fixed variables not loading with the AV-HS410, when you had more than one network interface enabled
- Some Error handling and stopped companion from crashing when updating the instance settings
- Bug-Fix: Prevent companion from crashing when using more than one AV-HS410 video mixer

**V1.0.2**

- Bug-Fix for connection dropputs with AV-HS410
- Fixed actions default not showing correctly
- Added variables for AV-HS410 tally outputs and bus selections (only on AV-HS410)
- Added Support for AV-UHS500
- Yarn formated
