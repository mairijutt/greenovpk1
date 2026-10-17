import urllib.request
import json
import time
import os

TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhYWdsb2JhbDUwMEBnbWFpbC5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3OTIyMzA1NjEsImV4cCI6MTc5MjMxNjk2MX0.m_Smwz4ovt6k_wZgCslVuCFHERlMf3uFXUK5ChbjMU0'

def fetch_all(endpoint, limit=100):
    all_items = []
    page = 1
    while True:
        url = f'https://greenovapk.com{endpoint}?page={page}&limit={limit}'
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
        try:
            resp = urllib.request.urlopen(req, timeout=12)
            res_json = json.loads(resp.read().decode())
            data = res_json.get('data', {})
            items = data.get('items', [])
            if not items:
                break
            all_items.extend(items)
            pagination = data.get('pagination', {})
            total_pages = pagination.get('pages', 1)
            print(f"[{endpoint}] Page {page}/{total_pages} ({len(items)} items, accumulated: {len(all_items)})")
            if page >= total_pages:
                break
            page += 1
            time.sleep(0.08)
        except Exception as e:
            print(f"[{endpoint}] Error on page {page}: {e}")
            break
    return all_items

def main():
    print("=== SYNCHRONIZING FULL PRODUCTION DATABASE FROM GREENOVAPK.COM ===")
    
    # 1. Expenses (1,194 records -> ~120 pages)
    print("\n1. Fetching Expenses...")
    expenses = fetch_all('/api/expenses', limit=100)
    print(f"Total Expenses fetched: {len(expenses)}")

    # 2. Sales (692 records -> ~70 pages)
    print("\n2. Fetching Sales...")
    sales = fetch_all('/api/sales', limit=100)
    print(f"Total Sales fetched: {len(sales)}")

    # 3. Stocks (134 records)
    print("\n3. Fetching Stocks...")
    stocks = fetch_all('/api/stocks', limit=100)
    print(f"Total Stocks fetched: {len(stocks)}")

    # 4. Egg Productions (338 records)
    print("\n4. Fetching Egg Productions...")
    eggs = fetch_all('/api/egg-productions', limit=100)
    print(f"Total Egg Productions fetched: {len(eggs)}")

    # 5. Salaries (23 records)
    print("\n5. Fetching Salaries...")
    salaries = fetch_all('/api/salaries', limit=100)
    print(f"Total Salaries fetched: {len(salaries)}")

    # Load existing app-data.json
    app_data_path = 'src/data/app-data.json'
    with open(app_data_path, 'r', encoding='utf-8') as f:
        app_data = json.load(f)

    if expenses:
        app_data['rawExpenses'] = expenses
    if sales:
        app_data['rawSales'] = sales
    if stocks:
        app_data['rawStocks'] = stocks
    if eggs:
        app_data['rawEggProductions'] = eggs
    if salaries:
        app_data['rawSalaries'] = salaries

    with open(app_data_path, 'w', encoding='utf-8') as f:
        json.dump(app_data, f, indent=2)

    print(f"\nSuccessfully updated {app_data_path} with:")
    print(f"  - Expenses: {len(app_data.get('rawExpenses', []))} records (120 pages on live site)")
    print(f"  - Sales: {len(app_data.get('rawSales', []))} records")
    print(f"  - Stocks: {len(app_data.get('rawStocks', []))} records")
    print(f"  - Egg Productions: {len(app_data.get('rawEggProductions', []))} records")
    print(f"  - Salaries: {len(app_data.get('rawSalaries', []))} records")

    # Update full DB backups
    for bp in ['public/GreenOva_Full_DB_Backup.json', 'dist/GreenOva_Full_DB_Backup.json']:
        if os.path.exists(bp):
            try:
                with open(bp, 'r', encoding='utf-8') as f:
                    bk = json.load(f)
                bk['/expenses?page=1&limit=20'] = app_data['rawExpenses'][:20]
                bk['/sales?page=1&limit=20'] = app_data['rawSales'][:20]
                bk['/stocks?page=1&limit=20'] = app_data['rawStocks'][:20]
                bk['/egg-productions?page=1&limit=20'] = app_data['rawEggProductions'][:20]
                bk['all_expenses'] = app_data['rawExpenses']
                bk['all_sales'] = app_data['rawSales']
                bk['all_stocks'] = app_data['rawStocks']
                bk['all_egg_productions'] = app_data['rawEggProductions']
                with open(bp, 'w', encoding='utf-8') as f:
                    json.dump(bk, f, indent=2)
                print(f"Updated backup file: {bp}")
            except Exception as e:
                print(f"Could not update {bp}: {e}")

if __name__ == '__main__':
    main()
