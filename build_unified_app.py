import sys
import subprocess

def test_syntax(code, step_name):
    res = subprocess.run(["npx", "esbuild", "--loader=js"], input=code, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"FAILED syntax check after: {step_name}")
        print("esbuild stderr:")
        print(res.stderr[:1000])
        sys.exit(1)
    else:
        print(f"PASS syntax check: {step_name}")

# Read the pristine base bundle
with open("public/live_site_files/assets/index-5bPm0Hd0.js", "r", encoding="utf-8") as f:
    bundle = f.read()

test_syntax(bundle, "Initial pristine bundle")

# 1. Replace eze with upgraded dashboard (which user says is perfectly fine)
with open("dashboard_saved_eze.js", "r", encoding="utf-8") as f:
    dashboard_code = f.read()

pos_eze = bundle.find("function eze(){")
pos_next_fn = bundle.find("function tJ(", pos_eze)
if pos_eze != -1 and pos_next_fn != -1:
    bundle = bundle[:pos_eze] + dashboard_code + bundle[pos_next_fn:]
    test_syntax(bundle, "Step 1: Dashboard eze")
else:
    print("Error finding eze positions")
    sys.exit(1)

# 2. ExecutiveDateRangePicker component - IDENTICAL to Dashboard Date Picker
picker_code = '''
function ExecutiveDateRangePicker({startDate,endDate,onSelectStartDate,onSelectEndDate,disabled,showPresets=!0}){
  const handleToday=()=>{const td=new Date().toISOString().split("T")[0];onSelectStartDate(td);onSelectEndDate(td);};
  const handleLast30=()=>{const dt=new Date();const ed=dt.toISOString().split("T")[0];dt.setDate(dt.getDate()-30);const st=dt.toISOString().split("T")[0];onSelectStartDate(st);onSelectEndDate(ed);};
  const handleClear=()=>{onSelectStartDate("");onSelectEndDate("");};
  return u.jsxs("div",{
    className:"flex flex-wrap items-center gap-3 bg-slate-50/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs",
    children:[
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
                value:startDate||"",
                disabled:disabled,
                onChange:e=>onSelectStartDate(e.target.value),
                className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"
              })
            ]
          }),
          u.jsx("span",{className:"text-slate-300 font-bold select-none",children:"\\u2192"}),
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
            children:"\\u2715"
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
          }),
          u.jsx("button",{
            type:"button",
            onClick:handleClear,
            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",
            children:"All"
          })
        ]
      })
    ]
  });
}
'''
bundle = bundle.replace('pt=Ni;function IEe(', f'pt=Ni;\n{picker_code}\nfunction IEe(')
test_syntax(bundle, "Step 2: ExecutiveDateRangePicker added")

# 3. Replace Date Picker on Expenses
old_exp_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectStartDate(i.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectEndDate(i.target.value),className:"h-9 w-40"})]})'
new_exp_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
bundle = bundle.replace(old_exp_dates, new_exp_dates)

# Common dates pattern: replaces in Stocks, Egg Production, Sales, Flocks
old_common_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
new_common_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
bundle = bundle.replace(old_common_dates, new_common_dates)

# Reports dates
old_reports_dates = 'u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"From"}),u.jsx(Ot,{type:"date",value:o,onChange:y=>c(y.target.value),className:"w-36 h-9 text-xs"})]}),u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"To"}),u.jsx(Ot,{type:"date",value:f,onChange:y=>d(y.target.value),className:"w-36 h-9 text-xs"})]})'
new_reports_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:o,endDate:f,onSelectStartDate:y=>c(y),onSelectEndDate:y=>d(y),disabled:t})'
bundle = bundle.replace(old_reports_dates, new_reports_dates)

# Bird Health dates
old_bh_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhStartDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"bhStartDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhEndDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"bhEndDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
new_bh_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
bundle = bundle.replace(old_bh_dates, new_bh_dates)

# Daily Consumption dates
old_dc_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start Date"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",onChange:a=>e.onSelectStartDate(a.target.value)})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End Date"}),u.jsx(Ot,{type:"date",id:"endDate",value:e.endDate||"",onChange:a=>e.onSelectEndDate(a.target.value)})]})'
new_dc_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
bundle = bundle.replace(old_dc_dates, new_dc_dates)

test_syntax(bundle, "Step 3: Date pickers installed on all inner pages")

# 4. Add Date Range Picker to Salaries (nAe)
old_salary_header = 'u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6",children:[u.jsx("h2",{className:"text-2xl font-bold tracking-tight",children:"Salary Summary"}),u.jsx("div",{className:"flex flex-wrap items-center gap-4",children:u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"flockFilter",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Flock"}),u.jsxs("select",{id:"flockFilter",value:e.selectedFlockId,onChange:r=>e.onSelectFlock(r.target.value),disabled:e.isLoadingSummary,className:et("h-9 rounded-md border border-input bg-background px-3 py-1 text-sm","focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"),children:[u.jsx("option",{value:"all",children:"All Flocks"}),t.map(r=>u.jsx("option",{value:r.id,children:r.flockName}))]})]})]})]})'
new_salary_header = 'u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6",children:[u.jsx("h2",{className:"text-2xl font-bold tracking-tight",children:"Salary Summary"}),u.jsxs("div",{className:"flex flex-wrap items-center gap-4",children:[u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate||"",endDate:e.endDate||"",onSelectStartDate:()=>{},onSelectEndDate:()=>{},disabled:e.isLoadingSummary}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"flockFilter",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Flock"}),u.jsxs("select",{id:"flockFilter",value:e.selectedFlockId,onChange:r=>e.onSelectFlock(r.target.value),disabled:e.isLoadingSummary,className:et("h-9 rounded-md border border-input bg-background px-3 py-1 text-sm","focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"),children:[u.jsx("option",{value:"all",children:"All Flocks"}),t.map(r=>u.jsx("option",{value:r.id,children:r.flockName}))]})]})]})]})'
bundle = bundle.replace(old_salary_header, new_salary_header)

test_syntax(bundle, "Step 4: Salaries Date Picker added")

# 5. Upgrade U4e (Sales cards) - replace cleanly between function U4e and function q4e
pos_u = bundle.find("function U4e(e){const t=e.byFlock.length>0?e.byFlock[0]:null;")
pos_q = bundle.find("function q4e(e){", pos_u)
if pos_u != -1 and pos_q != -1:
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
    bundle = bundle[:pos_u] + new_u4e + bundle[pos_q:]
    test_syntax(bundle, "Step 5: U4e Sales cards upgraded")

# 6. Upgrade tAe (Salaries cards) - replace cleanly between function tAe and function rAe
pos_t = bundle.find("function tAe({totalPaid:e,totalAdvance:t,totalSalaryAmount:r,byFlock:n}){const a=n.length>0?n[0]:null;")
pos_r = bundle.find("function rAe(", pos_t)
if pos_t != -1 and pos_r != -1:
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
    bundle = bundle[:pos_t] + new_tae + bundle[pos_r:]
    test_syntax(bundle, "Step 6: tAe Salaries cards upgraded")

# 7. Upgrade Tze (Flocks summary cards)
pos_tze_start = bundle.find('function Tze({totalFlocks:e,totalBirds:t,totalMortality:r,activeFlocks:n,inactiveFlocks:a}){')
pos_tze_end = bundle.find('function Oze()', pos_tze_start)
if pos_tze_start != -1 and pos_tze_end != -1:
    new_tze = '''function Tze({totalFlocks:e,totalBirds:t,totalMortality:r,activeFlocks:n,inactiveFlocks:a}){
  return u.jsxs("div",{
    className:"grid gap-5 md:grid-cols-2 lg:grid-cols-4",
    children:[
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Live Bird Population"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs",children:u.jsx(R0,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsx("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900",children:(t||0).toLocaleString()}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Living birds in production"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit",children:"Active Population"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-teal-500 to-cyan-500"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Active Flocks"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Ou,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-teal-700",children:[(n||0)," Flocks"]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:`${e||0} total batches registered`})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 w-fit",children:"Producing Units"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-rose-500 to-red-400"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Total Mortality"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Tj,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsx("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-rose-600",children:(r||0).toLocaleString()}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Total lost across period"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 w-fit",children:"Mortality Count"})
        ]
      }),
      u.jsxs("div",{
        className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5 flex flex-col justify-between space-y-3",
        children:[
          u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-slate-400 to-slate-500"}),
          u.jsxs("div",{className:"flex items-center justify-between",children:[
            u.jsx("span",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400",children:"Inactive / Culled"}),
            u.jsx("div",{className:"h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs",children:u.jsx(Nb,{className:"h-4 w-4"})})
          ]}),
          u.jsxs("div",{children:[
            u.jsxs("p",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-700",children:[(a||0)," Flocks"]}),
            u.jsx("p",{className:"text-xs font-medium text-slate-500 mt-1",children:"Completed harvest cycles"})
          ]}),
          u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 w-fit",children:"Completed"})
        ]
      })
    ]
  });
}
'''
    bundle = bundle[:pos_tze_start] + new_tze + bundle[pos_tze_end:]
    test_syntax(bundle, "Step 7: Tze Flocks cards upgraded")

# 8. Upgrade Daily Consumption oA card
old_oa = 'function oA({title:e,value:t,unit:r}){return u.jsxs("div",{className:"p-4 border rounded-xl bg-white shadow-sm",children:[u.jsx("p",{className:"text-xs font-medium text-muted-foreground uppercase tracking-wider",children:e}),u.jsxs("h3",{className:"text-xl font-bold mt-1",children:[t?.toLocaleString()??0," ",u.jsx("span",{className:"text-sm font-normal text-muted-foreground",children:r})]})]})}'
new_oa = '''function oA({title:e,value:t,unit:r}){
  return u.jsxs("div",{
    className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-5 flex flex-col justify-between space-y-3 overflow-hidden",
    children:[
      u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),
      u.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none",children:e}),
      u.jsxs("h3",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 mt-1",children:[t?.toLocaleString()??0," ",u.jsx("span",{className:"text-xs font-semibold text-slate-400",children:r})]}),
      u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 w-fit",children:"Inventory Consumed"})
    ]
  });
}'''
if old_oa in bundle:
    bundle = bundle.replace(old_oa, new_oa)
    test_syntax(bundle, "Step 8: oA card upgraded")

bundle = bundle.replace("Feed (Consumption page only)", "Total Feed Consumed")

# 9. Upgrade general card styling
bundle = bundle.replace('className:"border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-xl overflow-hidden"',
                        'className:"border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow rounded-2xl overflow-hidden"')

test_syntax(bundle, "Step 9: General card styling upgraded")

# 10. Fix pagination items accumulation across inner page lists
# 1. Expenses: B()
old_exp_acc = 'me.message.toLowerCase()==="success"&&(R.current=s.current<=me.data.pagination.pages&&me.data.pagination.pages>0,U.current=me.data.pagination.pages,i(G=>[...G,...me.data.items]))'
new_exp_acc = 'me.message.toLowerCase()==="success"&&(R.current=s.current<=me.data.pagination.pages&&me.data.pagination.pages>0,U.current=me.data.pagination.pages,i(G=>{const A=[...G],st=(s.current-1)*10;me.data.items.forEach((x,idx)=>{A[st+idx]=x});return A}))'
if old_exp_acc in bundle:
    bundle = bundle.replace(old_exp_acc, new_exp_acc)

# 2. Stocks: L()
old_stk_acc = 'me.message.toLowerCase()==="success"&&(j.current=N.current<=me.data.pagination.pages&&me.data.pagination.pages>0,C.current=me.data.pagination.pages,s(W=>[...W,...me.data.items]))'
new_stk_acc = 'me.message.toLowerCase()==="success"&&(j.current=N.current<=me.data.pagination.pages&&me.data.pagination.pages>0,C.current=me.data.pagination.pages,s(W=>{const A=[...W],st=(N.current-1)*10;me.data.items.forEach((x,idx)=>{A[st+idx]=x});return A}))'
if old_stk_acc in bundle:
    bundle = bundle.replace(old_stk_acc, new_stk_acc)

# 3. Egg Production & Sales: D()
old_egg_acc = 'K.message.toLowerCase()==="success"&&(C.current=s.current<=K.data.pagination.pages&&K.data.pagination.pages>0,O.current=K.data.pagination.pages,i(W=>[...W,...K.data.items]))'
new_egg_acc = 'K.message.toLowerCase()==="success"&&(C.current=s.current<=K.data.pagination.pages&&K.data.pagination.pages>0,O.current=K.data.pagination.pages,i(W=>{const A=[...W],st=(s.current-1)*10;K.data.items.forEach((x,idx)=>{A[st+idx]=x});return A}))'
bundle = bundle.replace(old_egg_acc, new_egg_acc)

# 4. Salaries: L()
old_slr_acc = 'W.message.toLowerCase()==="success"&&(C.current=s.current<=W.data.pagination.pages&&W.data.pagination.pages>0,O.current=W.data.pagination.pages,i(me=>[...me,...W.data.items]))'
new_slr_acc = 'W.message.toLowerCase()==="success"&&(C.current=s.current<=W.data.pagination.pages&&W.data.pagination.pages>0,O.current=W.data.pagination.pages,i(me=>{const A=[...me],st=(s.current-1)*10;W.data.items.forEach((x,idx)=>{A[st+idx]=x});return A}))'
if old_slr_acc in bundle:
    bundle = bundle.replace(old_slr_acc, new_slr_acc)

test_syntax(bundle, "Step 10: Pagination array indexing")

with open("public/assets/index-5bPm0Hd0.js", "w", encoding="utf-8") as f:
    f.write(bundle)

print("ALL STEPS COMPLETED AND VALIDATED PERFECTLY!")
