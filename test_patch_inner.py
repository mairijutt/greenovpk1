import re

def main():
    with open('public/assets/index-5bPm0Hd0.js', 'r', encoding='utf-8') as f:
        bundle = f.read()

    # 1. Add ExecutiveDateRangePicker component right before function IEe
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

    assert 'function ExecutiveDateRangePicker(' not in bundle, "ExecutiveDateRangePicker already in bundle"
    bundle = bundle.replace('pt=Ni;function IEe(', f'pt=Ni;\n{picker_code}\nfunction IEe(')

    # 2. Replace Date Picker in Expenses (IEe)
    old_exp_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectStartDate(i.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:i=>e.onSelectEndDate(i.target.value),className:"h-9 w-40"})]})'
    new_exp_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    assert old_exp_dates in bundle, "Expenses date pattern not found"
    bundle = bundle.replace(old_exp_dates, new_exp_dates, 1)

    # 3. Replace Date Picker in Stocks, Egg Production, Sales, Flocks (common pattern)
    old_common_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"endDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
    new_common_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    common_count = bundle.count(old_common_dates)
    print(f'Replacing {common_count} occurrences of common date picker pattern (Stocks, Egg, Sales, Flocks)')
    assert common_count >= 4, f"Expected at least 4 occurrences, got {common_count}"
    bundle = bundle.replace(old_common_dates, new_common_dates)

    # 4. Replace Date Picker in Reports / Income Statement
    old_reports_dates = 'u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"From"}),u.jsx(Ot,{type:"date",value:o,onChange:y=>c(y.target.value),className:"w-36 h-9 text-xs"})]}),u.jsxs("div",{className:"flex flex-col gap-1.5",children:[u.jsx(bt,{className:"text-[10px] font-bold text-zinc-400 uppercase tracking-wider",children:"To"}),u.jsx(Ot,{type:"date",value:f,onChange:y=>d(y.target.value),className:"w-36 h-9 text-xs"})]})'
    new_reports_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:o,endDate:f,onSelectStartDate:y=>c(y),onSelectEndDate:y=>d(y),disabled:t})'
    assert old_reports_dates in bundle, "Reports date pattern not found"
    bundle = bundle.replace(old_reports_dates, new_reports_dates, 1)

    # 5. Replace Date Picker in Bird Health
    old_bh_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhStartDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start"}),u.jsx(Ot,{id:"bhStartDate",type:"date",value:e.startDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectStartDate(a.target.value),className:"h-9 w-40"})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"bhEndDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End"}),u.jsx(Ot,{id:"bhEndDate",type:"date",value:e.endDate||"",disabled:e.isLoadingSummary,onChange:a=>e.onSelectEndDate(a.target.value),className:"h-9 w-40"})]})'
    new_bh_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    assert old_bh_dates in bundle, "Bird Health date pattern not found"
    bundle = bundle.replace(old_bh_dates, new_bh_dates, 1)

    # 6. Replace Date Picker in Daily Consumption
    old_dc_dates = 'u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"startDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"Start Date"}),u.jsx(Ot,{id:"startDate",type:"date",value:e.startDate||"",onChange:a=>e.onSelectStartDate(a.target.value)})]}),u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(bt,{htmlFor:"endDate",className:"text-sm font-medium text-muted-foreground whitespace-nowrap",children:"End Date"}),u.jsx(Ot,{type:"date",id:"endDate",value:e.endDate||"",onChange:a=>e.onSelectEndDate(a.target.value)})]})'
    new_dc_dates = 'u.jsx(ExecutiveDateRangePicker,{startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})'
    assert old_dc_dates in bundle, "Consumption date pattern not found"
    bundle = bundle.replace(old_dc_dates, new_dc_dates, 1)

    # 7. Upgrade oA (Daily Consumption Stat Card)
    pos_oa = bundle.find('function oA({title:e,value:t,unit:r}){return u.jsxs("div",{className:"p-4 border rounded-xl bg-white shadow-sm"')
    assert pos_oa != -1, "oA function not found"
    old_oa = bundle[pos_oa:bundle.find('}', bundle.find('children:', pos_oa)) + 2]
    new_oa = '''function oA({title:e,value:t,unit:r}){return u.jsxs("div",{className:"bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-5 flex flex-col justify-between space-y-3 overflow-hidden",children:[u.jsx("div",{className:"h-1 -mx-5 -mt-5 mb-2 bg-gradient-to-r from-emerald-500 to-teal-400"}),u.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none",children:e}),u.jsxs("h3",{className:"text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 mt-1",children:[t?.toLocaleString()??0," ",u.jsx("span",{className:"text-xs font-semibold text-slate-400",children:r})]}),u.jsx("div",{className:"inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 w-fit",children:"Inventory Consumed"})]})}'''
    bundle = bundle[:pos_oa] + new_oa + bundle[pos_oa+len(old_oa):]

    # Write to test file first to check syntax
    with open('test_bundle.js', 'w', encoding='utf-8') as out:
        out.write(bundle)
    print("test_bundle.js written, ready for syntax check")

if __name__ == '__main__':
    main()
