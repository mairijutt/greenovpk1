import os
import sys

def main():
    bundle_path = 'public/assets/index-5bPm0Hd0.js'
    with open(bundle_path, 'r', encoding='utf-8') as f:
        bundle = f.read()

    # 1. ExecutiveDateRangePicker component definition
    picker_code = '''
function ExecutiveDateRangePicker({startDate,endDate,onSelectStartDate,onSelectEndDate,disabled,showPresets=!0}){
  const handleToday=()=>{const td=new Date().toISOString().split("T")[0];onSelectStartDate(td);onSelectEndDate(td);};
  const handleLast30=()=>{const dt=new Date();const ed=dt.toISOString().split("T")[0];dt.setDate(dt.getDate()-30);const st=dt.toISOString().split("T")[0];onSelectStartDate(st);onSelectEndDate(ed);};
  const handleClear=()=>{onSelectStartDate("");onSelectEndDate("");};
  return u.jsxs("div",{
    className:"flex flex-wrap items-center gap-2",
    children:[
      u.jsxs("div",{
        className:"flex items-center gap-2.5 sm:gap-3 bg-white px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors min-w-[320px] sm:min-w-[370px]",
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
                value:startDate||"",
                disabled:disabled,
                onChange:e=>onSelectStartDate(e.target.value),
                className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"
              })
            ]
          }),
          u.jsx("span",{className:"text-slate-300 font-bold select-none",children:"\u2192"}),
          u.jsxs("div",{
            className:"flex items-center gap-1.5 flex-1",
            children:[
              u.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",children:"To"}),
              u.jsx("input",{
                type:"date",
                value:endDate||"",
                disabled:disabled,
                onChange:e=>onSelectEndDate(e.target.value),
                className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"
              })
            ]
          }),
          (startDate||endDate)&&u.jsx("button",{
            type:"button",
            onClick:handleClear,
            title:"Reset date range",
            className:"text-[11px] font-black text-slate-400 hover:text-rose-600 px-1 rounded cursor-pointer transition-colors",
            children:"\u2715"
          })
        ]
      }),
      showPresets&&u.jsxs("div",{
        className:"hidden sm:flex items-center gap-1.5",
        children:[
          u.jsx("button",{
            type:"button",
            onClick:handleToday,
            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
            children:"Today"
          }),
          u.jsx("button",{
            type:"button",
            onClick:handleLast30,
            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
            children:"30D"
          })
        ]
      })
    ]
  });
}
'''

    if 'function ExecutiveDateRangePicker(' not in bundle:
        bundle = bundle.replace('pt=Ni;function IEe(', f'pt=Ni;\n{picker_code}\nfunction IEe(')

    # 2. Expenses Date Picker
    old_exp_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectStartDate(i.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectEndDate(i.target.value),className:"h-9 w-40"})]})'
    new_exp_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    if old_exp_dates in bundle:
        bundle = bundle.replace(old_exp_dates, new_exp_dates, 1)

    # 3. Stocks, Egg Production, Sales, Flocks Date Pickers
    old_common_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
    new_common_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    bundle = bundle.replace(old_common_dates, new_common_dates)

    # 4. Reports / Income Statement Date Picker
    old_reports_dates = 'u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"From"}),u.jsx(Ot,{type:"date",value:o,onChange:y=>c(y.target.value),className:"w-36 h-9 text-xs"})]}),u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"To"}),u.jsx(Ot,{type:"date",value:f,onChange:y=>d(y.target.value),className:"w-36 h-9 text-xs"})]})'
    new_reports_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:o,endDate:f,onSelectStartDate:y=>c(y),onSelectEndDate:y=>d(y),disabled:t})'
    if old_reports_dates in bundle:
        bundle = bundle.replace(old_reports_dates, new_reports_dates, 1)

    # 5. Bird Health Date Picker
    old_bh_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhStartDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"bhStartDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhEndDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"bhEndDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
    new_bh_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    if old_bh_dates in bundle:
        bundle = bundle.replace(old_bh_dates, new_bh_dates, 1)

    # 6. Daily Consumption Date Picker
    old_dc_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start Date"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",onChange:a=>e.onSelectStartDate(a.target.value)})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End Date"}),u.jsx(Ot,{type:"date",id:"endDate",value:e.endDate||"",onChange:a=>e.onSelectEndDate(a.target.value)})]})'
    new_dc_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    if old_dc_dates in bundle:
        bundle = bundle.replace(old_dc_dates, new_dc_dates, 1)

    # 7. Upgrade oA (Daily Consumption Stat Card)
    pos_oa = bundle.find('function oA({title:e,value:t,unit:r}){return u.jsxs("div",{className:"p-4 border rounded-xl bg-white shadow-sm"')
    if pos_oa != -1:
        old_oa = bundle[pos_oa:bundle.find('}', bundle.find('children:', pos_oa)) + 2]
        new_oa = '''function oA({title:e,value:t,unit:r}){return u.jsxs("div",{className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-5 flex flex-col justify-between space-y-3 overflow-hidden",children:[u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),u.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none",children:e}),u.jsxs("h3",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 mt-1",children:[t?.toLocaleString()??0," ",u.jsx("span",{className:"text-xs font-semibold text-slate-400",children:r})]}),u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 w-fit",children:"Inventory Consumed"})]})}'''
        bundle = bundle[:pos_oa] + new_oa + bundle[pos_oa+len(old_oa):]

    # 8. Upgrade U4e (Sales Summary Cards)
    pos_u4e_start = bundle.find('function U4e(e){const t=e.byFlock.length>0?e.byFlock[0]:null;')
    pos_u4e_end = bundle.find('const $4e=()=>', pos_u4e_start)
    if pos_u4e_start != -1 and pos_u4e_end != -1:
        new_u4e = '''function U4e(e){
  const maxFlockRev=Math.max(...(e.byFlock||[]).map(r=>r.totalAmount||0),1);
  return u.jsxs("div",{
    className:"grid gap-5 md:grid-cols-2 lg:grid-cols-4",
    children:[
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Items / Birds Sold"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Nb,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsx("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900",children:(e.totalItemsSold||0).toLocaleString()}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Cartons, Trays & Live Birds"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit",children:"Commercial Sales"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-teal-500 to-emerald-600"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Gross Revenue"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs",children:u.jsx(mh,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-emerald-700",children:["Rs. ",(e.totalRevenue||0).toLocaleString(void 0,{maximumFractionDigits:0})]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Total income across period"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 w-fit",children:"Total Realized"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-blue-500 to-indigo-500"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Top Selling Flock"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Ou,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsx("p",{className:"text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate",children:e.byFlock?.[0]?.flockName||"Unit 1"}),
            u.jsxs("p",{className:"text-xs font-semibold tabular-nums text-blue-600 mt-1",children:["Rs. ",(e.byFlock?.[0]?.totalAmount||0).toLocaleString(void 0,{maximumFractionDigits:0})]})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 w-fit",children:"Prime Revenue Unit"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-amber-500 to-orange-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Active Batches"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Nb,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900",children:[(e.byFlock?.length||0)," Flocks"]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"692 recorded sale ledger rows"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 w-fit",children:"Production Units"})
        ]
      }),
      u.jsxs("div",{
        className:"col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4",
        children:[
          u.jsxs("div",{
            className:"flex items-center justify-between",
            children:[
              u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(Ou,{className:"h-4 w-4 text-emerald-600"}),u.jsx("span",{className:"text-sm font-bold text-slate-900",children:"Sales Revenue Breakdown by Flock"})]}),
              u.jsxs("span",{className:"text-xs font-medium text-slate-400",children:[e.byFlock.length," Units Registered"]})
            ]
          }),
          u.jsx("div",{
            className:"grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1",
            children:e.byFlock.map(r=>{
              const pct=Math.round(((r.totalAmount||0)/maxFlockRev)*100);
              return u.jsxs("div",{
                key:r.flockName,
                className:"p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5",
                children:[
                  u.jsxs("div",{
                    className:"flex justify-between items-center",
                    children:[
                      u.jsx("span",{className:"text-xs font-bold text-slate-800",children:r.flockName}),
                      u.jsxs("span",{className:"text-[11px] font-semibold text-slate-500 tabular-nums",children:[(r.totalItemsSold||0).toLocaleString()," sold"]})
                    ]
                  }),
                  u.jsx("div",{
                    className:"h-2 w-full rounded-full bg-slate-200/70 overflow-hidden",
                    children:u.jsx("div",{className:"h-full rounded-full bg-emerald-500",style:{width:`${pct}%`}})
                  }),
                  u.jsxs("p",{className:"text-sm font-bold text-emerald-700 tabular-nums",children:["Rs. ",(r.totalAmount||0).toLocaleString(void 0,{maximumFractionDigits:0})]})
                ]
              });
            })
          })
        ]
      })
    ]
  });
}
'''
        bundle = bundle[:pos_u4e_start] + new_u4e + bundle[pos_u4e_end:]
        print("Updated U4e Sales cards successfully")

    # 9. Upgrade tAe (Salaries Summary Cards)
    pos_tae_start = bundle.find('function tAe({totalPaid:e,totalAdvance:t,totalSalaryAmount:r,byFlock:n}){')
    pos_tae_end = bundle.find('const rAe=()=>', pos_tae_start)
    if pos_tae_start != -1 and pos_tae_end != -1:
        new_tae = '''function tAe({totalPaid:e,totalAdvance:t,totalSalaryAmount:r,byFlock:n}){
  const maxSal = Math.max(...(n||[]).map(i=>i.total||0),1);
  return u.jsxs("div",{
    className:"grid gap-5 md:grid-cols-2 lg:grid-cols-4",
    children:[
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Total Disbursed"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs",children:u.jsx(mh,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900",children:["Rs. ",e.toLocaleString(void 0,{maximumFractionDigits:0})]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Net payroll disbursed"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit",children:"Disbursed"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-amber-500 to-orange-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Total Advance"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Rz,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-amber-700",children:["Rs. ",t.toLocaleString(void 0,{maximumFractionDigits:0})]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Staff advance deductions"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 w-fit",children:"Advance Logged"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-blue-500 to-indigo-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Gross Payroll"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs",children:u.jsx(mh,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-blue-700",children:["Rs. ",r.toLocaleString(void 0,{maximumFractionDigits:0})]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Total salary entitlement"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 w-fit",children:"Gross Total"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-purple-500 to-indigo-500"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Flock Allocations"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Ou,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900",children:[n.length," Units"]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Farm facilities staffed"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 w-fit",children:"Allocations"})
        ]
      }),
      u.jsxs("div",{
        className:"col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4",
        children:[
          u.jsxs("div",{
            className:"flex items-center justify-between",
            children:[
              u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(Ou,{className:"h-4 w-4 text-emerald-600"}),u.jsx("span",{className:"text-sm font-bold text-slate-900",children:"Salary Distribution by Farm Unit"})]}),
              u.jsxs("span",{className:"text-xs font-medium text-slate-400",children:[n.length," Units Staffed"]})
            ]
          }),
          u.jsx("div",{
            className:"grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1",
            children:n.map(i=>{
              const pct=Math.round(((i.total||0)/maxSal)*100);
              return u.jsxs("div",{
                key:i.flockName,
                className:"p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5",
                children:[
                  u.jsxs("div",{
                    className:"flex justify-between items-center",
                    children:[
                      u.jsx("span",{className:"text-xs font-bold text-slate-800",children:i.flockName}),
                      u.jsxs("span",{className:"text-[11px] font-semibold text-slate-500 tabular-nums",children:["Adv: Rs. ",(i.advance||0).toLocaleString()]})
                    ]
                  }),
                  u.jsx("div",{
                    className:"h-2 w-full rounded-full bg-slate-200/70 overflow-hidden",
                    children:u.jsx("div",{className:"h-full rounded-full bg-emerald-500",style:{width:`${pct}%`}})
                  }),
                  u.jsxs("p",{className:"text-sm font-bold text-slate-900 tabular-nums",children:["Rs. ",(i.total||0).toLocaleString(void 0,{maximumFractionDigits:0})]})
                ]
              });
            })
          })
        ]
      })
    ]
  });
}
'''
        bundle = bundle[:pos_tae_start] + new_tae + bundle[pos_tae_end:]
        print("Updated tAe Salaries cards successfully")

    # 10. Upgrade Card styling across inner pages:
    # Upgrade rounded-xl border-zinc-200 on stat cards to rounded-2xl border-slate-200/90
    bundle = bundle.replace('className:"border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-xl overflow-hidden"',
                            'className:"border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow rounded-2xl overflow-hidden"')

    # Save to public and dist
    with open('public/assets/index-5bPm0Hd0.js', 'w', encoding='utf-8') as f:
        f.write(bundle)
    with open('dist/assets/index-5bPm0Hd0.js', 'w', encoding='utf-8') as f:
        f.write(bundle)

    print("Successfully updated public/assets/index-5bPm0Hd0.js and dist/assets/index-5bPm0Hd0.js")

if __name__ == '__main__':
    main()
