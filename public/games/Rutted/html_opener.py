#!/usr/bin/env python3
"""
Quick local HTTP server that opens index.html (or first .html) in browser
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path
import threading
import time

# ==================== CONFIG ====================
PORT = 8000
DIRECTORY = "."             # current directory
HOST = "127.0.0.1"          # localhost

# Try these filenames in this order
INDEX_CANDIDATES = [
    "index.html",
    "index.htm",
    "home.html",
    "main.html"
]
# ================================================

def find_html_file() -> str | None:
    """Find the best HTML file to open"""
    folder = Path(DIRECTORY).resolve()

    # First try preferred names
    for name in INDEX_CANDIDATES:
        candidate = folder / name
        if candidate.is_file():
            return str(candidate.name)

    # Then any .html / .htm file
    for file in sorted(folder.glob("*.htm*")):
        if file.is_file():
            return file.name

    return None


def open_browser_when_ready(server_url: str, filename: str | None):
    """Wait a tiny bit then open browser"""
    time.sleep(0.7)  # give server time to start

    if filename:
        url = f"{server_url}/{filename}"
    else:
        url = server_url + "/"

    print(f"  → Opening: {url}")
    webbrowser.open(url, new=2)  # new=2 → new tab if possible


def main():
    os.chdir(DIRECTORY)  # make sure server serves from correct folder

    # Find something nice to open
    target_file = find_html_file()

    if target_file:
        print(f"Found: {target_file}")
    else:
        print("No .html / .htm file found → opening directory listing")
        target_file = None

    # Prepare handler
    handler = http.server.SimpleHTTPRequestHandler

    # Python 3.7+ has ThreadingHTTPServer - much cleaner
    if hasattr(http.server, "ThreadingHTTPServer"):
        server_class = http.server.ThreadingHTTPServer
    else:
        server_class = socketserver.TCPServer

    with server_class((HOST, PORT), handler) as httpd:
        server_url = f"http://{HOST}:{PORT}"

        print(f"\nServing HTTP on {server_url}")
        print(f"Directory: {Path(DIRECTORY).resolve()}\n")

        # Start browser in background thread
        threading.Thread(
            target=open_browser_when_ready,
            args=(server_url, target_file),
            daemon=True
        ).start()

        try:
            print("Press Ctrl+C to stop\n")
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()