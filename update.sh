#!/bin/bash
#
# This Works is placed under the terms of the Copyright Less License,
# see file COPYRIGHT.CLL.  USE AT OWN RISK, ABSOLUTELY NO WARRANTY.

BASE="${1%/}"
if [ -z "$BASE" ]
then
	echo "please give download base URL"
	exit 1
fi

cd -- "$(dirname -- "$0")" || exit
if	[ ! -d data ]
then
	echo "missing directory data/"
	exit 1
fi

while read -ru6 sub
do
	DIR="data/${sub%/*}"
	mkdir -p "$DIR"
	wget --progress=dot:mega --timestamping --directory-prefix="$DIR/" "$BASE/$sub"
done 6<<URLS
rki/covid19-germany-federalstates.csv
rki/covid19-germany-counties.csv
rki/covid19-germany-counties-nuts3.csv
hopkins/covid19-hopkins.csv
URLS
#ecdc/covid19-ECDC.csv

