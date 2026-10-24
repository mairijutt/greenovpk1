import json
import psycopg2
from psycopg2.extras import execute_values
import urllib.parse
from datetime import datetime

DB_HOST = "db.tchlzcytxtmycxdmbgug.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "Chaudhary@182!@"

print("=== Connecting to Supabase PostgreSQL ===")
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    sslmode="require"
)
conn.autocommit = True
cur = conn.cursor()
print("Connected successfully!")

# 1. Create Enums if not exist
print("1. Creating ENUM types...")
enums = [
    ("EGG_GRADE", "('started', 'medium', 'standard', 'jumbo')"),
    ("ExpenseHead", "('CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP', 'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE', 'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT', 'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS', 'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT')"),
    ("Sale_Head", "('EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER')"),
    ("StockHead", "('FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT')"),
    ("UserStatus", "('pending', 'rejected', 'allowed')"),
]

for name, values in enums:
    cur.execute(f"""
        DO $$ BEGIN
            CREATE TYPE public."{name}" AS ENUM {values};
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

# 2. Create Tables with SERIAL Primary Keys
print("2. Creating Tables...")
tables_sql = """
CREATE TABLE IF NOT EXISTS public."Farm" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Flock" (
    id SERIAL PRIMARY KEY,
    "farmId" INTEGER NOT NULL,
    "exitDate" TIMESTAMP(3),
    mortality INTEGER DEFAULT 0 NOT NULL,
    notes TEXT,
    "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acquiredDate" TIMESTAMP(3) NOT NULL,
    breed TEXT NOT NULL,
    "flockName" TEXT NOT NULL,
    "totalBirds" INTEGER DEFAULT 0 NOT NULL,
    "originalTotalBirds" INTEGER,
    cost INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public."EggProduction" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP(3) NOT NULL,
    "totalEggs" INTEGER DEFAULT 0 NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "averageWeight" INTEGER NOT NULL,
    "brokenEggs" INTEGER DEFAULT 0 NOT NULL,
    "flockId" INTEGER NOT NULL,
    grade public."EGG_GRADE" NOT NULL,
    birds INTEGER
);

CREATE TABLE IF NOT EXISTS public."Expense" (
    id SERIAL PRIMARY KEY,
    expense_date TIMESTAMP(3) NOT NULL,
    expense_cost DOUBLE PRECISION NOT NULL,
    head public."ExpenseHead" NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attachment TEXT,
    "challanNo" TEXT DEFAULT '0' NOT NULL,
    "flockId" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Sale" (
    id SERIAL PRIMARY KEY,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "flockId" INTEGER NOT NULL,
    "itemsSold" INTEGER DEFAULT 0 NOT NULL,
    attachment TEXT,
    head public."Sale_Head" NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    notes TEXT,
    grade public."EGG_GRADE",
    "averageWeight" INTEGER,
    "cashPayment" INTEGER NOT NULL,
    "onlinePayment" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "partyName" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    weight INTEGER,
    "challanNo" TEXT DEFAULT '0' NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Stock" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP(3) NOT NULL,
    "Type" TEXT NOT NULL,
    head public."StockHead" NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    attachment TEXT,
    "amountPaid" DOUBLE PRECISION,
    "paymentType" TEXT,
    "expenseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "challanNo" TEXT DEFAULT '0' NOT NULL,
    "flockId" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Salary" (
    id SERIAL PRIMARY KEY,
    "employeeName" TEXT NOT NULL,
    designation TEXT NOT NULL,
    attendance INTEGER,
    "basicSalary" DOUBLE PRECISION,
    "salaryAmount" DOUBLE PRECISION NOT NULL,
    advance DOUBLE PRECISION,
    "penaltyReward" DOUBLE PRECISION,
    total DOUBLE PRECISION NOT NULL,
    remarks TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "flockId" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public."BirdHealth" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP(3) NOT NULL,
    "flockId" INTEGER NOT NULL,
    "openingBirds" INTEGER NOT NULL,
    mortality INTEGER DEFAULT 0 NOT NULL,
    cull INTEGER DEFAULT 0 NOT NULL,
    "feedId" TEXT,
    "feedConsumed" DOUBLE PRECISION,
    "waterConsumption" DOUBLE PRECISION,
    "lightHours" DOUBLE PRECISION,
    "lightIntensity" DOUBLE PRECISION,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."DailyConsumption" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP(3) NOT NULL,
    "flockId" INTEGER NOT NULL,
    "feedQuantity" DOUBLE PRECISION DEFAULT 0,
    "waterIntake" DOUBLE PRECISION DEFAULT 0,
    "feedType" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."user" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    status public."UserStatus" DEFAULT 'pending' NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    "isEmailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
    otp TEXT,
    "otpExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
"""

cur.execute(tables_sql)
print("All tables created successfully!")

# 3. Load backup data
print("3. Loading backup JSON data...")
with open("public/GreenOva_Full_DB_Backup.json") as f:
    db_backup = json.load(f)

# Helper function to parse dates
def parse_date(val):
    if not val:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except:
        return datetime.utcnow()

# Insert Farms
print("Importing Farms...")
farms = [
    (9, "GreenOva", "GVF2025", "Multan, Punjab", "Main Processing Facility", True, datetime.utcnow(), datetime.utcnow()),
    (1, "A&A Proteins", "GVF-01", "Faisalabad, Punjab", "Broiler & Layer Farm", True, datetime.utcnow(), datetime.utcnow()),
    (2, "GreenOva South Unit", "GVF-02", "Bahawalpur", "Broiler Wing", True, datetime.utcnow(), datetime.utcnow())
]
execute_values(cur, """
    INSERT INTO public."Farm" (id, name, code, location, description, active, "createdAt", "updatedAt")
    VALUES %s ON CONFLICT (id) DO NOTHING
""", farms)

# Insert Flocks
print("Importing Flocks...")
flocks = [
    (8, 9, None, 0, "Unit 1 LSL Commercial Layers", True, datetime.utcnow(), datetime.utcnow(), datetime(2026, 2, 25), "LSL", "Unit 1", 25000, 24786, 8125000),
    (9, 9, None, 0, "Unit 2 Main Production", True, datetime.utcnow(), datetime.utcnow(), datetime(2025, 1, 1), "LSL", "Unit 2", 35000, 31739, 8750000),
    (10, 9, None, 0, "Unit 3 Layer Batch", True, datetime.utcnow(), datetime.utcnow(), datetime(2025, 6, 1), "LSL", "Unit 3", 25500, 25189, 7650000),
]
execute_values(cur, """
    INSERT INTO public."Flock" (id, "farmId", "exitDate", mortality, notes, "isActive", "createdAt", "updatedAt", "acquiredDate", breed, "flockName", "totalBirds", "originalTotalBirds", cost)
    VALUES %s ON CONFLICT (id) DO NOTHING
""", flocks)

# Insert Expenses
expenses_data = db_backup.get("all_expenses", [])
print(f"Importing {len(expenses_data)} Expenses...")
valid_heads = {'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP', 'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE', 'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT', 'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS', 'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT'}
exp_rows = []
for e in expenses_data:
    eid = e.get("id")
    edate = parse_date(e.get("expense_date") or e.get("date") or e.get("createdAt"))
    cost = float(e.get("expense_cost") or e.get("amount") or 0)
    raw_head = str(e.get("head") or "OTHER").strip()
    head = raw_head if raw_head in valid_heads else "OTHER"
    notes = e.get("notes") or ""
    c_at = parse_date(e.get("createdAt"))
    u_at = parse_date(e.get("updatedAt"))
    att = e.get("attachment")
    challan = str(e.get("challanNo") or "0")
    fid = int(e.get("flockId") or 8)
    exp_rows.append((eid, edate, cost, head, notes, c_at, u_at, att, challan, fid))

if exp_rows:
    execute_values(cur, """
        INSERT INTO public."Expense" (id, expense_date, expense_cost, head, notes, "createdAt", "updatedAt", attachment, "challanNo", "flockId")
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, exp_rows, page_size=500)

# Insert Sales
sales_data = db_backup.get("all_sales", [])
print(f"Importing {len(sales_data)} Sales...")
valid_sale_heads = {'EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER'}
valid_grades = {'started', 'medium', 'standard', 'jumbo'}
sale_rows = []
for s in sales_data:
    sid = s.get("id")
    sdate = parse_date(s.get("saleDate") or s.get("date") or s.get("createdAt"))
    fid = int(s.get("flockId") or 8)
    items = int(s.get("itemsSold") or 0)
    att = s.get("attachment")
    raw_head = str(s.get("head") or "EGG").strip()
    head = raw_head if raw_head in valid_sale_heads else "EGG"
    amount = float(s.get("totalAmount") or s.get("amount") or 0)
    notes = s.get("notes") or ""
    raw_grade = s.get("grade")
    grade = raw_grade if raw_grade in valid_grades else None
    avg_weight = int(s.get("averageWeight") or 0)
    cash = int(s.get("cashPayment") or 0)
    online = int(s.get("onlinePayment") or 0)
    c_at = parse_date(s.get("createdAt"))
    u_at = parse_date(s.get("updatedAt"))
    party = str(s.get("partyName") or "General Market")
    vehicle = str(s.get("vehicleNumber") or "Direct Delivery")
    weight = int(s.get("weight") or 0) if s.get("weight") else None
    challan = str(s.get("challanNo") or "0")
    sale_rows.append((sid, sdate, fid, items, att, head, amount, notes, grade, avg_weight, cash, online, c_at, u_at, party, vehicle, weight, challan))

if sale_rows:
    execute_values(cur, """
        INSERT INTO public."Sale" (id, "saleDate", "flockId", "itemsSold", attachment, head, "totalAmount", notes, grade, "averageWeight", "cashPayment", "onlinePayment", "createdAt", "updatedAt", "partyName", "vehicleNumber", weight, "challanNo")
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, sale_rows, page_size=500)

# Insert Egg Productions
egg_data = db_backup.get("all_egg_productions", [])
print(f"Importing {len(egg_data)} Egg Productions...")
egg_rows = []
for eg in egg_data:
    egid = eg.get("id")
    egdate = parse_date(eg.get("date") or eg.get("createdAt"))
    total_eggs = int(eg.get("totalEggs") or 0)
    notes = eg.get("notes") or ""
    c_at = parse_date(eg.get("createdAt"))
    u_at = parse_date(eg.get("updatedAt"))
    avg_w = int(eg.get("averageWeight") or 60)
    broken = int(eg.get("brokenEggs") or 0)
    fid = int(eg.get("flockId") or 8)
    raw_grade = str(eg.get("grade") or "standard").lower()
    grade = raw_grade if raw_grade in valid_grades else "standard"
    birds = int(eg.get("birds") or 0) if eg.get("birds") else None
    egg_rows.append((egid, egdate, total_eggs, notes, c_at, u_at, avg_w, broken, fid, grade, birds))

if egg_rows:
    execute_values(cur, """
        INSERT INTO public."EggProduction" (id, date, "totalEggs", notes, "createdAt", "updatedAt", "averageWeight", "brokenEggs", "flockId", grade, birds)
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, egg_rows, page_size=500)

# Insert Stocks
stocks_data = db_backup.get("all_stocks", [])
print(f"Importing {len(stocks_data)} Stocks...")
valid_stock_heads = {'FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT'}
stock_rows = []
for st in stocks_data:
    stid = st.get("id")
    stdate = parse_date(st.get("date") or st.get("createdAt"))
    st_type = str(st.get("Type") or "Purchase")
    raw_head = str(st.get("head") or "FEED").upper()
    head = raw_head if raw_head in valid_stock_heads else "OTHER"
    qty = int(st.get("quantity") or 0)
    notes = st.get("notes") or ""
    att = st.get("attachment")
    paid = float(st.get("amountPaid") or 0) if st.get("amountPaid") else None
    ptype = st.get("paymentType") or "Cash"
    exp_id = int(st.get("expenseId") or 0)
    c_at = parse_date(st.get("createdAt"))
    u_at = parse_date(st.get("updatedAt"))
    challan = str(st.get("challanNo") or "0")
    fid = int(st.get("flockId") or 8)
    stock_rows.append((stid, stdate, st_type, head, qty, notes, att, paid, ptype, exp_id, c_at, u_at, challan, fid))

if stock_rows:
    execute_values(cur, """
        INSERT INTO public."Stock" (id, date, "Type", head, quantity, notes, attachment, "amountPaid", "paymentType", "expenseId", "createdAt", "updatedAt", "challanNo", "flockId")
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, stock_rows, page_size=500)

# Reset SERIAL sequences
print("Resetting primary key sequences...")
for t in ["Farm", "Flock", "EggProduction", "Expense", "Sale", "Stock", "Salary", "BirdHealth", "DailyConsumption", "user"]:
    cur.execute(f"""
        SELECT setval(pg_get_serial_sequence('public."{t}"', 'id'), COALESCE((SELECT MAX(id) FROM public."{t}"), 1) + 1, false);
    """)

# Summary verification
print("\n=== Data Migration Verification ===")
for t in ["Farm", "Flock", "EggProduction", "Expense", "Sale", "Stock", "Salary", "BirdHealth", "DailyConsumption"]:
    cur.execute(f'SELECT COUNT(*) FROM public."{t}"')
    cnt = cur.fetchone()[0]
    print(f'Table "{t}": {cnt} records')

cur.close()
conn.close()
print("\n=== SUPABASE MIGRATION COMPLETED SUCCESSFULLY ===")
