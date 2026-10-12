--
-- PostgreSQL database dump
-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Database: greenova_user
-- Farm: GreenOva (GVF2025 - Multan, Punjab)

CREATE TYPE public."EGG_GRADE" AS ENUM ('started', 'medium', 'standard', 'jumbo');
CREATE TYPE public."ExpenseHead" AS ENUM (
    'CHICKEN', 'FEED', 'RENT', 'UTILITIES', 'PACKING_MATERIAL', 'TP',
    'SALARIES_PAYMENTS', 'MESS', 'POWER_ELECTRIC', 'POL', 'MEDICINE', 'VACCINE',
    'REPAIR_MAINTENANCE', 'TRAVELLING_LOGISTICS', 'OFFICE_EXPENSES', 'MEETING_REFRESHMENT',
    'FURNITURE_FIXTURE', 'COMPUTER_DEVICES', 'PROFESSIONAL_FEE', 'MISCELLANEOUS',
    'SHAREHOLDERS_DIVIDEND', 'OTHER', 'EQUIPMENT'
);
CREATE TYPE public."Sale_Head" AS ENUM ('EGG', 'Manure', 'Chicken', 'Feed_BAGS', 'OTHER');
CREATE TYPE public."StockHead" AS ENUM ('FEED', 'MEDICINE', 'VACCINE', 'OTHER', 'EQUIPMENT');
CREATE TYPE public."UserStatus" AS ENUM ('pending', 'rejected', 'allowed');

CREATE TABLE public."BirdHealth" (
    id integer NOT NULL PRIMARY KEY,
    date timestamp(3) without time zone NOT NULL,
    "flockId" integer NOT NULL,
    "openingBirds" integer NOT NULL,
    mortality integer DEFAULT 0 NOT NULL,
    cull integer DEFAULT 0 NOT NULL,
    "feedId" text,
    "feedConsumed" double precision,
    "waterConsumption" double precision,
    "lightHours" double precision,
    "lightIntensity" double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE public."EggProduction" (
    id integer NOT NULL PRIMARY KEY,
    date timestamp(3) without time zone NOT NULL,
    "totalEggs" integer DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "averageWeight" integer NOT NULL,
    "brokenEggs" integer DEFAULT 0 NOT NULL,
    "flockId" integer NOT NULL,
    grade public."EGG_GRADE" NOT NULL,
    birds integer
);

CREATE TABLE public."Expense" (
    id integer NOT NULL PRIMARY KEY,
    expense_date timestamp(3) without time zone NOT NULL,
    expense_cost double precision NOT NULL,
    head public."ExpenseHead" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    attachment text,
    "challanNo" text DEFAULT '0'::text NOT NULL,
    "flockId" integer NOT NULL
);

CREATE TABLE public."Farm" (
    id integer NOT NULL PRIMARY KEY,
    name text NOT NULL,
    code text NOT NULL,
    location text,
    description text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE public."Flock" (
    id integer NOT NULL PRIMARY KEY,
    "farmId" integer NOT NULL,
    "exitDate" timestamp(3) without time zone,
    mortality integer DEFAULT 0 NOT NULL,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "acquiredDate" timestamp(3) without time zone NOT NULL,
    breed text NOT NULL,
    "flockName" text NOT NULL,
    "totalBirds" integer DEFAULT 0 NOT NULL,
    "originalTotalBirds" integer,
    cost integer NOT NULL
);

CREATE TABLE public."Salary" (
    id integer NOT NULL PRIMARY KEY,
    "employeeName" text NOT NULL,
    designation text NOT NULL,
    attendance integer,
    "basicSalary" double precision,
    "salaryAmount" double precision NOT NULL,
    advance double precision,
    "penaltyReward" double precision,
    total double precision NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "flockId" integer NOT NULL
);

CREATE TABLE public."Sale" (
    id integer NOT NULL PRIMARY KEY,
    "saleDate" timestamp(3) without time zone NOT NULL,
    "flockId" integer NOT NULL,
    "itemsSold" integer DEFAULT 0 NOT NULL,
    attachment text,
    head public."Sale_Head" NOT NULL,
    "totalAmount" double precision NOT NULL,
    notes text,
    grade public."EGG_GRADE",
    "averageWeight" integer,
    "cashPayment" integer NOT NULL,
    "onlinePayment" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "partyName" text NOT NULL,
    "vehicleNumber" text NOT NULL,
    weight integer,
    "challanNo" text DEFAULT '0'::text NOT NULL
);

CREATE TABLE public."Stock" (
    id integer NOT NULL PRIMARY KEY,
    date timestamp(3) without time zone NOT NULL,
    "Type" text NOT NULL,
    head public."StockHead" NOT NULL,
    quantity integer NOT NULL,
    notes text,
    attachment text,
    "amountPaid" double precision,
    "paymentType" text,
    "expenseId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "challanNo" text DEFAULT '0'::text NOT NULL,
    "flockId" integer NOT NULL
);

CREATE TABLE public."user" (
    id integer NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    status public."UserStatus" DEFAULT 'pending'::public."UserStatus" NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    otp text,
    "otpExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
