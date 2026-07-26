import urllib.request
import json
import os

data = json.dumps({"replies": [{"comment_id": "3652141461", "reply": "Acknowledged. Thank you for verifying."}]}).encode('utf-8')
req = urllib.request.Request(os.environ.get('REPLY_TO_PR_COMMENTS_URL', 'http://localhost/not-available'), data=data, headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e)
