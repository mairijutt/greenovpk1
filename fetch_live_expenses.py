import urllib.request
import json
import time

TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhYWdsb2JhbDUwMEBnbWFpbC5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3OTIyMzA1NjEsImV4cCI6MTc5MjMxNjk2MX0.m_Smwz4ovt6k_wZgCslVuCFHERlMf3uFXUK5ChbjMU0'

def fetch_all(endpoint, limit=100):
    all_items = []
    page = 1
    while True:
        url = f'https://greenovapk.com{endpoint}?page={page}&limit={limit}'
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            res_json = json.loads(resp.read().decode())
            data = res_json.get('data', {})
            items = data.get('items', [])
            if not items:
                break
            all_items.extend(items)
            pagination = data.get('pagination', {})
            total_pages = pagination.get('pages', 1)
            print(f"[{endpoint}] Fetched page {page}/{total_pages} ({len(items)} items, accumulated: {len(all_items)})")
            if page >= total_pages:
                break
            page += 1
            time.sleep(0.1)
        except Exception as e:
            print(f"[{endpoint}] Error on page {page}: {e}")
            break
    return all_items

if __name__ == '__main__':
    print("Fetching all live expenses from greenovapk.com...")
    expenses = fetch_all('/api/expenses', limit=100)
    print(f"Total live expenses fetched: {len(expenses)}")
    if expenses:
        print("Latest expense:", expenses[0]['id'], expenses[0]['expenseDate'], expenses[0]['head'], expenses[0]['expenseCost'], expenses[0].get('notes'))
        print("Oldest expense:", expenses[-1]['id'], expenses[-1]['expenseDate'], expenses[-1]['head'], expenses[-1]['expenseCost'], expenses[-1].get('notes'))
