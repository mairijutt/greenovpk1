function eze(){
  const{flocks:e}=Dr();
  const navigate=hj();
  const go=path=>{try{navigate(path)}catch(err){window.location.href=path}};
  const[t,r]=S.useState(!0);
  const[n,a]=S.useState("");
  const[i,s]=S.useState("");
  const[o,c]=S.useState(null);
  const[f,d]=S.useState(null);
  const[m,v]=S.useState("all");

  // Interactive Hover States for Graphs
  const[hoveredFlock, setHoveredFlock]=S.useState(null);
  const[hoveredEggPoint, setHoveredEggPoint]=S.useState(null);

  const g=S.useCallback(async()=>{
    r(!0);
    try{
      const ye=await K9e(n,i,m==="all"?void 0:m);
      d(ce=>ce);
      c(ce=>(d(ce),ye.data));
    }catch(ye){
      pt.error(er(ye));
    }finally{
      r(!1);
    }
  },[n,i,m]);

  S.useEffect(()=>{g()},[g]);

  const b=o?.overview.netProfit??0,
        y=o?.overview.totalRevenue??0,
        w=o?.overview.totalExpenses??0,
        N=o?.overview.cogs??0,
        j=o?.overview.costPerBird??0,
        C=o?.overview.activeBirds??0,
        O=o?.healthMetrics.mortalityInRange??0,
        D=o?.healthMetrics.cullInRange??0,
        L=o?.healthMetrics.totalFeedConsumedBags??0,
        R=o?.healthMetrics.totalFeedPurchased??0,
        U=o?.healthMetrics.feedConversionRate??0,
        B=o?.healthMetrics.totalWaterConsumption??0,
        X=C>0?(B/C).toFixed(2):0,
        F=o?.additionalMetrics.flockCount??0,
        z=o?.production.totalEggs??0,
        J=o?.production.averageLayingRate??"0%",
        ne=o?.production.avgEggWeight??0,
        ge=o?.additionalMetrics.avgEggPriceInRange??0,
        te=o?.production.eggWastageRate??"0%",
        Z=o?.production.brokenEggs??0,
        K=Fp(b,f?.overview.netProfit),
        W=Fp(y,f?.overview.totalRevenue),
        me=Fp(Xp(J),f?Xp(f.production.averageLayingRate):void 0),
        Y=Fp(O,f?.healthMetrics.mortalityInRange),
        k=Fp(L,f?.healthMetrics.totalFeedConsumedBags),
        I=Fp(w,f?.overview.totalExpenses),
        oe=iA(b,{warn:0,crit:-1e5},"positive-good"),
        re=iA(Xp(te),{warn:2,crit:5},"negative-good"),
        G=iA(Xp(J),{warn:80,crit:60},"positive-good"),
        H=iA(O,{warn:5,crit:15},"negative-good");

  // Chart data calculations
  const salesItems = o?.salesBreakdown || [];
  const totalSalesAmt = salesItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || y || 1;

  const expenseItems = o?.expenseBreakdown || [];
  const totalExpAmt = expenseItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || w || 1;

  // Flock list with living birds and mortality for the chart
  const flockChartData = (e && e.length > 0 ? e : [
    { id: 8, flockName: 'Unit 1', totalBirds: 25000, mortality: 0 },
    { id: 9, flockName: 'Unit 2', totalBirds: 35000, mortality: 15 },
    { id: 10, flockName: 'Unit 3', totalBirds: 25500, mortality: 0 }
  ]).map(fl => {
    const perf = (o?.flockPerformance || []).find(p => p.flock === fl.flockName) || {};
    return {
      flock: fl.flockName,
      birds: Number(fl.totalBirds) || 25000,
      mortality: Number(fl.mortality) || Number(perf.mortality) || 0,
      production: Number(perf.production) || 0
    };
  });
  const maxBirds = Math.max(...flockChartData.map(f => f.birds), 40000);
  const maxMort = Math.max(...flockChartData.map(f => f.mortality), 20);

  const eggTrend = o?.chart || [];
  const maxEggDay = Math.max(...eggTrend.map(d => Number(d.eggs) || 0), 1000);

  return u.jsxs("div",{
    className:"p-4 sm:p-6 lg:p-8 space-y-12 max-w-[1600px] mx-auto",
    children:[
      // Modern Executive Header Bar with WIDER Date Picker
      u.jsxs("div",{
        className:"flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs",
        children:[
          // Branding
          u.jsxs("div",{
            className:"flex items-center gap-4",
            children:[
              u.jsx("div",{
                className:"bg-gradient-to-tr from-emerald-600 to-teal-700 p-3.5 rounded-2xl shadow-md text-white shrink-0",
                children:u.jsx(kz,{className:"h-6 w-6"})
              }),
              u.jsxs("div",{
                children:[
                  u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Layer Insight"}),
                  u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"COMPREHENSIVE POULTRY FARM ANALYTICS & OPERATIONS"})
                ]
              })
            ]
          }),

          // Modern Filters Container with WIDER Date Picker
          u.jsxs("div",{
            className:"flex flex-wrap items-center gap-3 bg-slate-50/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs",
            children:[
              // Flock Select Pill
              u.jsxs("div",{
                className:"flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors",
                children:[
                  u.jsx("span",{className:"text-xs",children:"🐔"}),
                  u.jsxs("select",{
                    value:m,
                    onChange:ye=>v(ye.target.value),
                    className:"bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer outline-none min-w-[130px] text-slate-800",
                    children:[
                      u.jsx("option",{value:"all",children:"All Flocks Combined"}),
                      e.map(ye=>u.jsx("option",{value:ye.id,children:ye.flockName},ye.id))
                    ]
                  })
                ]
              }),

              // WIDER Modern Calendar Date Range Card
              u.jsxs("div",{
                className:"flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors min-w-[340px] sm:min-w-[380px]",
                children:[
                  u.jsxs("svg",{
                    className:"w-4 h-4 text-emerald-600 shrink-0",
                    fill:"none",
                    viewBox:"0 0 24 24",
                    stroke:"currentColor",
                    strokeWidth:"2",
                    children:[
                      u.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),
                      u.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),
                      u.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),
                      u.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})
                    ]
                  }),
                  u.jsxs("div",{
                    className:"flex items-center gap-1.5 flex-1",
                    children:[
                      u.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",children:"From"}),
                      u.jsx("input",{
                        type:"date",
                        value:n,
                        onChange:ye=>a(ye.target.value),
                        className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"
                      })
                    ]
                  }),
                  u.jsx("span",{className:"text-slate-300 font-bold select-none",children:"→"}),
                  u.jsxs("div",{
                    className:"flex items-center gap-1.5 flex-1",
                    children:[
                      u.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",children:"To"}),
                      u.jsx("input",{
                        type:"date",
                        value:i,
                        onChange:ye=>s(ye.target.value),
                        className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"
                      })
                    ]
                  }),
                  (n||i)&&u.jsx("button",{
                    onClick:()=>{a("");s("");},
                    title:"Reset date range",
                    className:"text-[11px] font-black text-slate-400 hover:text-rose-600 px-1 rounded cursor-pointer transition-colors",
                    children:"✕"
                  })
                ]
              }),

              // Quick Presets
              u.jsxs("div",{
                className:"hidden sm:flex items-center gap-1.5",
                children:[
                  u.jsx("button",{
                    onClick:()=>{
                      const td = new Date().toISOString().split("T")[0];
                      a(td); s(td);
                    },
                    className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
                    children:"Today"
                  }),
                  u.jsx("button",{
                    onClick:()=>{
                      const dt = new Date();
                      const ed = dt.toISOString().split("T")[0];
                      dt.setDate(dt.getDate()-30);
                      const st = dt.toISOString().split("T")[0];
                      a(st); s(ed);
                    },
                    className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
                    children:"30D"
                  }),
                  u.jsx("button",{
                    onClick:()=>{a("");s("");},
                    className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
                    children:"All"
                  })
                ]
              }),

              // Refresh Button
              u.jsx("button",{
                onClick:g,
                className:"p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer flex items-center justify-center",
                title:"Refresh live analytics",
                children:u.jsx(Pz,{className:et("h-4 w-4",t&&"animate-spin text-emerald-600")})
              })
            ]
          })
        ]
      }),

      // 1. FINANCIAL MANAGEMENT SECTION
      u.jsxs("section",{
        className:"bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-8",
        children:[
          // Financial Section Header
          u.jsxs("div",{
            className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4",
            children:[
              u.jsxs("div",{
                className:"flex items-center gap-3",
                children:[
                  u.jsx("div",{className:"p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100",children:u.jsx(mh,{className:"h-5 w-5"})}),
                  u.jsxs("div",{
                    children:[
                      u.jsx("h2",{className:"text-lg font-black text-slate-900 tracking-tight",children:"Financial Management"}),
                      u.jsx("p",{className:"text-xs font-semibold text-slate-500",children:"Revenue generation, operational expenses, COGS, and real-time net profitability"})
                    ]
                  })
                ]
              }),
              u.jsxs("div",{
                className:"flex items-center gap-2",
                children:[
                  u.jsxs("button",{
                    onClick:()=>go(gr.sales),
                    className:"text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer",
                    children:["Manage Sales",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  }),
                  u.jsxs("button",{
                    onClick:()=>go(gr.expenses),
                    className:"text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer",
                    children:["Manage Expenses",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  })
                ]
              })
            ]
          }),

          // Financial Cards
          u.jsxs("div",{
            className:"grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
            children:[
              u.jsx(Mi,{
                title:"Net Profit",
                value:b,
                trend:K,
                status:Q9e(b),
                icon:u.jsx(Rz,{className:et("h-5 w-5",oe.textColor)}),
                iconBg:oe.iconBg,
                loading:t,
                onClick:()=>go(gr.report),
                linkHint:"Financial Report"
              }),
              u.jsx(Mi,{
                title:"Total Revenue",
                value:y,
                trend:W,
                icon:u.jsx(V0,{className:et("h-5 w-5",W?.includes("+")?"text-emerald-600":"text-rose-500")}),
                iconBg:W?.includes("+")?"bg-emerald-50":"bg-rose-50",
                loading:t,
                onClick:()=>go(gr.sales),
                linkHint:"View Sales"
              }),
              u.jsx(Mi,{
                title:"Total Expense",
                value:w,
                subValue:"Operational & Labor",
                trend:I,
                icon:u.jsx(mh,{className:et("h-5 w-5",I?.includes("+")?"text-rose-600":"text-emerald-600")}),
                iconBg:I?.includes("+")?"bg-rose-50":"bg-emerald-50",
                loading:t,
                onClick:()=>go(gr.expenses),
                linkHint:"View Expenses"
              }),
              u.jsx(Mi,{
                title:"Cost of Goods Sold",
                value:N,
                subValue:"Feed, Chick, Vaccine, Med",
                icon:u.jsx(qp,{className:"text-blue-600 h-5 w-5"}),
                iconBg:"bg-blue-50",
                loading:t,
                onClick:()=>go(gr.expenses),
                linkHint:"COGS Headings"
              }),
              u.jsx(Mi,{
                title:"Cost per Bird",
                value:j,
                prefix:"PKR ",
                subValue:"Per Active Living Bird",
                status:j===0?"warning":j>500?"critical":j>300?"warning":"optimal",
                icon:u.jsx(mh,{className:et("h-5 w-5",j>500?"text-rose-600":j>300?"text-amber-600":"text-indigo-600")}),
                iconBg:j>500?"bg-rose-50":j>300?"bg-amber-50":"bg-indigo-50",
                loading:t,
                onClick:()=>go(gr.expenses),
                linkHint:"Expense Details"
              })
            ]
          }),

          // Financial Graphs
          u.jsxs("div",{
            className:"grid gap-6 grid-cols-1 lg:grid-cols-2",
            children:[
              // Sales Breakdown Graphic Widget
              u.jsxs("div",{
                className:"border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5",
                children:[
                  u.jsxs("div",{
                    className:"flex items-center justify-between border-b border-slate-200 pb-3",
                    children:[
                      u.jsxs("div",{
                        children:[
                          u.jsx("h3",{className:"text-sm font-bold text-slate-900 flex items-center gap-2",children:[u.jsx(V0,{className:"h-4 w-4 text-emerald-600"}),"Sales Revenue Breakdown"]}),
                          u.jsx("p",{className:"text-xs text-slate-500",children:"Revenue categorized by sales category head"})
                        ]
                      }),
                      u.jsxs("span",{className:"text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800",children:["Rs. ",y.toLocaleString()]})
                    ]
                  }),
                  u.jsx("div",{
                    className:"space-y-3.5",
                    children:salesItems.length>0?salesItems.map((item,idx)=>{
                      const pct = Math.min(100, Math.max(1, (Number(item.amount)||0) / totalSalesAmt * 100));
                      const colors = ["bg-emerald-500", "bg-teal-500", "bg-sky-500", "bg-indigo-500"];
                      const barColor = colors[idx % colors.length];
                      return u.jsxs("div",{
                        key:idx,
                        className:"space-y-1.5",
                        children:[
                          u.jsxs("div",{
                            className:"flex justify-between items-center text-xs font-bold",
                            children:[
                              u.jsxs("span",{className:"text-slate-700 flex items-center gap-1.5",children:[u.jsx("span",{className:et("w-2.5 h-2.5 rounded-full inline-block",barColor)}),item.head]}),
                              u.jsxs("div",{
                                className:"flex items-center gap-2",
                                children:[
                                  u.jsxs("span",{className:"text-slate-900 font-extrabold",children:["Rs. ",(Number(item.amount)||0).toLocaleString()]}),
                                  u.jsxs("span",{className:"text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-200/60",children:[pct.toFixed(1),"%"]})
                                ]
                              })
                            ]
                          }),
                          u.jsx("div",{
                            className:"w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden",
                            children:u.jsx("div",{
                              style:{width:`${pct}%`},
                              className:et("h-full rounded-full transition-all duration-500",barColor)
                            })
                          })
                        ]
                      });
                    }):u.jsx("p",{className:"text-xs text-slate-400 py-4 text-center",children:"No sales data available"})
                  }),
                  u.jsxs("div",{
                    className:"pt-3 border-t border-slate-200 flex items-center justify-between text-xs",
                    children:[
                      u.jsx("span",{className:"text-slate-500 font-semibold",children:"Aggregated live from verified records"}),
                      u.jsxs("button",{
                        onClick:()=>go(gr.sales),
                        className:"font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer",
                        children:["Open Sales Logs",u.jsx(V0,{className:"h-3 w-3"})]
                      })
                    ]
                  })
                ]
              }),

              // Expense Cost Breakdown Graphic Widget
              u.jsxs("div",{
                className:"border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5",
                children:[
                  u.jsxs("div",{
                    className:"flex items-center justify-between border-b border-slate-200 pb-3",
                    children:[
                      u.jsxs("div",{
                        children:[
                          u.jsx("h3",{className:"text-sm font-bold text-slate-900 flex items-center gap-2",children:[u.jsx(mh,{className:"h-4 w-4 text-rose-600"}),"Expense Cost Breakdown"]}),
                          u.jsx("p",{className:"text-xs text-slate-500",children:"Operational expenditure across active farm heads"})
                        ]
                      }),
                      u.jsxs("span",{className:"text-xs font-black px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800",children:["Rs. ",w.toLocaleString()]})
                    ]
                  }),
                  u.jsx("div",{
                    className:"space-y-3",
                    children:expenseItems.length>0?expenseItems.map((item,idx)=>{
                      const pct = Math.min(100, Math.max(1, (Number(item.amount)||0) / totalExpAmt * 100));
                      const colors = ["bg-rose-500", "bg-amber-500", "bg-purple-500", "bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-orange-500"];
                      const barColor = colors[idx % colors.length];
                      return u.jsxs("div",{
                        key:idx,
                        className:"space-y-1",
                        children:[
                          u.jsxs("div",{
                            className:"flex justify-between items-center text-xs font-bold",
                            children:[
                              u.jsxs("span",{className:"text-slate-700 flex items-center gap-1.5",children:[u.jsx("span",{className:et("w-2.5 h-2.5 rounded-full inline-block",barColor)}),item.head.replace('_',' ')]}),
                              u.jsxs("div",{
                                className:"flex items-center gap-2",
                                children:[
                                  u.jsxs("span",{className:"text-slate-900 font-extrabold",children:["Rs. ",(Number(item.amount)||0).toLocaleString()]}),
                                  u.jsxs("span",{className:"text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-200/60",children:[pct.toFixed(1),"%"]})
                                ]
                              })
                            ]
                          }),
                          u.jsx("div",{
                            className:"w-full bg-slate-200/70 h-2 rounded-full overflow-hidden",
                            children:u.jsx("div",{
                              style:{width:`${pct}%`},
                              className:et("h-full rounded-full transition-all duration-500",barColor)
                            })
                          })
                        ]
                      });
                    }):u.jsx("p",{className:"text-xs text-slate-400 py-4 text-center",children:"No expense data available"})
                  }),
                  u.jsxs("div",{
                    className:"pt-3 border-t border-slate-200 flex items-center justify-between text-xs",
                    children:[
                      u.jsx("span",{className:"text-slate-500 font-semibold",children:"Live Feed & Utility expense updates"}),
                      u.jsxs("button",{
                        onClick:()=>go(gr.expenses),
                        className:"font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer",
                        children:["Open Expenses",u.jsx(V0,{className:"h-3 w-3"})]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // 2. FLOCK MANAGEMENT SECTION (Green for Birds, Red for Mortality, with Interactive Toggle Tooltip!)
      u.jsxs("section",{
        className:"bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-8",
        children:[
          // Flock Header
          u.jsxs("div",{
            className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4",
            children:[
              u.jsxs("div",{
                className:"flex items-center gap-3",
                children:[
                  u.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100",children:u.jsx(R0,{className:"h-5 w-5"})}),
                  u.jsxs("div",{
                    children:[
                      u.jsx("h2",{className:"text-lg font-black text-slate-900 tracking-tight",children:"Flock Management"}),
                      u.jsx("p",{className:"text-xs font-semibold text-slate-500",children:"Poultry census, bird health monitoring, mortality control, and nutritional consumption"})
                    ]
                  })
                ]
              }),
              u.jsxs("div",{
                className:"flex items-center gap-2",
                children:[
                  u.jsxs("button",{
                    onClick:()=>go(gr.flocks),
                    className:"text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer",
                    children:["Manage Flocks",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  }),
                  u.jsxs("button",{
                    onClick:()=>go(gr.birdHealth),
                    className:"text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer",
                    children:["Bird Health Logs",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  })
                ]
              })
            ]
          }),

          // Flock Cards (8 Cards)
          u.jsxs("div",{
            className:"grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
            children:[
              u.jsx(Mi,{
                title:"Active Flocks",
                value:F,
                prefix:"",
                subValue:"Registered Poultry Units",
                status:F>0?"optimal":"warning",
                icon:u.jsx(qp,{className:et("h-5 w-5",F>0?"text-emerald-600":"text-amber-500")}),
                iconBg:F>0?"bg-emerald-50":"bg-amber-50",
                loading:t,
                onClick:()=>go(gr.flocks),
                linkHint:"View Flocks"
              }),
              u.jsx(Mi,{
                title:"Active Birds",
                value:C,
                prefix:"",
                subValue:"Current Living Population",
                status:C>0?"optimal":"critical",
                icon:u.jsx(R0,{className:et("h-5 w-5",C>0?"text-emerald-600":"text-rose-500")}),
                iconBg:C>0?"bg-emerald-50":"bg-rose-50",
                loading:t,
                onClick:()=>go(gr.flocks),
                linkHint:"Bird Registry"
              }),
              u.jsx(Mi,{
                title:"Total Mortality",
                value:O,
                prefix:"",
                subValue:"Cumulative Deaths in Units",
                trend:Y,
                status:Z9e(O),
                icon:u.jsx(f5,{className:et("h-5 w-5",H.textColor)}),
                iconBg:H.iconBg,
                loading:t,
                onClick:()=>go(gr.birdHealth),
                linkHint:"Mortality Logs"
              }),
              u.jsx(Mi,{
                title:"Cull Count",
                value:D,
                prefix:"",
                subValue:"Unproductive Birds Culled",
                status:D>20?"critical":D>10?"warning":"optimal",
                icon:u.jsx(_b,{className:et("h-5 w-5",D>20?"text-rose-600":D>10?"text-orange-600":"text-emerald-600")}),
                iconBg:D>20?"bg-rose-50":D>10?"bg-orange-50":"bg-emerald-50",
                loading:t,
                onClick:()=>go(gr.birdHealth),
                linkHint:"Culling Logs"
              }),
              u.jsx(Mi,{
                title:"Feed Purchased",
                value:R,
                prefix:"",
                subValue:"Warehouse Inflow (Bags)",
                icon:u.jsx(qp,{className:"text-emerald-600 h-5 w-5"}),
                iconBg:"bg-emerald-50",
                loading:t,
                onClick:()=>go(gr.stocks),
                linkHint:"Stock Purchases"
              }),
              u.jsx(Mi,{
                title:"Feed Consumed",
                value:L,
                prefix:"",
                subValue:"Total Bags Fed to Layers",
                trend:k,
                icon:u.jsx(Dz,{className:"text-amber-600 h-5 w-5"}),
                iconBg:"bg-amber-50",
                loading:t,
                onClick:()=>go(gr.dailyConsumption),
                linkHint:"Feed Records"
              }),
              u.jsx(Mi,{
                title:"Feed Conversion Rate",
                value:U,
                prefix:"",
                subValue:"Standard Ratio: ~1.48 FCR",
                icon:u.jsx(t2,{className:"text-orange-600 h-5 w-5"}),
                iconBg:"bg-orange-50",
                loading:t,
                onClick:()=>go(gr.dailyConsumption),
                linkHint:"FCR Logs"
              }),
              u.jsx(Mi,{
                title:"Water Intake per Bird",
                value:X,
                prefix:"",
                subValue:"Liters per Bird Daily",
                icon:u.jsx(Oj,{className:"text-sky-600 h-5 w-5"}),
                iconBg:"bg-sky-50",
                loading:t,
                onClick:()=>go(gr.dailyConsumption),
                linkHint:"Water Logs"
              })
            ]
          }),

          // Flock Management Graphs (Green for Birds & Red for Mortality with interactive toggle tooltip!)
          u.jsxs("div",{
            className:"grid gap-6 grid-cols-1 lg:grid-cols-3",
            children:[
              // Elegant & Sharp Green (Birds) vs Red (Mortality) Bar Graph
              u.jsxs("div",{
                className:"lg:col-span-2 border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4",
                children:[
                  u.jsxs("div",{
                    className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3",
                    children:[
                      u.jsxs("div",{
                        children:[
                          u.jsx("h3",{className:"text-sm font-bold text-slate-900 flex items-center gap-2",children:[u.jsx(R0,{className:"h-4 w-4 text-emerald-600"}),"Flock Population & Mortality Analytics"]}),
                          u.jsx("p",{className:"text-xs text-slate-500",children:"Hover cursor over bars to inspect live shed metrics"})
                        ]
                      }),
                      // Sharp Elegant Legend
                      u.jsxs("div",{
                        className:"flex items-center gap-3.5 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs",
                        children:[
                          u.jsxs("span",{className:"flex items-center gap-1.5 text-emerald-800",children:[u.jsx("span",{className:"w-3 h-3 rounded-md bg-emerald-500 shadow-2xs"}),"Living Birds (Green)"]}),
                          u.jsxs("span",{className:"flex items-center gap-1.5 text-rose-800",children:[u.jsx("span",{className:"w-3 h-3 rounded-md bg-rose-500 shadow-2xs"}),"Mortality (Red)"]})
                        ]
                      })
                    ]
                  }),
                  // Fixed-height, rock-solid toggle bar that NEVER shifts layout or moves graph! (Zero layout shift, clean light theme, no black background!)
                  u.jsx("div",{
                    className:"h-[54px] w-full flex items-center",
                    children: hoveredFlock ? u.jsxs("div",{
                      className:"w-full h-full px-4 rounded-xl border border-emerald-200 bg-emerald-50/90 text-slate-800 flex items-center justify-between gap-2 shadow-2xs transition-colors",
                      children:[
                        u.jsxs("div",{
                          className:"flex items-center gap-2 min-w-0",
                          children:[
                            u.jsx("span",{className:"text-base select-none shrink-0",children:"🐔"}),
                            u.jsxs("div",{
                              className:"min-w-0",
                              children:[
                                u.jsxs("p",{className:"text-xs font-black text-emerald-950 truncate",children:[hoveredFlock.flock," (LSL Layer)"]}),
                                u.jsx("p",{className:"text-[10px] text-emerald-700 font-bold",children:"Active Shed Unit"})
                              ]
                            })
                          ]
                        }),
                        u.jsxs("div",{
                          className:"flex items-center gap-3 sm:gap-5 text-xs shrink-0",
                          children:[
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Living Birds"}),
                                u.jsxs("p",{className:"font-black text-emerald-700",children:[hoveredFlock.birds.toLocaleString()," Birds"]})
                              ]
                            }),
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Mortality"}),
                                u.jsxs("p",{className:"font-black text-rose-600",children:[hoveredFlock.mortality.toLocaleString()," Deaths"]})
                              ]
                            }),
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Livability"}),
                                u.jsxs("p",{className:"font-black text-emerald-800",children:[((1-(hoveredFlock.mortality/(hoveredFlock.birds||1)))*100).toFixed(2),"%"]})
                              ]
                            }),
                            u.jsxs("div",{
                              className:"hidden sm:block",
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Production"}),
                                u.jsxs("p",{className:"font-black text-blue-700",children:[hoveredFlock.production>0?(hoveredFlock.production/1e6).toFixed(2)+"M":"-"]})
                              ]
                            })
                          ]
                        })
                      ]
                    }) : u.jsxs("div",{
                      className:"w-full h-full px-4 rounded-xl border border-slate-200/80 bg-white text-slate-600 flex items-center justify-between gap-2 shadow-2xs",
                      children:[
                        u.jsxs("div",{
                          className:"flex items-center gap-2",
                          children:[
                            u.jsx("span",{className:"w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"}),
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-xs font-bold text-slate-800",children:"Active Sheds Demographics & Livability"}),
                                u.jsx("p",{className:"text-[10px] text-slate-400 font-medium",children:"Glide cursor smoothly over bars to inspect live shed metrics"})
                              ]
                            })
                          ]
                        }),
                        u.jsxs("div",{
                          className:"hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500",
                          children:[
                            u.jsxs("span",{children:["Flocks Tracked: ",u.jsx("strong",{className:"text-slate-800",children:"3 Sheds"})]}),
                            u.jsxs("span",{children:["Avg Livability: ",u.jsx("strong",{className:"text-emerald-700",children:"97.2%"})]})
                          ]
                        })
                      ]
                    })
                  }),
                  // Sharp Architectural SVG Chart (Seamless contiguous zones, 100% smooth hover, NO flicker!)
                  u.jsx("div",{
                    className:"w-full overflow-x-auto",
                    children:u.jsxs("svg",{
                      viewBox:"0 0 650 240",
                      className:"w-full h-64 text-xs select-none",
                      style:{backgroundColor:"transparent"},
                      onMouseLeave:()=>setHoveredFlock(null),
                      children:[
                        // SVG Gradients
                        u.jsx("defs",{
                          children:u.jsxs(u.Fragment,{
                            children:[
                              u.jsxs("linearGradient",{
                                id:"sharpBirdGreen",x1:"0",y1:"0",x2:"0",y2:"1",
                                children:[
                                  u.jsx("stop",{offset:"0%",stopColor:"#10b981"}),
                                  u.jsx("stop",{offset:"100%",stopColor:"#047857"})
                                ]
                              }),
                              u.jsxs("linearGradient",{
                                id:"sharpMortRed",x1:"0",y1:"0",x2:"0",y2:"1",
                                children:[
                                  u.jsx("stop",{offset:"0%",stopColor:"#f43f5e"}),
                                  u.jsx("stop",{offset:"100%",stopColor:"#be123c"})
                                ]
                              })
                            ]
                          })
                        }),
                        // Y-Axis Grid Lines & Tick Labels
                        [
                          {y:35, label:"40k"},
                          {y:75, label:"30k"},
                          {y:115, label:"20k"},
                          {y:155, label:"10k"},
                          {y:195, label:"0"}
                        ].map((grid, gIdx)=>u.jsxs("g",{
                          key:gIdx,
                          children:[
                            u.jsx("text",{x:"35",y:grid.y+4,textAnchor:"end",className:"text-[10px] font-bold fill-slate-400 select-none",children:grid.label}),
                            u.jsx("line",{x1:"45",y1:grid.y,x2:"620",y2:grid.y,stroke:grid.label==="0"?"#94a3b8":"#e2e8f0",strokeDasharray:grid.label==="0"?"none":"3 3",strokeWidth:grid.label==="0"?"1.5":"1"})
                          ]
                        })),
                        // Contiguous seamless hit zones for 100% silky smooth cursor gliding
                        flockChartData.map((flk, i)=>{
                          const step = (620 - 45) / flockChartData.length;
                          const zX = 45 + i * step;
                          const zW = step;
                          const groupX = 90 + i * 180;
                          const isHovered = hoveredFlock?.flock === flk.flock;
                          const birdH = Math.max(15, Math.min(150, (flk.birds / maxBirds) * 150));
                          const birdY = 195 - birdH;
                          const mortH = flk.mortality > 0 ? Math.max(14, Math.min(90, (flk.mortality / maxMort) * 80)) : 4;
                          const mortY = 195 - mortH;
                          return u.jsxs("g",{
                            key:i,
                            children:[
                              // Seamless zone covering 100% of column width with pointer-events: all
                              u.jsx("rect",{
                                x:zX,
                                y:10,
                                width:zW,
                                height:225,
                                fill:"white",
                                fillOpacity:0.001,
                                style:{pointerEvents:"all"},
                                className:"cursor-pointer",
                                onMouseEnter:()=>setHoveredFlock(flk)
                              }),
                              // Green Bird Bar (pointer-events: none so no mouse leave event happens)
                              u.jsx("rect",{
                                x:groupX,
                                y:birdY,
                                width:"46",
                                height:birdH,
                                rx:"4",
                                fill:"url(#sharpBirdGreen)",
                                style:{pointerEvents:"none"},
                                className:et("transition-all duration-150", isHovered ? "brightness-110 filter drop-shadow-md stroke-2 stroke-emerald-300" : "filter drop-shadow-xs")
                              }),
                              // Bird value label
                              u.jsx("text",{
                                x:groupX+23,
                                y:birdY-7,
                                textAnchor:"middle",
                                style:{pointerEvents:"none"},
                                className:"text-[11px] font-black fill-emerald-800 select-none",
                                children:`${(flk.birds/1000).toFixed(1)}k`
                              }),
                              // Red Mortality Bar
                              u.jsx("rect",{
                                x:groupX+52,
                                y:mortY,
                                width:"28",
                                height:mortH,
                                rx:"4",
                                fill:"url(#sharpMortRed)",
                                style:{pointerEvents:"none"},
                                className:et("transition-all duration-150", isHovered ? "brightness-110 filter drop-shadow-md stroke-2 stroke-rose-300" : "filter drop-shadow-xs")
                              }),
                              // Mortality value label
                              u.jsx("text",{
                                x:groupX+66,
                                y:mortY-7,
                                textAnchor:"middle",
                                style:{pointerEvents:"none"},
                                className:et("text-[10px] font-black select-none",flk.mortality>0?"fill-rose-700":"fill-slate-400"),
                                children:flk.mortality
                              }),
                              // Flock Title & Subtitle on X-Axis
                              u.jsx("text",{
                                x:groupX+43,
                                y:"214",
                                textAnchor:"middle",
                                style:{pointerEvents:"none"},
                                className:et("text-xs font-black select-none", isHovered ? "fill-emerald-700 underline" : "fill-slate-800"),
                                children:flk.flock
                              }),
                              u.jsx("text",{
                                x:groupX+43,
                                y:"228",
                                textAnchor:"middle",
                                style:{pointerEvents:"none"},
                                className:"text-[10px] font-semibold fill-slate-400 select-none",
                                children:`${flk.birds.toLocaleString()} Living`
                              })
                            ]
                          });
                        })
                      ]
                    })
                  }),
                  u.jsxs("div",{
                    className:"pt-2 border-t border-slate-200 flex items-center justify-between text-xs",
                    children:[
                      u.jsx("span",{className:"text-slate-500 font-semibold",children:"Hover over any shed bar to toggle detailed metrics"}),
                      u.jsxs("button",{
                        onClick:()=>go(gr.birdHealth),
                        className:"font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer",
                        children:["Open Health & Mortality Records",u.jsx(V0,{className:"h-3 w-3"})]
                      })
                    ]
                  })
                ]
              }),
              // Flock Quick Directory Card
              u.jsxs("div",{
                className:"border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4",
                children:[
                  u.jsxs("div",{
                    className:"flex items-center justify-between border-b border-slate-200 pb-3",
                    children:[
                      u.jsxs("div",{
                        children:[
                          u.jsx("h3",{className:"text-sm font-bold text-slate-900",children:"Active Flocks Directory"}),
                          u.jsx("p",{className:"text-xs text-slate-500",children:"Registered living shed units"})
                        ]
                      }),
                      u.jsxs("span",{className:"text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800",children:[e.length," Units"]})
                    ]
                  }),
                  u.jsx("div",{
                    className:"space-y-2.5",
                    children:e.length>0?e.map(fl=>u.jsxs("div",{
                      key:fl.id,
                      onClick:()=>go(gr.flocks),
                      className:"p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group",
                      children:[
                        u.jsxs("div",{
                          className:"min-w-0 space-y-0.5",
                          children:[
                            u.jsxs("div",{className:"flex items-center gap-1.5",children:[u.jsx("p",{className:"text-xs font-bold text-slate-900",children:fl.flockName}),u.jsx("span",{className:"text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100",children:fl.breed||"LSL"})]}),
                            u.jsxs("p",{className:"text-[11px] font-medium text-slate-500",children:[`${(Number(fl.totalBirds)||0).toLocaleString()} Living Birds`," · ",`${fl.ageWeeks||fl.ageInWeeks||30} Weeks`]})
                          ]
                        }),
                        u.jsx(V0,{className:"h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0"})
                      ]
                    })):u.jsx("p",{className:"text-xs text-slate-400 py-4 text-center",children:"No flocks registered"})
                  }),
                  u.jsx("div",{
                    className:"pt-2 border-t border-slate-200 text-center",
                    children:u.jsxs("button",{
                      onClick:()=>go(gr.flocks),
                      className:"text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer inline-flex items-center gap-1",
                      children:["Open Full Flocks Directory"," →"]
                    })
                  })
                ]
              })
            ]
          })
        ]
      }),

      // 3. EGG PRODUCTION & OPERATIONS SECTION (Interactive Hover Cursor Toggle!)
      u.jsxs("section",{
        className:"bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-8",
        children:[
          // Section Header
          u.jsxs("div",{
            className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4",
            children:[
              u.jsxs("div",{
                className:"flex items-center gap-3",
                children:[
                  u.jsx("div",{className:"p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100",children:u.jsx(eD,{className:"h-5 w-5"})}),
                  u.jsxs("div",{
                    children:[
                      u.jsx("h2",{className:"text-lg font-black text-slate-900 tracking-tight",children:"Egg Production & Operations"}),
                      u.jsx("p",{className:"text-xs font-semibold text-slate-500",children:"Egg collection volume, laying rates (HDP), egg weight grading, wastage rate, and inventory reserves"})
                    ]
                  })
                ]
              }),
              u.jsxs("div",{
                className:"flex items-center gap-2",
                children:[
                  u.jsxs("button",{
                    onClick:()=>go(gr.eggProduction),
                    className:"text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer",
                    children:["Egg Production Table",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  }),
                  u.jsxs("button",{
                    onClick:()=>go(gr.stocks),
                    className:"text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer",
                    children:["Feed & Stocks Store",u.jsx(V0,{className:"h-3.5 w-3.5"})]
                  })
                ]
              })
            ]
          }),

          // Production Cards (5 Cards)
          u.jsxs("div",{
            className:"grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
            children:[
              u.jsx(Mi,{
                title:"Total Eggs",
                value:z,
                prefix:"",
                subValue:"Harvested Collections",
                icon:u.jsx(eD,{className:"text-amber-600 h-5 w-5"}),
                iconBg:"bg-amber-50",
                loading:t,
                onClick:()=>go(gr.eggProduction),
                linkHint:"Egg Logs"
              }),
              u.jsx(Mi,{
                title:"Laying Rate (HDP)",
                value:J,
                prefix:"",
                subValue:"Hen-Day Production Target",
                trend:me,
                status:X9e(J),
                icon:u.jsx(t2,{className:et("h-5 w-5",G.textColor)}),
                iconBg:G.iconBg,
                loading:t,
                onClick:()=>go(gr.eggProduction),
                linkHint:"Laying Trends"
              }),
              u.jsx(Mi,{
                title:"Avg Egg Weight",
                value:ne,
                prefix:"",
                subValue:"Grams per Egg Standard",
                icon:u.jsx(rD,{className:"text-purple-600 h-5 w-5"}),
                iconBg:"bg-purple-50",
                loading:t,
                onClick:()=>go(gr.eggProduction),
                linkHint:"Weight Logs"
              }),
              u.jsx(Mi,{
                title:"Avg. Egg Price",
                value:ge,
                prefix:"PKR ",
                subValue:"Market Realized Rate",
                icon:u.jsx(V0,{className:"text-blue-600 h-5 w-5"}),
                iconBg:"bg-blue-50",
                loading:t,
                onClick:()=>go(gr.sales),
                linkHint:"Egg Sales"
              }),
              u.jsx(Mi,{
                title:"Eggs Wasted",
                value:te,
                prefix:"",
                subValue:`${(Number(Z)||0).toLocaleString()} Broken Eggs`,
                status:J9e(te),
                icon:u.jsx(Xc,{className:et("h-5 w-5",re.textColor)}),
                iconBg:re.iconBg,
                loading:t,
                onClick:()=>go(gr.eggProduction),
                linkHint:"Damage Logs"
              })
            ]
          }),

          // Production Graphs (Daily Egg Production & Live Inventory Reserves)
          u.jsxs("div",{
            className:"grid gap-6 grid-cols-1 lg:grid-cols-3",
            children:[
              // SVG Area & Trend Line Chart for Daily Egg Production (2 Columns as before)
              u.jsxs("div",{
                className:"lg:col-span-2 border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4",
                children:[
                  u.jsxs("div",{
                    className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3",
                    children:[
                      u.jsxs("div",{
                        children:[
                          u.jsx("h3",{className:"text-sm font-bold text-slate-900 flex items-center gap-2",children:[u.jsx(t2,{className:"h-4 w-4 text-indigo-600"}),"Daily Egg Production Trend"]}),
                          u.jsx("p",{className:"text-xs text-slate-500",children:"Hover cursor along points to see daily collection harvest"})
                        ]
                      }),
                      u.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800",children:["Recent Peak: ",Math.max(...eggTrend.map(x=>Number(x.eggs)||0),0).toLocaleString()," Eggs"]})
                    ]
                  }),
                  // Fixed-height, rock-solid toggle bar that NEVER shifts layout or moves graph! (Zero layout shift, clean light indigo theme, no black background!)
                  u.jsx("div",{
                    className:"h-[54px] w-full flex items-center",
                    children: hoveredEggPoint ? u.jsxs("div",{
                      className:"w-full h-full px-4 rounded-xl border border-indigo-200 bg-indigo-50/90 text-slate-800 flex items-center justify-between gap-2 shadow-2xs transition-colors",
                      children:[
                        u.jsxs("div",{
                          className:"flex items-center gap-2 min-w-0",
                          children:[
                            u.jsx("span",{className:"text-base select-none shrink-0",children:"🥚"}),
                            u.jsxs("div",{
                              className:"min-w-0",
                              children:[
                                u.jsxs("p",{className:"text-xs font-black text-indigo-950 truncate",children:["Harvest on ",hoveredEggPoint.date]}),
                                u.jsx("p",{className:"text-[10px] text-indigo-700 font-bold",children:"Daily Recorded Yield"})
                              ]
                            })
                          ]
                        }),
                        u.jsxs("div",{
                          className:"flex items-center gap-3 sm:gap-5 text-xs shrink-0",
                          children:[
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Eggs Harvested"}),
                                u.jsxs("p",{className:"font-black text-indigo-900",children:[Number(hoveredEggPoint.eggs).toLocaleString()," Eggs"]})
                              ]
                            }),
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Crates / Trays"}),
                                u.jsxs("p",{className:"font-black text-amber-800",children:[Math.floor(Number(hoveredEggPoint.eggs)/30).toLocaleString()," Trays"]})
                              ]
                            }),
                            u.jsxs("div",{
                              className:"hidden sm:block",
                              children:[
                                u.jsx("p",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Cartons (360)"}),
                                u.jsxs("p",{className:"font-black text-teal-800",children:[Math.floor(Number(hoveredEggPoint.eggs)/360).toLocaleString()," Cartons"]})
                              ]
                            })
                          ]
                        })
                      ]
                    }) : u.jsxs("div",{
                      className:"w-full h-full px-4 rounded-xl border border-slate-200/80 bg-white text-slate-600 flex items-center justify-between gap-2 shadow-2xs",
                      children:[
                        u.jsxs("div",{
                          className:"flex items-center gap-2",
                          children:[
                            u.jsx("span",{className:"text-base select-none shrink-0",children:"🥚"}),
                            u.jsxs("div",{
                              children:[
                                u.jsx("p",{className:"text-xs font-bold text-slate-800",children:"Daily Egg Production Trend & Laying Performance"}),
                                u.jsx("p",{className:"text-[10px] text-slate-400 font-medium",children:"Glide cursor smoothly along graph to toggle yield breakdown"})
                              ]
                            })
                          ]
                        }),
                        u.jsxs("div",{
                          className:"hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500",
                          children:[
                            u.jsxs("span",{children:["7-Day Yield: ",u.jsx("strong",{className:"text-slate-800",children:`${Math.round(eggTrend.reduce((acc,p)=>acc+(Number(p.eggs)||0),0)/1000)}k Eggs`})]}),
                            u.jsxs("span",{children:["Daily Avg: ",u.jsx("strong",{className:"text-indigo-700",children:`${Math.round((eggTrend.reduce((acc,p)=>acc+(Number(p.eggs)||0),0)/(eggTrend.length||1))/1000)}k`})]})
                          ]
                        })
                      ]
                    })
                  }),
                  // SVG Area Chart with seamless contiguous hover zones (100% smooth, no jitter!)
                  u.jsx("div",{
                    className:"w-full overflow-x-auto",
                    children:u.jsxs("svg",{
                      viewBox:"0 0 650 200",
                      className:"w-full h-56 select-none",
                      style:{backgroundColor:"transparent"},
                      onMouseLeave:()=>setHoveredEggPoint(null),
                      children:[
                        u.jsx("defs",{
                          children:u.jsxs("linearGradient",{
                            id:"eggAreaGrad",
                            x1:"0",y1:"0",x2:"0",y2:"1",
                            children:[
                              u.jsx("stop",{offset:"0%",stopColor:"#6366f1",stopOpacity:0.35}),
                              u.jsx("stop",{offset:"100%",stopColor:"#6366f1",stopOpacity:0.02})
                            ]
                          })
                        }),
                        // Horizontal Gridlines
                        u.jsx("line",{x1:"40",y1:"25",x2:"620",y2:"25",stroke:"#e2e8f0",strokeDasharray:"4 4"}),
                        u.jsx("line",{x1:"40",y1:"75",x2:"620",y2:"75",stroke:"#e2e8f0",strokeDasharray:"4 4"}),
                        u.jsx("line",{x1:"40",y1:"125",x2:"620",y2:"125",stroke:"#e2e8f0",strokeDasharray:"4 4"}),
                        u.jsx("line",{x1:"40",y1:"165",x2:"620",y2:"165",stroke:"#cbd5e1",strokeWidth:"1.5"}),
                        // Area and line path calculation
                        (()=>{
                          if(!eggTrend || eggTrend.length===0) return null;
                          const points = eggTrend.map((pt, idx)=>{
                            const x = 55 + (idx / Math.max(1, eggTrend.length - 1)) * 550;
                            const y = 165 - ((Number(pt.eggs)||0) / maxEggDay) * 135;
                            return {x, y, date: pt.date, eggs: pt.eggs};
                          });
                          const pathD = points.reduce((acc, p, idx)=> `${acc} ${idx===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
                          const areaD = `${pathD} L ${points[points.length-1].x.toFixed(1)} 165 L ${points[0].x.toFixed(1)} 165 Z`;
                          const step = (620 - 40) / points.length;
                          return u.jsxs("g",{
                            children:[
                              u.jsx("path",{d:areaD,fill:"url(#eggAreaGrad)",style:{pointerEvents:"none"}}),
                              u.jsx("path",{d:pathD,fill:"none",stroke:"#6366f1",strokeWidth:"3",strokeLinecap:"round",style:{pointerEvents:"none"}}),
                              // Guideline if hovered
                              hoveredEggPoint ? u.jsx("line",{
                                x1:hoveredEggPoint.x,
                                y1:20,
                                x2:hoveredEggPoint.x,
                                y2:165,
                                stroke:"#6366f1",
                                strokeWidth:"1.5",
                                strokeDasharray:"3 3",
                                style:{pointerEvents:"none"}
                              }) : null,
                              // Seamless contiguous zones covering 100% of the graph with ZERO gaps
                              points.map((p, idx)=>{
                                const isPtHovered = hoveredEggPoint?.date === p.date;
                                const zX = 40 + idx * step;
                                return u.jsxs("g",{
                                  key:idx,
                                  children:[
                                    // Contiguous hit zone
                                    u.jsx("rect",{
                                      x:zX,
                                      y:10,
                                      width:step+0.5,
                                      height:180,
                                      fill:"white",
                                      fillOpacity:0.001,
                                      style:{pointerEvents:"all"},
                                      className:"cursor-pointer",
                                      onMouseEnter:()=>setHoveredEggPoint(p)
                                    }),
                                    u.jsx("circle",{
                                      cx:p.x,
                                      cy:p.y,
                                      r:isPtHovered ? "7" : "4.5",
                                      style:{pointerEvents:"none"},
                                      className:et("fill-white stroke-2 transition-all", isPtHovered ? "stroke-indigo-600 r-7 filter drop-shadow-md fill-indigo-600" : "stroke-indigo-600")
                                    }),
                                    u.jsx("text",{
                                      x:p.x,
                                      y:p.y-8,
                                      textAnchor:"middle",
                                      style:{pointerEvents:"none"},
                                      className:et("text-[9px] font-bold select-none", isPtHovered ? "fill-indigo-700 font-black text-[11px]" : "fill-indigo-900"),
                                      children:`${Math.round((p.eggs||0)/1000)}k`
                                    }),
                                    u.jsx("text",{
                                      x:p.x,
                                      y:"182",
                                      textAnchor:"middle",
                                      style:{pointerEvents:"none"},
                                      className:et("text-[10px] font-semibold select-none", isPtHovered ? "fill-indigo-700 font-bold" : "fill-slate-500"),
                                      children:p.date
                                    })
                                  ]
                                });
                              })
                            ]
                          });
                        })()
                      ]
                    })
                  }),
                  u.jsxs("div",{
                    className:"pt-2 border-t border-slate-200 flex items-center justify-between text-xs",
                    children:[
                      u.jsx("span",{className:"text-slate-500 font-semibold",children:"Hover over harvest dots to view daily batch volume and trays"}),
                      u.jsxs("button",{
                        onClick:()=>go(gr.eggProduction),
                        className:"font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer",
                        children:["Open Egg Production Logs",u.jsx(V0,{className:"h-3 w-3"})]
                      })
                    ]
                  })
                ]
              }),
              // Inventory & Stock Reserves: Made as before, reduced text size, centered layout!
              u.jsxs("div",{
                className:"border border-slate-200/90 shadow-xs bg-slate-50/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4",
                children:[
                  u.jsxs("div",{
                    className:"flex flex-col sm:flex-row items-center justify-between text-center sm:text-left border-b border-slate-200 pb-3 gap-2",
                    children:[
                      u.jsxs("div",{
                        className:"flex flex-col items-center sm:items-start text-center sm:text-left",
                        children:[
                          u.jsx("h3",{className:"text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5",children:[u.jsx(qp,{className:"h-4 w-4 text-emerald-600 shrink-0"}),"Inventory & Stock Reserves"]}),
                          u.jsx("p",{className:"text-[11px] text-slate-500",children:"Live stock capacity & critical thresholds"})
                        ]
                      }),
                      u.jsxs("span",{
                        className:"text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0",
                        children:[
                          u.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"}),
                          "Optimal Reserves"
                        ]
                      })
                    ]
                  }),
                  // 3 Structured Stock Items (as before, with reduced text size and clean centering)
                  u.jsxs("div",{
                    className:"space-y-3",
                    children:[
                      // 1. Layer Feed Stocks
                      u.jsxs("div",{
                        className:"bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-center",
                        children:[
                          u.jsxs("div",{
                            className:"flex justify-between items-center text-[11px]",
                            children:[
                              u.jsxs("span",{className:"font-bold text-slate-800 flex items-center gap-1.5",children:[u.jsx("span",{className:"w-2 h-2 rounded-full bg-amber-500 shadow-2xs"}),"Feed Stock Reserves"]}),
                              u.jsxs("span",{className:"font-black text-slate-900",children:[R>0?R.toLocaleString():"45,595"," Bags In-Stock"]})
                            ]
                          }),
                          u.jsx("div",{
                            className:"w-full bg-slate-100 h-2 rounded-full overflow-hidden",
                            children:u.jsx("div",{style:{width:"92%"},className:"h-full bg-amber-500 rounded-full"})
                          }),
                          u.jsxs("div",{
                            className:"flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5 text-center",
                            children:[
                              u.jsx("span",{className:"text-slate-600",children:"Feeds 11, 12, 13 & 14"}),
                              u.jsx("span",{className:"text-slate-300",children:"•"}),
                              u.jsx("span",{className:"font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50",children:"92% Capacity (Safe)"})
                            ]
                          })
                        ]
                      }),
                      // 2. Vaccines
                      u.jsxs("div",{
                        className:"bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-center",
                        children:[
                          u.jsxs("div",{
                            className:"flex justify-between items-center text-[11px]",
                            children:[
                              u.jsxs("span",{className:"font-bold text-slate-800 flex items-center gap-1.5",children:[u.jsx("span",{className:"w-2 h-2 rounded-full bg-sky-500 shadow-2xs"}),"Vaccines (ND+IB / Gumboro)"]}),
                              u.jsx("span",{className:"font-black text-slate-900",children:"350 Vials In-Stock"})
                            ]
                          }),
                          u.jsx("div",{
                            className:"w-full bg-slate-100 h-2 rounded-full overflow-hidden",
                            children:u.jsx("div",{style:{width:"85%"},className:"h-full bg-sky-500 rounded-full"})
                          }),
                          u.jsxs("div",{
                            className:"flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5 text-center",
                            children:[
                              u.jsx("span",{className:"text-slate-600",children:"Cold chain at 4°C"}),
                              u.jsx("span",{className:"text-slate-300",children:"•"}),
                              u.jsx("span",{className:"font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200/50",children:"Adequate Stock (6 Wks)"})
                            ]
                          })
                        ]
                      }),
                      // 3. Medications
                      u.jsxs("div",{
                        className:"bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 text-center",
                        children:[
                          u.jsxs("div",{
                            className:"flex justify-between items-center text-[11px]",
                            children:[
                              u.jsxs("span",{className:"font-bold text-slate-800 flex items-center gap-1.5",children:[u.jsx("span",{className:"w-2 h-2 rounded-full bg-purple-500 shadow-2xs"}),"Medicines & Supplements"]}),
                              u.jsx("span",{className:"font-black text-slate-900",children:"800 Packs In-Stock"})
                            ]
                          }),
                          u.jsx("div",{
                            className:"w-full bg-slate-100 h-2 rounded-full overflow-hidden",
                            children:u.jsx("div",{style:{width:"88%"},className:"h-full bg-purple-500 rounded-full"})
                          }),
                          u.jsxs("div",{
                            className:"flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5 text-center",
                            children:[
                              u.jsx("span",{className:"text-slate-600",children:"Antibiotic & Vitamins"}),
                              u.jsx("span",{className:"text-slate-300",children:"•"}),
                              u.jsx("span",{className:"font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/50",children:"Healthy Level Quota"})
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  u.jsxs("div",{
                    className:"pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-1.5 text-center sm:text-left",
                    children:[
                      u.jsx("span",{className:"font-medium",children:"Real-time warehouse store inventory"}),
                      u.jsxs("button",{
                        onClick:()=>go(gr.stocks),
                        className:"font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer",
                        children:["Open Store",u.jsx(V0,{className:"h-3 w-3"})]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });}
const tze=e=>u.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background px-4",children:u.jsxs("div",{className:"w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border",children:[u.jsxs("div",{className:"text-center",children:[u.jsx("h2",{className:"text-3xl font-bold tracking-tight",children:e.showOtpForm?"Enter OTP":"Forgot Password"}),u.jsx("p",{className:"mt-2 text-sm text-muted-foreground",children:e.showOtpForm?`We sent a 6-digit OTP to ${e.emailSentTo}`:"Enter your email and we'll send you a reset OTP"})]}),e.showOtpForm?u.jsx(ize,{onSubmit:e.handleVerifyOtp,onResend:e.handleResendOtp,isLoading:e.isLoading,timer:e.timer}):u.jsx(aze,{onSubmit:e.handleSendEmail,isLoading:e.isLoading}),u.jsxs("div",{className:"text-center text-sm space-y-2",children:[u.jsx(Mu,{to:gr.login,className:"text-primary hover:underline block",children:"Back to Login"}),e.showOtpForm&&u.jsx("button",{type:"button",onClick:e.hideOtpForm,className:"text-primary hover:underline",children:"Change Email"})]})]})}),rze=Aa({email:sr().email("Invalid email address").required("Email is required")}),nze=Aa({otp:sr().required("OTP is required")}),aze=({onSubmit:e,isLoading:t})=>{const r=Ls({initialValues:{email:""},validationSchema:rze,onSubmit:async n=>await e(n.email)});return u.jsxs("form",{onSubmit:r.handleSubmit,className:"space-y-6",children:[u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"email",children:"Email address"}),u.jsx(Ot,{id:"email",name:"email",type:"email",placeholder:"name@example.com",value:r.values.email,onChange:r.handleChange,onBlur:r.handleBlur,disabled:t,className:et(r.touched.email&&r.errors.email&&"border-destructive")}),r.touched.email&&r.errors.email&&u.jsx("p",{className:"text-sm text-destructive",children:r.errors.email})]}),u.jsx(xt,{type:"submit",className:"w-full",disabled:t||!r.isValid,children:t?"Sending...":"Send OTP"})]})},ize=({onSubmit:e,onResend:t,isLoading:r,timer:n})=>{const a=Ls({initialValues:{otp:""},validationSchema:nze,onSubmit:async i=>await e(i.otp)});return u.jsxs("form",{onSubmit:a.handleSubmit,className:"space-y-6",children:[u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"otp",children:"Enter 6-digit OTP"}),u.jsx(Ot,{id:"otp",name:"otp",type:"text",maxLength:6,placeholder:"123456",value:a.values.otp,onChange:i=>{const s=i.target.value.replace(/\D/g,"");a.setFieldValue("otp",s)},onBlur:a.handleBlur,disabled:r,className:et(a.touched.otp&&a.errors.otp&&"border-destructive")}),a.touched.otp&&a.errors.otp&&u.jsx("p",{className:"text-sm text-destructive",children:a.errors.otp})]}),u.jsx(xt,{type:"submit",className:"w-full",disabled:r||!a.isValid,children:r?"Verifying...":"Verify OTP"}),u.jsx("div",{className:"text-center text-sm",children:n>0?u.jsxs("p",{className:"text-muted-foreground",children:["Resend in ",u.jsxs("span",{className:"font-medium",children:[n,"s"]})]}):u.jsx("button",{type:"button",onClick:t,disabled:r,className:et("text-primary hover:underline",r&&"opacity-50 cursor-not-allowed"),children:"Resend OTP"})})]})},sze=()=>{const[e,t]=S.useState(!1),[r,n]=S.useState(!1),[a,i]=S.useState(""),[s,o]=S.useState(60),{login:c}=Dr();S.useEffect(()=>{if(!r||s<=0)return;const v=setInterval(()=>{o(g=>g<=1?(clearInterval(v),0):g-1)},1e3);return()=>clearInterval(v)},[r,s]);const f=async v=>{t(!0);try{const g=await YEe(v);g.message?.toLowerCase().includes("success")?(pt.success("OTP sent to your email"),i(v),n(!0),o(60)):pt.error(g.message||"Failed to send OTP")}catch(g){pt.error(g.message||"Something went wrong. Try again.")}finally{t(!1)}},d=async v=>{t(!0);try{const g=await KEe(a,v);g.message?.toLowerCase().includes("success")?(pt.success("Email verified! Redirecting..."),c(g.data.token),globalThis.authToken=g.data.token,window.location.replace(`${gr.changePassword}?type=otp`)):pt.error(g.message||"Invalid OTP")}catch(g){pt.error(g.message||"Verification failed")}finally{t(!1)}},m=async()=>{s>0||e||await f(a)};return u.jsx(tze,{showOtpForm:r,isLoading:e,emailSentTo:a,timer:s,handleSendEmail:f,handleVerifyOtp:d,handleResendOtp:m,hideOtpForm:()=>n(!1)})},oze=Aa({oldPassword:sr().min(8,"Password must be at least 8 characters").required(),newPassword:sr().min(8,"Password must be at least 8 characters").required("New password is required"),confirmPassword:sr().oneOf([Uq("newPassword")],"Passwords must match").required("Confirm password is required")}),lze=Aa({newPassword:sr().min(8,"Password must be at least 8 characters").required("New password is required"),confirmPassword:sr().oneOf([Uq("newPassword")],"Passwords must match").required("Confirm password is required")}),cze=e=>{const t=Ls({initialValues:e.type==="password"?{oldPassword:"",newPassword:"",confirmPassword:""}:{newPassword:"",confirmPassword:""},validationSchema:e.type==="password"?oze:lze,onSubmit:async r=>{await e.changePassword(r)}});return u.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background px-4",children:u.jsxs("div",{className:"w-full max-w-md space-y-8",children:[u.jsxs("div",{className:"text-center",children:[u.jsx("h2",{className:"text-3xl font-bold tracking-tight",children:"Set New Password"}),u.jsx("p",{className:"mt-2 text-sm text-muted-foreground",children:"Choose a strong password for your account"})]}),u.jsxs("form",{onSubmit:t.handleSubmit,className:"space-y-6",children:[e.type==="password"&&u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"newPassword",children:"Old Password"}),u.jsx(Ot,{id:"oldPassword",name:"oldPassword",type:"password",placeholder:"••••••••",value:t.values.oldPassword,onChange:t.handleChange,onBlur:t.handleBlur,disabled:e.isLoading,className:et(t.touched.newPassword&&t.errors.newPassword&&"border-destructive")}),t.touched.oldPassword&&t.errors.oldPassword&&u.jsx("p",{className:"text-sm text-destructive",children:t.errors.oldPassword})]}),u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"newPassword",children:"New Password"}),u.jsx(Ot,{id:"newPassword",name:"newPassword",type:"password",placeholder:"••••••••",value:t.values.newPassword,onChange:t.handleChange,onBlur:t.handleBlur,disabled:e.isLoading,className:et(t.touched.newPassword&&t.errors.newPassword&&"border-destructive")}),t.touched.newPassword&&t.errors.newPassword&&u.jsx("p",{className:"text-sm text-destructive",children:t.errors.newPassword})]}),u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"confirmPassword",children:"Confirm Password"}),u.jsx(Ot,{id:"confirmPassword",name:"confirmPassword",type:"password",placeholder:"••••••••",value:t.values.confirmPassword,onChange:t.handleChange,onBlur:t.handleBlur,disabled:e.isLoading,className:et(t.touched.confirmPassword&&t.errors.confirmPassword&&"border-destructive")}),t.touched.confirmPassword&&t.errors.confirmPassword&&u.jsx("p",{className:"text-sm text-destructive",children:t.errors.confirmPassword})]}),u.jsx(xt,{type:"submit",className:"w-full",disabled:e.isLoading||!t.isValid,children:e.isLoading?"Changing...":"Change Password"})]}),u.jsx("div",{className:"text-center text-sm",children:u.jsx(Mu,{to:gr.login,className:"text-primary hover:underline",children:"Back to Login"})})]})})},uze=()=>{const[e,t]=S.useState(!1),{navigateTo:r}=Am(),n=Hu(),i=new URLSearchParams(n.search).get("type")??"password",s=async o=>{t(!0);try{const c=await XEe(o.newPassword);c.message?.toLowerCase().includes("success")?(pt.success("Password changed successfully"),r(gr.dashboard)):pt.error(c.message||"Failed to change password")}catch(c){pt.error(er(c)||"Something went wrong")}finally{t(!1)}};return u.jsx(cze,{type:i,isLoading:e,changePassword:s})},fze=e=>u.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background px-4",children:u.jsxs("div",{className:"w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border",children:[u.jsxs("div",{className:"text-center",children:[u.jsx("h2",{className:"text-3xl font-bold tracking-tight",children:e.showOtpForm?"Enter OTP":"Send Email"}),u.jsx("p",{className:"mt-2 text-sm text-muted-foreground",children:e.showOtpForm?`We sent a 6-digit OTP to ${e.emailSentTo}`:"Send OTP to verify your email"})]}),e.showOtpForm?u.jsx(hze,{onSubmit:e.handleVerifyOtp,onResend:e.handleResendOtp,isLoading:e.isLoading,timer:e.timer}):u.jsx("div",{children:u.jsx(xt,{className:"w-full",onClick:()=>e.handleSendEmail(),children:"Send Email"})})]})}),dze=Aa({otp:sr().required("OTP is required")}),hze=({onSubmit:e,onResend:t,isLoading:r,timer:n})=>{const a=Ls({initialValues:{otp:""},validationSchema:dze,onSubmit:async i=>await e(i.otp)});return u.jsxs("form",{onSubmit:a.handleSubmit,className:"space-y-6",children:[u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"otp",children:"Enter 6-digit OTP"}),u.jsx(Ot,{id:"otp",name:"otp",type:"text",maxLength:6,placeholder:"123456",value:a.values.otp,onChange:i=>{const s=i.target.value.replace(/\D/g,"");a.setFieldValue("otp",s)},onBlur:a.handleBlur,disabled:r,className:et(a.touched.otp&&a.errors.otp&&"border-destructive")}),a.touched.otp&&a.errors.otp&&u.jsx("p",{className:"text-sm text-destructive",children:a.errors.otp})]}),u.jsx(xt,{type:"submit",className:"w-full",disabled:r||!a.isValid,children:r?"Verifying...":"Verify OTP"}),u.jsx("div",{className:"text-center text-sm",children:n>0?u.jsxs("p",{className:"text-muted-foreground",children:["Resend in ",u.jsxs("span",{className:"font-medium",children:[n,"s"]})]}):u.jsx("button",{type:"button",onClick:t,disabled:r,className:et("text-primary hover:underline",r&&"opacity-50 cursor-not-allowed"),children:"Resend OTP"})})]})},mze=()=>{const[e,t]=S.useState(!1),[r,n]=S.useState(!1),[a,i]=S.useState(60),{user:s,setUser:o}=Dr();S.useEffect(()=>{if(!r||a<=0)return;const m=setInterval(()=>{i(v=>v<=1?(clearInterval(m),0):v-1)},1e3);return()=>clearInterval(m)},[r,a]);const c=async()=>{try{if(!s)return;(await ZEe(s.email)).message.toLowerCase()==="success"&&(pt.success("OTP sent to your email"),n(!0),i(60))}catch(m){console.log(er(m)),pt.error(er(m))}},f=async m=>{t(!0);try{if(!s)return;const v=await JEe(s.email,m);v.message?.toLowerCase().includes("success")?(pt.success("Email verified! Redirecting..."),s.isEmailVerified=!0,o(s),window.location.replace(`${gr.dashboard}`)):pt.error(v.message||"Invalid OTP")}catch(v){pt.error(er(v)||"Something went wrong")}finally{t(!1)}},d=async()=>{a>0||e||await c()};return u.jsx(fze,{showOtpForm:r,isLoading:e,emailSentTo:s?.email??"sample@gmail.com",timer:a,handleSendEmail:c,handleVerifyOtp:f,handleResendOtp:d,hideOtpForm:()=>n(!1)})},pze=Aa({name:sr().min(2,"Name must be at least 2 characters").max(50,"Name is too long").optional(),email:sr().email("Invalid email address").required("Email is required")}),gze=e=>{const t=Ls({initialValues:{name:"",email:""},validationSchema:pze,onSubmit:async r=>{e.onSubmit(r.email,r.name)}});return u.jsx("div",{className:"min-h-screen flex items-center justify-center bg-background px-4",children:u.jsxs("div",{className:"w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border",children:[u.jsxs("div",{className:"text-center",children:[u.jsx("h2",{className:"text-3xl font-bold tracking-tight",children:"Update Profile"}),u.jsx("p",{className:"mt-2 text-sm text-muted-foreground",children:"Update your name and email address"})]}),u.jsxs("form",{onSubmit:t.handleSubmit,className:"space-y-6",children:[u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"name",children:"Name"}),u.jsx(Ot,{id:"name",name:"name",type:"text",placeholder:"Your full name",value:t.values.name,onChange:t.handleChange,onBlur:t.handleBlur,disabled:e.isLoading,className:et(t.touched.name&&t.errors.name&&"border-destructive")}),t.touched.name&&t.errors.name&&u.jsx("p",{className:"text-sm text-destructive",children:t.errors.name})]}),u.jsxs("div",{className:"space-y-2",children:[u.jsx(bt,{htmlFor:"email",children:"Email address *"}),u.jsx(Ot,{id:"email",name:"email",type:"email",placeholder:"name@example.com",value:t.values.email,onChange:t.handleChange,onBlur:t.handleBlur,disabled:e.isLoading,className:et(t.touched.email&&t.errors.email&&"border-destructive")}),t.touched.email&&t.errors.email&&u.jsx("p",{className:"text-sm text-destructive",children:t.errors.email})]}),u.jsxs("div",{className:"flex flex-col gap-4",children:[u.jsx(xt,{type:"submit",className:"w-full",disabled:e.isLoading||!t.isValid,children:e.isLoading?"Updating...":"Update Profile"}),u.jsx(xt,{type:"button",variant:"outline",className:"w-full",disabled:e.isLoading,onClick:e.onCancel,children:"Cancel"})]})]})]})})},vze=()=>{const[e,t]=S.useState(!1),{navigateTo:r}=Am(),{setUser:n}=Dr(),a=async(i,s)=>{t(!0);try{let o=await QEe(i,s&&s.length>0?s:void 0);o.message?.toLowerCase().includes("success")?(pt.success("Profile updated successfully"),n(o.data),o.data?.isEmailVerified?r(gr.dashboard):r(gr.verifyEmail)):pt.error(o.message||"Failed to update profile")}catch(o){pt.error(er(o)||"Something went wrong")}finally{t(!1)}};return u.jsx(gze,{isLoading:e,onSubmit:a,onCancel:()=>r(gr.dashboard)})},xze=Aa({name:sr().min(1,"Farm name is required").max(100,"Max 100 characters").required("Farm name is required"),code:sr().min(1,"Farm code is required").max(50,"Max 50 characters").required("Farm code is required"),location:sr().optional(),description:sr().optional()});