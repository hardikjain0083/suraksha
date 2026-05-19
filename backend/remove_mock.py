import re

with open('c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend/api/admin.py', 'r') as f:
    text = f.read()

# remove @router.get("/policies") ...
text = re.sub(r'@router\.get\("/policies"\).*?\]\n', '', text, flags=re.DOTALL)
text = re.sub(r'@router\.post\("/policies"\).*?return.*?\n', '', text, flags=re.DOTALL)

with open('c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend/api/admin.py', 'w') as f:
    f.write(text)
