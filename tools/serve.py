#!/usr/bin/env python3
"""Local preview server for the site (serves the repo root).

Usage: python3 tools/serve.py [port]        → http://127.0.0.1:8765/2026-yosemite/

Why not plain `python3 -m http.server`? It serves .md files as text/markdown, and Chrome
(including headless Chrome used for screenshots) *downloads* those into ~/Downloads instead of
showing them. This server serves .md as text/plain so nothing gets downloaded.
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".md": "text/plain; charset=utf-8", ".mjs": "text/javascript", ".py": "text/plain; charset=utf-8"}

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print(f"serving {ROOT} at http://127.0.0.1:{PORT}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)).serve_forever()
