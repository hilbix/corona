# This Works is placed under the terms of the Copyright Less License,
# see file COPYRIGHT.CLL.  USE AT OWN RISK, ABSOLUTELY NO WARRANTY.

.PHONY:	love
love:	all

.PHONY:	all
all:	web/old/es11.js web/old/corona.js

web/old/%.js:	web/%.js js/babel.sh Makefile
	js/babel.sh "$<" >"$@"

