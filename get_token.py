"""
Run this once to get a fresh SoundCloud OAuth token + refresh token.
Usage: python3 get_token.py
"""
import http.server
import threading
import webbrowser
import urllib.parse
import urllib.request
import json
import os

CLIENT_ID     = "9SrwiuNPWBoKROIMKM9ojOaJ4ln1UCoC"
CLIENT_SECRET = "aHbJwHViG5TgOfOQ2jNarHmJwHrk7P1L"
REDIRECT_URI  = "http://localhost:3000/callback"
PORT          = 3000

auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if "code" in params:
            auth_code = params["code"][0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"<h2>Got it! You can close this tab.</h2>")
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"No code found.")
        threading.Thread(target=self.server.shutdown).start()

    def log_message(self, *args):
        pass

auth_url = (
    f"https://soundcloud.com/connect"
    f"?client_id={CLIENT_ID}"
    f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
    f"&response_type=code"
    f"&scope=non-expiring"
)

print("Opening SoundCloud login in your browser...")
print(f"If it doesn't open, go to:\n{auth_url}\n")
webbrowser.get("open -a /Applications/Google\ Chrome.app %s").open(auth_url)

server = http.server.HTTPServer(("localhost", PORT), CallbackHandler)
server.serve_forever()

if not auth_code:
    print("No auth code received.")
    exit(1)

print(f"Auth code received. Exchanging for tokens...")

data = urllib.parse.urlencode({
    "grant_type":    "authorization_code",
    "client_id":     CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "redirect_uri":  REDIRECT_URI,
    "code":          auth_code,
}).encode()

req = urllib.request.Request(
    "https://api.soundcloud.com/oauth2/token",
    data=data,
    headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    method="POST",
)

with urllib.request.urlopen(req) as resp:
    tokens = json.loads(resp.read())

print("\n✅ Success!\n")
print(f"access_token:  {tokens.get('access_token')}")
print(f"refresh_token: {tokens.get('refresh_token')}")
print(f"expires_in:    {tokens.get('expires_in')}s")

env_path = os.path.join(os.path.dirname(__file__), ".env")
with open(env_path, "r") as f:
    env = f.read()

env = "\n".join(
    f"SOUNDCLOUD_ACCESS_TOKEN={tokens['access_token']}" if line.startswith("SOUNDCLOUD_ACCESS_TOKEN=")
    else f"SOUNDCLOUD_REFRESH_TOKEN={tokens['refresh_token']}" if line.startswith("SOUNDCLOUD_REFRESH_TOKEN=")
    else line
    for line in env.splitlines()
)

if "SOUNDCLOUD_REFRESH_TOKEN=" not in env:
    env += f"\nSOUNDCLOUD_REFRESH_TOKEN={tokens['refresh_token']}"

with open(env_path, "w") as f:
    f.write(env)

print("\n.env updated with new tokens.")
print("\nNext: update SSM with the new access token:")
print(f"  aws ssm put-parameter --name /soundpulse/sc_oauth_token --value '{tokens['access_token']}' --type SecureString --overwrite --region us-east-1")
