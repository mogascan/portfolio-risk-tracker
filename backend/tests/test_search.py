#!/usr/bin/env python3

import json
import os

# Resolve data relative to this file, not the working directory, so the test
# passes whether pytest is run from backend/ or the repo root.
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         os.pardir, 'data', 'crypto_news.json')


def test_keyword_search():
    # Load the news data
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    print(f"Total news items: {len(data)}")
    
    # Keywords to search for
    keywords = ["pump.fun", "pumpfun", "PumpFun"]
    
    for keyword in keywords:
        print(f"\nSearching for keyword: {keyword}")
        matched = 0
        
        for item in data:
            title = item.get('title', '').lower()
            content = item.get('content', '').lower()
            keyword_lower = keyword.lower()
            
            if keyword_lower in title or keyword_lower in content:
                matched += 1
                print(f"  Found match in: {item.get('title')}")
        
        print(f"  Total matches for {keyword}: {matched}")
    
if __name__ == "__main__":
    test_keyword_search() 