
DomReady.then(_ => new Corona().main());

function* range(i,j) { for (; i<=j; i++) yield i }
function sort_numeric(a,b) { return parseInt(a)>parseInt(b) }
function weekday(day) { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day] }

class Corona
  {
  constructor(id='corona')
    {
      this.e	= E(id).clr();
      this.i	= this.e.DIV.text('loading');
    }

  inf(s)	{ this.i.clr().text(s) }

  async main()
    {
      this.inf('loading...');
      this.csv = await fetch('data/rki/covid19-germany-counties.csv').then(_ => _.text());
      this.inf(`${(this.csv.length / 1000 | 0)/1000} MB loaded`);
      this.parse();
      this.top();
    }

  parse()
    {
      const lines	= this.csv.split('\n');
      const heads	= lines.shift().split(',');
      this.recs		= lines.map(_ => Object.fromEntries(_.split(',').map((v,k) => [heads[k], v])));
//      if (!recs[recs.length-1].id) recs.pop();
      console.log(heads);
      this.e.HR;
//      this.e.DIV.TEXT(heads);
    }

  top()
    {
      const t = this.e.TABLE.addclass('top');
      const h = t.THEAD.TR;
      const r = t.TBODY.TR;
      this.a1 = this.SHOW(h.TH.addclass('topl'), r.TD.addclass('topl'), 1);
      this.a2 = this.SHOW(h.TH.addclass('topr'), r.TD.addclass('topr'), 2);
    }

  SHOW(h, b, n)
    {
      const s1 = new Select(h, `cc${n}`)    .set(this.FILTER('Country/Region'));
      const s2 = new Select(h, `cr${n}`, s1).set(this.FILTER('Country/Region',s1,'countyname'));
      const s3 = new Select(h, `ct${n}`, s2).set(this.FILTER('Country/Region',s1,'countyname',s2,'type'));
      const s4 = new Select(h, `n${n}`)     .set(_ => range(1,32), sort_numeric);

      const o = b.TABLE;

      const put = () =>
        {
          o.clr();
          const l = this.FILTER('Country/Region',s1,'countyname',s2,'type',s3)();
          const n = parseInt(s4.$value);

          function sorter(a,b) { return a.date>b.date }
          l.sort(sorter);

          function br(...a) { const r=[]; for (const x of a) { if (r.length) r.push(E().BR); r.push(x) }; return r }
          o.THEAD.TR.th('WD', 'date', 'inf', 'dth', br('inf', '100k'), br('dth','100k'), br('inf','new'), br('dth','new'), br('inf','new','100k'), br('dth','new','100k'));

          let li = parseInt(l[l.length-1].newinfections) || parseInt(l[l.length-1].newdeaths) ? 1 : 2;
          const last = l[l.length-li];
//          for (const a in last) { o.TR.TD.text(a).$$.TD.text(last[a]); }

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

          const b = o.TBODY;
          for (const k of [1,3,7,30])
            print(b.TR, l.length-li, k, `${k} days`, 'state');
          for (let i=l.length; --i>=n; )
            print(b.TR, i, n);
        }

      s3.on(put);
      s4.on(put);
      put();
    }

  FILTER(...args)
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

      let ret	= _ => this.recs;
      while (args.length>1)
        {
          const k	= args.shift();
          const v	= args.shift();
          ret		= filt(ret, k, v);
        }
      if (args.length==1)
        {
          const k	= args.shift();
          ret = sel(ret, k);
        }

      return ret;
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

