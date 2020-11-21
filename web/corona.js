'use strict';
// This Works is placed under the terms of the Copyright Less License,
// see file COPYRIGHT.CLL.  USE AT OWN RISK, ABSOLUTELY NO WARRANTY.

DomReady.then(_ => new Corona().main());

function* range(i,j) { for (; i<=j; i++) yield i }
function sort_numeric(a,b) { return parseInt(a)>parseInt(b) }
function weekday(day) { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day] }

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
  INF(s)
    {
      if (this.i)
        this.i.$text=s;
    }
  get LEN()
    {
      return this.csv.length;
    }
  get $recs()
    {
      return this.recs;
    }
  async Load()
    {
      this.INF(`loading ${this.url}`);
      this.csv = await fetch(this.url).then(_ => _.text());
      this.INF(`${(this.LEN / 1000 | 0)/1000}MB`);
      this.parse();
      return this;
    }
  parse()
    {
      const lines	= this.csv.split('\n');
      const heads	= lines.shift().split(',');
      this.recs		= lines.map(_ => Object.fromEntries(_.split(',').map((v,k) => [heads[k], v])));
      console.log(this.url, heads);
      return this;
    }
  FILTER(arr)
    {
      function filt(fn, k, v)
        {
          return function ()
            {
              const l = fn();
              const x = v.$value;
//              console.log('filt', k, x);
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

      arr=[...arr];
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
      this.selects = [];

      this.sel.clr();
      this.dat.clr();

      for (const f of arr)
        {
          const s = new Select(this.sel, `${this.pre}${f.code}${this.nr}`);
          this.selects.push(s);
          if (f.csv)
            {
              this.filters.push(f.csv);
              s.set(this.csv.FILTER(this.filters));
              this.filters.push(s);
            }
          else
            s.set(_ => f.input, f.sort);
          s.on(_ => this.put());
        }

      this.el = this.dat.TABLE;
      this.put();
    }
  };

class ShowCR extends Show
  {
  init()
    {
      super.init(
        [ { code:'cc', csv:'Country/Region' }
        , { code:'cr', csv:'countyname' }
        , { code:'ct', csv:'type' }
        , { code:'n',  input:range(1,32), sort:sort_numeric }
        ]);
    }
  put()
    {
      this.el.clr();
      const l = this.csv.FILTER(this.filters)();
      const n = parseInt(this.selects[3].$value);

      function sorter(a,b) { return a.date>b.date }
      l.sort(sorter);

      function br(...a) { const r=[]; for (const x of a) { if (r.length) r.push(E().BR); r.push(x) }; return r }

      this.el.THEAD.TR.th('WD', 'date', 'inf', 'dth', br('inf', '100k'), br('dth','100k'), br('inf','new'), br('dth','new'), br('inf','new','100k'), br('dth','new','100k'));

      let li = parseInt(l[l.length-1].newinfections) || parseInt(l[l.length-1].newdeaths) ? 1 : 2;
      const last = l[l.length-li];
//    for (const a in last) { this.el.TR.TD.text(a).$$.TD.text(last[a]); }

      function print(d, i, n, head, we)
        {
          const x = l[i];

          const w = new Date(x.date).getDay();
          if (we || w==0 || w==6) d.addclass(we || 'weekend');

          d.TD.ltext(weekday(w));
          d.TD.ltext(head || x.date);
          d.TD.rtext(`${x.infections}`);
          d.TD.rtext(`${x.deaths}`);
          d.TD.rtext(`${x.infections / x.population * 100000 | 0}`);
          d.TD.rtext(`${x.deaths / x.population * 100000 | 0}`);

          const sum = {};
          for (let k=n; --k>=0; )
            for (const j of ['newinfections','newdeaths'])
              sum[j] = (sum[j] || 0)+parseInt(l[i-k][j]);

          d.TD.rtext(`${sum.newinfections}`).addclass('inf');
          d.TD.rtext(`${sum.newdeaths}`);
          d.TD.rtext(`${sum.newinfections / x.population * 100000 | 0}`);
          d.TD.rtext(`${sum.newdeaths / x.population * 100000 | 0}`);
        }

      const b = this.el.TBODY;
      for (const k of [1,3,7,30])
        print(b.TR, l.length-li, k, `${k} days`, 'state');
      for (let i=l.length; --i>=n; )
        print(b.TR, i, n);
    }
  };

class Corona
  {
  constructor(id='corona')
    {
      this.e	= E(id).clr();
    }

  async main()
    {
      this.csv	= await new CSV('data/rki/covid19-germany-counties.csv').indicate(this.e).Load();
      this.e.HR;
      this.top();
    }

  top()
    {
      const t = this.e.TABLE.addclass('top');
      const h = t.THEAD.TR;
      const r = t.TBODY.TR;
      this.a1 = new ShowCR(this.csv, h.TH.addclass('topl'), r.TD.addclass('topl'), 1);
      this.a2 = new ShowCR(this.csv, h.TH.addclass('topr'), r.TD.addclass('topr'), 2);
    }
  };

class Select extends OnOff
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

