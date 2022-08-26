#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
SRC_DIR="$SCRIPT_DIR/.."
cd "$SRC_DIR"

export LOG_LEVEL="debug"
export TWITCH_ICON_CACHE_PORT="32189"
export TWITCH_ICON_CACHE_HOST="0.0.0.0"
export TWITCH_ICON_CACHE_CACHE_TIME="2w"

yarn dev