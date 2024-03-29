'use strict';
// This Works is placed under the terms of the Copyright Less License,
// see file COPYRIGHT.CLL.  USE AT OWN RISK, ABSOLUTELY NO WARRANTY.

DomReady.then(_ => new Corona().main());


// microlib
function* range(i,j) { for (; i<=j; i++) yield i }
function sort_numeric(a,b) { return parseInt(a)>parseInt(b) }
function weekday(day) { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day] }

// Corona main App, see DomReady above
class Corona
  {
  constructor(id='corona')
    {
      this.e	= E(id).clr();
      this.e.text('Cookie ');
      UrlState.buttons(id, this.e);
    }

  async main()
    {
      const load = this.e.SPAN;
      this.e.HR;

      load.SPAN.text(' Germany RKI: ');
      this.csv_r	= await new CSV(ShowCR.URL).indicate(load).Load();
      this.show(ShowCR, this.csv_r);

      load.SPAN.text(' ');
      this.csv_s	= await new CSV(ShowCS.URL).indicate(load).Load();
      this.show(ShowCS, this.csv_s);

      load.SPAN.text(' World Hopkins: ');
      this.csv_h	= await new CSV(ShowCH.URL).indicate(load).Load();
      this.show(ShowCH, this.csv_h);
    }

  show(klass, csv)
    {
      const t = this.e.TABLE.addclass('top');
      const h = t.THEAD.TR;
      const r = t.TBODY.TR;
      new klass(csv, h.TH.addclass('topl'), r.TD.addclass('topl'), 1);
      new klass(csv, h.TH.addclass('topr'), r.TD.addclass('topr'), 2);
    }
  };

// Common CSV presenter
// new Show(new CSV(), selectorelement, dataelement, UrlState_nr, UrlState_prefix).init([description])
// description is an Array of objects:
// {code:'urlstate', input:data-fn, sort:sort-fn, upd:'code-of-higher-ranked-selector'}
// input/sort see SelectUnique; input:data-fn can be replaced by csv:'header' to refer to the CSV
class Show
  {
  constructor(csv, sel, data, nr, prefix)
    {
      this.csv	= csv;
      this.sel	= sel;
      this.dat	= data || sel;
      this.nr	= nr || '0';
      this.pre	= prefix || '';
      this.init();
    }
  init(arr)
    {
      this.filters = [];
      this.selects = {};

      this.sel.clr();
      this.dat.clr();

      for (const f of arr)
        {
          const s = new SelectUnique(this.sel, `${this.pre}${f.code}${this.nr}`, this.selects[f.upd]);
          this.selects[f.code] = s;
          if (f.csv)
            {
              this.filters.push(f.csv);
              s.set(this.csv.FILTER(this.filters), f.sort);
              this.filters.push(_ => s.$value);
            }
          else
            s.set(f.input, f.sort);
          s.on(_ => this.put());
        }

      this.el = this.dat.TABLE;
      this.put();
    }
  };

class ShowCorona extends Show
  {
  // XXX TODO XXX This needs a lot of rework
  put()
    {
      this.el.clr();
      const l = this.csv.FILTER(this.filters)();
      const n = parseInt(this.selects[this.delta].$value);
      const today = new Date().toISOString().split('T').shift();

      function sorter(a,b) { return a.date>b.date }
      l.sort(sorter);

      function br(...a) { const r=[]; for (const x of a) { if (r.length) r.push(E().BR); r.push(x) }; return r }

      const pop	= this.csv.has('population');

      const hdr	= [];
      hdr.push('WD', 'date', 'inf', 'dth');
      if (pop) hdr.push(br('inf', '100k'), br('dth','100k'));
      hdr.push(br('inf','new'), br('dth','new'));
      if (pop) hdr.push(br('inf','new','100k'), br('dth','new','100k'));

      this.el.THEAD.TR.th(...hdr);

      let max = l.length;
      while (--max>=0 && l[max].date>today);

      // skip today if there is no data yet (or nothing happened)
      const lm = l[max] || {};
      let li = (lm.newinfections|0) && (lm.newdeaths|0) ? 0 : 1;

      if (max-li<0)
        max = li = 0;
      const last = l[max-li];
//    for (const a in last) { this.el.TR.TD.text(a).$$.TD.text(last[a]); }

      function print(d, i, n, head, we)
        {
          const x = l[i];
          if (!x) return;		// happens if no data

          const w = new Date(x.date).getDay();
          if (we || w==0 || w==6) d.addclass(we || 'weekend');

          d.TD.ltext(weekday(w));
          d.TD.ltext(head || x.date);
          d.TD.rtext(`${x.infections}`);
          d.TD.rtext(`${x.deaths}`);
          if (pop)
            {
              d.TD.rtext(`${x.infections / x.population * 100000 | 0}`);
              d.TD.rtext(`${x.deaths / x.population * 100000 | 0}`);
            }

          // recalculate the aggregation functions,
          // as upstream apparently gets them wrong, sadly!
          const sum = {};
          for (const j of ['infections','deaths'])
            {
              const r = l[i-n];
              sum[`new${j}`] = (x[j]|0) - (r ? r[j]|0 : 0);
            }

          d.TD.rtext(`${sum.newinfections}`).addclass('inf');
          d.TD.rtext(`${sum.newdeaths}`);
          if (pop)
            {
              d.TD.rtext(`${sum.newinfections / x.population * 100000 | 0}`);
              d.TD.rtext(`${sum.newdeaths / x.population * 100000 | 0}`);
            }
        }

      const b = this.el.TBODY;
      for (const k of [1,3,7,30])
        print(b.TR, max-li, k, `${k} days`, 'state');
      for (let i=max+1; --i>=0; )
        print(b.TR, i, n);
    }
  };

// Data presentation for
// data/rki/covid19-germany-counties.csv
class ShowCR extends ShowCorona
  {
  static URL = 'data/rki/covid19-germany-counties.csv';
  init()
    {
      this.delta = 'n';
      super.init(
        [ { code:'cc', csv:'Country/Region' }
        , { code:'cr', csv:'countyname',    upd:'cc' }
        , { code:'ct', csv:'type',          upd:'cr' }
        , { code:'n',  input:_ => range(1,32), sort:sort_numeric }
        ]);
    }
  };

// Data presentation for
// data/rki/covid19-germany-federalstates.csv
class ShowCS extends ShowCorona
  {
  static URL = 'data/rki/covid19-germany-federalstates.csv';
  init()
    {
      this.delta = 'sn';
      super.init(
        [ { code:'cs', csv:'Country/Region' }
        , { code:'cf', csv:'federalstate',  upd:'cs' }
        , { code:'sn', input:_ => range(1,32), sort:sort_numeric }
        ]);
    }
  };

// Data presentation for
// data/hopkins/covid19-hopkins.csv
// continent
// Country/Region
// Province/State
// District,FIPS,Lat,Long,date,infections,recovered,deaths,newinfections,newrecovered,newdeaths
class ShowCH extends ShowCorona
  {
  static URL = 'data/hopkins/covid19-hopkins.csv';
  init()
    {
      this.delta = 'hn';
      super.init(
        [ { code:'hc', csv:'continent' }
        , { code:'hr', csv:'Country/Region', upd:'hc' }
        , { code:'hp', csv:'Province/State', upd:'hr' }
        , { code:'hd', csv:'District', upd:'hp' }
        , { code:'hn', input:_ => range(1,32), sort:sort_numeric }
        ]);
    }
  };


////////////////////////////////////////////////////////////////////////
// Below should go into a lib
////////////////////////////////////////////////////////////////////////

// A very hackish CSV reader.  Works with files containing , or ; (transforms ; within "" into ,)
// Class to read and filter CSV files
class CSV
  {
  constructor(url)
    {
      this.url	= url;
    }
  indicate(e)
    {
      this.i = e.SPAN;
      return this;
    }
  inf(s)
    {
      if (this.i)
        this.i.$text=s;
      return this;
    }
  get $len()
    {
      return this.csv.length;
    }
  // XXX TODO XXX change into iterator!
  get $recs()
    {
      return this.recs;
    }

  has(head) { return this.heads.includes(head) }

  progress(got, total)
    {
      this.inf(`loaded ${((got/1000|0)/1000).toFixed(3)}/${(total/1000|0)/1000} MB ${this.url}`);
    }

  // load the CSV
  async Load()
    {
      this.inf(`loading ${this.url}`);
      this.csv = await fetch(this.url)
        .then(_ => fetchProgress(_, this.progress.bind(this)))
        .then(_ => _.text())
        .catch(_ => { this.inf(`load failed: ${_}`); throw _ });
      this.inf(`${(this.$len / 1000 | 0)/1000}MB`);
      this.parse();
      return this;
    }
  parse()
    {
      const lines	= this.csv
        .split(',').join(';')						// replace , with ;
        .replace(/"[^"]*"/g, _ => _.replace(/"/g,'').replace(/;/,','))	// replace "TEXT" with ; into TEXT with , to escape split on ;
        .replace(/\r/g,'')						// Hello Windows!  I do not like your ending.
        .split('\n');							// split into lines
      const heads	= lines.shift().split(';');			// split into columns on ;
      this.heads	= heads;
      this.recs		= lines.map(_ => Object.fromEntries(_.split(';').map((v,k) => [heads[k], v])));
      console.log(this.url, heads);
      return this;
    }

  // XXX TODO XXX change into iterator!
  // FILTER([filterdef]) return selected CSV lines
  // filterdef:
  //	'header'				// returns entries
  //	'header', valuefunction			// return lines
  //	'header', valuefunction, filterdef
  // valuefunction() is called to retrieve the actual value
  FILTER(arr)
    {
      function filt(fn, k, v)
        {
          return function ()
            {
              const l = fn();
              const x = v();
//            console.log('filt', k, x);
              return l.filter(_ => _[k]==x);
            }
        }
      function sel(fn, k)
        {
          return function ()
            {
              const l = fn();
              return l.map(_ => _[k]);
            }
        }

      arr=[...arr];	// do not alter the array passed in
      let ret	= _ => this.recs;
      while (arr.length>1)
        {
          const k	= arr.shift();
          const v	= arr.shift();
          ret		= filt(ret, k, v);
        }
      if (arr.length==1)
        {
          const k	= arr.shift();
          ret = sel(ret, k);
        }

      return ret;
    }
  };

// DOM select class for sorted unique elements (duplicates will be eradicated).
// new SelectUnique(parentelement, UrlState-ID, opt_higher-ranked-select).set(data_fn, sort_fn);
// data_fn() return an iterable.
// sort_fn(a,b) returns the sorting of elements
// higher-ranked-select is the selector instance of the higher ranked select,
// which means:  When the higher ranked select canges, this one needs to be updated, too.
class SelectUnique extends OnOff
  {
  constructor(e, id, chg)
    {
      super();
      if (chg) chg.on(_ => { this.upd() });
      this.e	= e.SELECT.on('change', _ => { this.sel() });
      this.s	= UrlState(id);
    }
  get $value()	{ return this.e.$option.$text }
  sel()		{ return this.trigger(this.s.state = this.$value) }

//  ON(...a)	{ return this.e.ON(...a) }
//  on(...a)	{ this.ON(...a); return this }

  set(fn, sort)
    {
      this.fn	= fn;
      this.sort	= sort;
      return this.upd();
    }
  upd()
    {
      this.e.clr();
//      console.log(this.fn);
      return this.unique(this.fn());
    }

  unique(l)
    {
      const o = {};
      for (const a of l)
        if (a !== void 0)
          o[a] = 0;
      const s = [];
      for (const a in o)
        s.push(a);
      s.sort(this.sort);

      this.o	= s;
      for (const a in s)
        this.add(s[a], a+1, s[a]==this.s.state);
      return this.sel();
    }

  add(t,i,sel)
    {
      const o = this.e.OPTION.text(t);
      if (i !== void 0)
        o.value(i);
      if (sel !== void 0)
        o.selected(sel);
      return this;
    }
  };

