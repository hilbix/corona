#

.PHONY:	love
love:	all

.PHONY:	all
all:	web/old/es11.js web/old/corona.js

web/old/%.js:	web/%.js js/babel.sh Makefile
	js/babel.sh "$<" >"$@"

