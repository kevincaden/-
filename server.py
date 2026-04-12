import http.server
import socketserver
import os

PORT = 8000

# 更改到当前目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print(f"You can access the site at: http://localhost:{PORT}")
    httpd.serve_forever()