import sys
import subprocess

def test_syntax(code, step_name):
    # Test syntax with node -c
    p = subprocess.Popen(["node", "-c"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = p.communicate(input=code)
    if p.returncode != 0:
        print(f"FAILED syntax check after: {step_name}")
        print("node -c stderr:")
        print(err[:1000])
        sys.exit(1)
    else:
        print(f"PASS syntax check: {step_name}")

with open("public/assets/index-5bPm0Hd0.js", "r", encoding="utf-8") as f:
    bundle = f.read()

test_syntax(bundle, "Initial bundle check")

# Step 1: Replace ExecutiveDateRangePicker with the unified responsive toolbar component
pos_picker = bundle.find("function ExecutiveDateRangePicker({")
pos_iee = bundle.find("function IEe(", pos_picker)

new_picker = '''function ExecutiveDateRangePicker({startDate,endDate,onSelectStartDate,onSelectEndDate,disabled,showPresets=!0,flocks,selectedFlockId,onSelectFlock,farms,selectedFarmId,onSelectFarm,selectedCategory,onSelectCategory,selectedSortOrder,onSelectSortOrder,onRefresh,isLoading}){  const handleToday=()=>{const td=new Date().toISOString().split("T")[0];onSelectStartDate&&onSelectStartDate(td);onSelectEndDate&&onSelectEndDate(td);};  const handleLast30=()=>{const dt=new Date();const ed=dt.toISOString().split("T")[0];dt.setDate(dt.getDate()-30);const st=dt.toISOString().split("T")[0];onSelectStartDate&&onSelectStartDate(st);onSelectEndDate&&onSelectEndDate(ed);};  const handleClear=()=>{onSelectStartDate&&onSelectStartDate("");onSelectEndDate&&onSelectEndDate("");};  return u.jsxs("div",{    className:"flex flex-wrap items-center gap-3 bg-slate-50/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs",    children:[      onSelectFarm&&u.jsxs("div",{        className:"flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors",        children:[          u.jsx("span",{className:"text-xs",children:"🏡"}),          u.jsxs("select",{            value:selectedFarmId||"",            disabled:disabled,            onChange:ye=>onSelectFarm(ye.target.value),            className:"bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer outline-none min-w-[130px] text-slate-800",            children:[              u.jsx("option",{value:"",children:"All Farms"}),              (farms||[]).map(ye=>u.jsx("option",{value:ye.id?.toString()||ye.id,children:ye.name||ye.farmName},ye.id))            ]          })        ]      }),      onSelectFlock&&u.jsxs("div",{        className:"flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors",        children:[          u.jsx("span",{className:"text-xs",children:"🐔"}),          u.jsxs("select",{            value:selectedFlockId||"all",            disabled:disabled,            onChange:ye=>onSelectFlock(ye.target.value),            className:"bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer outline-none min-w-[130px] text-slate-800",            children:[              u.jsx("option",{value:"all",children:"All Flocks Combined"}),              (flocks||[]).map(ye=>u.jsx("option",{value:ye.id?.toString()||ye.id,children:ye.flockName},ye.id))            ]          })        ]      }),      onSelectCategory&&u.jsxs("div",{        className:"flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors",        children:[          u.jsx("span",{className:"text-xs",children:"🏷️"}),          u.jsxs("select",{            value:selectedCategory||"all",            disabled:disabled,            onChange:ye=>onSelectCategory(ye.target.value),            className:"bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer outline-none min-w-[130px] text-slate-800",            children:[              u.jsx("option",{value:"all",children:"All Categories"}),              u.jsx("option",{value:"FEED",children:"Feed"}),              u.jsx("option",{value:"MEDICINE",children:"Medicine"}),              u.jsx("option",{value:"VACCINE",children:"Vaccine"}),              u.jsx("option",{value:"RENT",children:"Rent"}),              u.jsx("option",{value:"UTILITIES",children:"Utilities"}),              u.jsx("option",{value:"SALARIES_PAYMENTS",children:"Salaries"}),              u.jsx("option",{value:"POWER_ELECTRIC",children:"Power / Electric"}),              u.jsx("option",{value:"POL",children:"POL"}),              u.jsx("option",{value:"TRAVELLING_LOGISTICS",children:"Logistics"}),              u.jsx("option",{value:"REPAIR_MAINTENANCE",children:"Maintenance"}),              u.jsx("option",{value:"CHICKEN",children:"Chicken"}),              u.jsx("option",{value:"PACKING_MATERIAL",children:"Packing"}),              u.jsx("option",{value:"OFFICE_EXPENSES",children:"Office"}),              u.jsx("option",{value:"MISCELLANEOUS",children:"Misc"}),              u.jsx("option",{value:"OTHER",children:"Other"})            ]          })        ]      }),      onSelectSortOrder&&u.jsxs("div",{        className:"flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors",        children:[          u.jsx("span",{className:"text-xs",children:"↕"}),          u.jsxs("select",{            value:selectedSortOrder||"all",            disabled:disabled,            onChange:ye=>onSelectSortOrder(ye.target.value),            className:"bg-transparent border-0 text-xs font-bold focus:ring-0 cursor-pointer outline-none min-w-[90px] text-slate-800",            children:[              u.jsx("option",{value:"all",children:"Default Sort"}),              u.jsx("option",{value:"desc",children:"Highest Cost"}),              u.jsx("option",{value:"asc",children:"Lowest Cost"})            ]          })        ]      }),      u.jsxs("div",{        className:"flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors min-w-[340px] sm:min-w-[380px]",        children:[          u.jsxs("svg",{            className:"w-4 h-4 text-emerald-600 shrink-0",            fill:"none",            viewBox:"0 0 24 24",            stroke:"currentColor",            strokeWidth:"2",            children:[              u.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),              u.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),              u.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),              u.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})            ]          }),          u.jsxs("div",{            className:"flex items-center gap-1.5 flex-1",            children:[              u.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",children:"From"}),              u.jsx("input",{                type:"date",                value:startDate||"",                disabled:disabled,                onChange:ye=>onSelectStartDate&&onSelectStartDate(ye.target.value),                className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"              })            ]          }),          u.jsx("span",{className:"text-slate-300 font-bold select-none",children:"→"}),          u.jsxs("div",{            className:"flex items-center gap-1.5 flex-1",            children:[              u.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",children:"To"}),              u.jsx("input",{                type:"date",                value:endDate||"",                disabled:disabled,                onChange:ye=>onSelectEndDate&&onSelectEndDate(ye.target.value),                className:"text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none w-[125px] sm:w-[135px]"              })            ]          }),          (startDate||endDate)&&u.jsx("button",{            type:"button",            onClick:handleClear,            title:"Reset date range",            className:"text-[11px] font-black text-slate-400 hover:text-rose-600 px-1 rounded cursor-pointer transition-colors",            children:"✕"          })        ]      }),      showPresets&&u.jsxs("div",{        className:"hidden sm:flex items-center gap-1.5",        children:[          u.jsx("button",{            type:"button",            onClick:handleToday,            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",            children:"Today"          }),          u.jsx("button",{            type:"button",            onClick:handleLast30,            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",            children:"30D"          }),          u.jsx("button",{            type:"button",            onClick:handleClear,            className:"text-[11px] font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs",            children:"All"          })        ]      }),      onRefresh&&u.jsx("button",{        type:"button",        onClick:onRefresh,        className:"p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer flex items-center justify-center",        title:"Refresh live data",        children:u.jsx(Pz,{className:et("h-4 w-4",isLoading&&"animate-spin text-emerald-600")})      })    ]  });}\n'''

bundle = bundle[:pos_picker] + new_picker + bundle[pos_iee:]
test_syntax(bundle, "Step 1: Upgraded ExecutiveDateRangePicker installed")

# 1. Update IEe (Expenses)
pos_iee = bundle.find("function IEe(")
s1 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_iee)
e1 = bundle.find('e.expenseSummary?u.jsx(Xxe', s1)

new_iee_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Expenses Ledger"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"OPERATIONAL DISBURSEMENTS & PROCUREMENT"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlockId,onSelectFlock:e.onSelectFlock,selectedCategory:e.selectedHead,onSelectCategory:e.onSelectHead,selectedSortOrder:e.sortOrder,onSelectSortOrder:e.onSelectSortOrder,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s1] + new_iee_header + bundle[e1:]
test_syntax(bundle, "Step 2: IEe Expenses upgraded")

# 2. Update v4e (Stocks)
pos_v4e = bundle.find("function v4e(")
s2 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_v4e)
e2 = bundle.find('e.stockSummary?u.jsx(m4e', s2)

new_v4e_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Inventory & Stocks"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"FEED, MEDICINE & CONSUMABLE BALANCES"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlockId,onSelectFlock:e.onSelectFlock,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s2] + new_v4e_header + bundle[e2:]
test_syntax(bundle, "Step 3: v4e Stocks upgraded")

# 3. Update O4e (Egg Production)
pos_o4e = bundle.find("function O4e(")
s3 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_o4e)
e3 = bundle.find('e.summary?u.jsx(C4e', s3)

new_o4e_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Egg Production"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"DAILY HARVEST & CRATE LOGS"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlock,onSelectFlock:e.onSelectFlock,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s3] + new_o4e_header + bundle[e3:]
test_syntax(bundle, "Step 4: O4e Egg Production upgraded")

# 4. Update q4e (Sales)
pos_q4e = bundle.find("function q4e(")
s4 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_q4e)
e4 = bundle.find('e.summary?u.jsx(U4e', s4)

new_q4e_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Sales & Revenue"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"COMMERCIAL OFF-TAKE & DISTRIBUTION"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlock,onSelectFlock:e.onSelectFlock,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s4] + new_q4e_header + bundle[e4:]
test_syntax(bundle, "Step 5: q4e Sales upgraded")

# 5. Wire up Salaries date state in sAe and pass to nAe
old_sae_state = 'sAe=()=>{const[e,t]=S.useState(!0),[r,n]=S.useState(!1),[a,i]=S.useState([]),s=S.useRef(1),[o,c]=S.useState(!1),[f,d]=S.useState("all"),[m,v]=S.useState(null),[g,b]=S.useState(!0),[y,w]=S.useState(""),[N,j]=S.useState(""),C=S.useRef(!0),O=S.useRef(0),D=S.useRef(null);'
new_sae_state = 'sAe=()=>{const[e,t]=S.useState(!0),[r,n]=S.useState(!1),[a,i]=S.useState([]),s=S.useRef(1),[o,c]=S.useState(!1),[f,d]=S.useState("all"),[m,v]=S.useState(null),[g,b]=S.useState(!0),[y,w]=S.useState(""),[N,j]=S.useState(""),[salStart,setSalStart]=S.useState(""),[salEnd,setSalEnd]=S.useState(""),C=S.useRef(!0),O=S.useRef(0),D=S.useRef(null);'

if old_sae_state in bundle:
    bundle = bundle.replace(old_sae_state, new_sae_state)

old_sae_return = 'return u.jsx(nAe,{showForm:r,salaries:a,isLoading:e,isUpdating:o,summary:m,selectedFlockId:f,search:y,isLoadingSummary:g,pageNumber:s.current,totalPages:O.current,onSearch:ne,onSelectFlock:J,onCreate:U,onDelete:B,onEdit:X,toggleForm:z,onNextClick:ge,onPrevClick:te,getAllRecordsWithoutPagination:R})'
new_sae_return = 'return u.jsx(nAe,{showForm:r,salaries:a,isLoading:e,isUpdating:o,summary:m,selectedFlockId:f,startDate:salStart,endDate:salEnd,onSelectStartDate:setSalStart,onSelectEndDate:setSalEnd,search:y,isLoadingSummary:g,pageNumber:s.current,totalPages:O.current,onSearch:ne,onSelectFlock:J,onCreate:U,onDelete:B,onEdit:X,toggleForm:z,onNextClick:ge,onPrevClick:te,getAllRecordsWithoutPagination:R})'

if old_sae_return in bundle:
    bundle = bundle.replace(old_sae_return, new_sae_return)

pos_nae = bundle.find("function nAe(")
s5 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_nae)
e5 = bundle.find('e.summary?u.jsx(tAe', s5)

new_nae_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Payroll & Salaries"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"STAFF DISBURSEMENTS & ADVANCES"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlockId,onSelectFlock:e.onSelectFlock,startDate:e.startDate||"",endDate:e.endDate||"",onSelectStartDate:e.onSelectStartDate||(()=>{}),onSelectEndDate:e.onSelectEndDate||(()=>{}),disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s5] + new_nae_header + bundle[e5:]
test_syntax(bundle, "Step 6: nAe Salaries upgraded")

# 6. Update kze (Flocks)
pos_kze = bundle.find("function kze(")
s6 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_kze)
e6 = bundle.find('e.summary?u.jsx(Tze', s6)

new_kze_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Flock Operations"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"ACTIVE BATCHES, SHEDS & HARVEST CYCLES"})]})]}),u.jsx(ExecutiveDateRangePicker,{farms:t,selectedFarmId:e.selectedFarmId,onSelectFarm:e.onSelectFarmId,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s6] + new_kze_header + bundle[e6:]
test_syntax(bundle, "Step 7: kze Flocks upgraded")

# 7. Update Vze (Consumption)
pos_vze = bundle.find("function Vze(")
s7 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_vze)
e7 = bundle.find('e.summary?', s7)

new_vze_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Daily Consumption"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"FEED, MEDICINE & VACCINE UTILIZATION"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlockId,onSelectFlock:e.onSelectFlockId,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s7] + new_vze_header + bundle[e7:]
test_syntax(bundle, "Step 8: Vze Consumption upgraded")

# 8. Update cUe (Bird Health)
pos_cue = bundle.find("function cUe(")
s8 = bundle.find('u.jsxs("div",{className:"flex flex-col sm:flex-row justify-between', pos_cue)
e8 = bundle.find('e.summary?u.jsx(iUe', s8)

new_cue_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:"Bird Health & Biosecurity"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:"MORTALITY & VACCINATION SCHEDULES"})]})]}),u.jsx(ExecutiveDateRangePicker,{flocks:t,selectedFlockId:e.selectedFlockId,onSelectFlock:e.onSelectFlockId,startDate:e.startDate,endDate:e.endDate,onSelectStartDate:e.onSelectStartDate,onSelectEndDate:e.onSelectEndDate,disabled:e.isLoadingSummary})]}),'''
bundle = bundle[:s8] + new_cue_header + bundle[e8:]
test_syntax(bundle, "Step 9: cUe Bird Health upgraded")

# 9. Update cAe (Reports)
pos_cae = bundle.find("function cAe(")
s9 = bundle.find('u.jsxs("div",{children:[u.jsxs("div",{className:"space-y-1"', pos_cae)
e9 = bundle.find('t?u.jsx(hAe,{})', s9)

new_cae_header = '''u.jsxs("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",children:[u.jsxs("div",{className:"flex items-center gap-4",children:[u.jsx("div",{className:"bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-md text-white shadow-emerald-500/20",children:u.jsx(kz,{className:"h-6 w-6"})}),u.jsxs("div",{children:[u.jsx("h1",{className:"text-2xl font-black text-slate-900 tracking-tight uppercase",children:n==="financial"?"Income Statement":"Management Overview"}),u.jsx("p",{className:"text-xs text-slate-500 font-bold tracking-[0.1em]",children:i?.financialReport?.period||"PERFORMANCE AUDIT & ANALYTICS"})]})]}),u.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[u.jsx(oAe,{value:n,onValueChange:ye=>a(ye),className:"w-full sm:w-auto",children:u.jsxs(qV,{className:"grid w-full grid-cols-2 h-10 bg-slate-100 p-1 rounded-xl",children:[u.jsx(i3,{value:"financial",className:"text-xs font-bold rounded-lg",children:"Financial"}),u.jsx(i3,{value:"management",className:"text-xs font-bold rounded-lg",children:"Management"})]})}),u.jsx(ExecutiveDateRangePicker,{flocks:e,selectedFlockId:m,onSelectFlock:ye=>v(ye),startDate:o,endDate:f,onSelectStartDate:ye=>c(ye),onSelectEndDate:ye=>d(ye),onRefresh:g,isLoading:t})]})]}),'''
bundle = bundle[:s9] + new_cae_header + bundle[e9:]
test_syntax(bundle, "Step 10: cAe Reports upgraded")

# Save file
with open("public/assets/index-5bPm0Hd0.js", "w", encoding="utf-8") as f:
    f.write(bundle)

import shutil
shutil.copy("public/assets/index-5bPm0Hd0.js", "dist/assets/index-5bPm0Hd0.js")
print("SUCCESSFULLY SYNCED public/ AND dist/ BUNDLES!")
