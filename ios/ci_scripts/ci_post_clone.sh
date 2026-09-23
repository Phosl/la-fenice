#!/bin/sh
set -eu

# Xcode Cloud does not include the compiler required by LaFeniceWater.metal.
xcodebuild -downloadComponent MetalToolchain
