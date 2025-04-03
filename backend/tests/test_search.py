#!/usr/bin/env python3

import json
import os

def test_keyword_search():
    # Load the news data
    with open('data/crypto_news.json', 'r') as f:
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