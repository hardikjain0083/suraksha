import sys
sys.path.insert(0, 'c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend')
from services.watcher import parse_clauses
with open('c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/rbi_circular_demo.txt', 'r') as f:
    text = f.read()
print(parse_clauses(text))
