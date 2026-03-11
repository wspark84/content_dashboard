import json
with open('content-db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for cat in data['categories']:
    for subcat in cat.get('subcategories', []):
        for topic in subcat.get('topics', []):
            fc = topic.get('fullContent', '')
            if r'\n' in fc:
                topic['fullContent'] = fc.replace(r'\n', '\n')
                count += 1

with open('content-db.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Fixed newlines in {count} topics.')
