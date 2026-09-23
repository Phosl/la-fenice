#!/bin/sh
set -eu

# Some Cloud hosts already have Metal; downloading it again exits with code 70.
# Probe the executable, not just the component's installation record.
if ! xcrun --sdk iphoneos metal --version; then
    xcodebuild -downloadComponent MetalToolchain
fi
xcrun --sdk iphoneos metal --version
