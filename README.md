> This currently only outputs German Corona data.  Sorry, but accidentally I am German.
>
> Also this is not yet fully complete yet.
> Only the table of two locations can be drawn.
> The regional compare is still missing.


# Corona

This is a small web application to print detailed information of Corona for normal human beings.

[Example](https://valentin.hilbig.de/corona/) and [Data source](https://github.com/swildermann/COVID-19)


## Usage

	git clone --recursive https://github.com/hilbix/corona.git
	ln --relative -s corona/web /srv/www/html/corona

	make -C corona	# create the ES5 compatible code in corona/web/old/ with babeljs V7

	corona/update.sh https://valentin.hilbig.de/corona/data/

Notes:

- Run corona/update.sh once a day to pull current data.
- https://valentin.hilbig.de/corona/data/ is a mirror of https://covid19publicdata.blob.core.windows.net/ a couple times a day.
- If my mirror fails, try the original source https://covid19publicdata.blob.core.windows.net/ instead


## FAQ

WTF why?

- Because AFAICS the world has gone mad.  All presentations about COVID-19 are not done for a normal being.
- Hence I had to do it myself.  Sigh.

`babeljs`?

- Debian Buster:
  - You need backports
  - `apt-get install node-babel7`

Contact? Bug?

- Please open issue on GitHub
- Eventually I listen

Contrib?  Patch?

- Please open PR on GitHub
- Eventually I listen

License?

- You are kidding, right?  There is absolutely nothing which can be copyrighted here.  Just strait done in a hurry.  A double no-brainer.
- Hence it is CLL, so free as in free beer, free speech, free air and free baby.

