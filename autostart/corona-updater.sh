#!/bin/bash

ORIGINAL=https://covid19publicdata.blob.core.windows.net/

ME="$(realpath -e -- "$0")"

while	"${ME%/*/*}/update.sh" "$ORIGINAL"
	date && ! read -t 4000
do :; done

