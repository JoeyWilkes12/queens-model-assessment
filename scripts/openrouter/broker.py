#!/usr/bin/env python3
"""Local OpenRouter credential broker (Unix socket -> https://openrouter.ai).

The API key is read once from the macOS keychain into this process's memory and
injected as the Authorization header on forwarded requests. It is never printed,
logged, written to disk, passed in argv, or returned to clients. Clients speak
plain HTTP over a user-only Unix socket, the same contract as the original
`OpenRouterBroker` used by the September studies.

Only an allowlist of OpenRouter API paths is forwarded. The log records time,
method, path, status and byte counts; never headers or bodies.
"""
import http.client
import http.server
import os
import socketserver
import ssl
import subprocess
import sys
import time
from pathlib import Path

SERVICE = 'com.joeywilkes.openrouter.inference'
HOME = Path.home() / 'Library/Application Support/OpenRouterBroker'
SOCKET = HOME / 'openrouter.sock'
LOG = HOME / 'broker.log'
UPSTREAM = 'openrouter.ai'
UPSTREAM_TIMEOUT = 900
ALLOWED = ('/api/v1/models', '/api/v1/chat/completions', '/api/alpha/decisions', '/api/v1/batches',
           '/api/v1/generation', '/api/v1/key', '/api/v1/credits')


def load_key():
    result = subprocess.run(['/usr/bin/security', 'find-generic-password', '-s', SERVICE, '-w'],
                            capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f'keychain lookup for {SERVICE} failed with exit {result.returncode}')
    key = result.stdout.strip()
    if not key:
        raise SystemExit('keychain item is empty')
    return key


KEY = None


def log(line):
    with LOG.open('a') as handle:
        handle.write(time.strftime('%Y-%m-%dT%H:%M:%S%z') + ' ' + line + '\n')


class Server(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    daemon_threads = True


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *args):
        pass

    def address_string(self):
        return 'unix-socket'

    def reply(self, status, body, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def forward(self, method):
        path = self.path
        if not path.startswith(ALLOWED) or '..' in path:
            log(f'{method} {path.split("?")[0]} 403 blocked')
            return self.reply(403, b'{"error":"path not allowed by broker"}')
        length = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(length) if length else None
        headers = {'Authorization': 'Bearer ' + KEY, 'Accept': 'application/json',
                   'X-Title': 'Queens model assessment', 'HTTP-Referer': 'https://joeywilkes12.github.io/queens-model-assessment/'}
        if body is not None:
            headers['Content-Type'] = self.headers.get('Content-Type', 'application/json')
        started = time.monotonic()
        try:
            upstream = http.client.HTTPSConnection(UPSTREAM, timeout=UPSTREAM_TIMEOUT, context=ssl.create_default_context())
            upstream.request(method, path, body=body, headers=headers)
            response = upstream.getresponse()
            data = response.read()
            status = response.status
            content_type = response.getheader('Content-Type', 'application/json')
            upstream.close()
        except Exception as error:  # transport failure: report the class only
            log(f'{method} {path.split("?")[0]} 502 {type(error).__name__} {time.monotonic() - started:.1f}s')
            return self.reply(502, ('{"error":"broker transport failure: %s"}' % type(error).__name__).encode())
        log(f'{method} {path.split("?")[0]} {status} in={length} out={len(data)} {time.monotonic() - started:.1f}s')
        self.reply(status, data, content_type)

    def do_GET(self):
        self.forward('GET')

    def do_POST(self):
        self.forward('POST')

    def do_DELETE(self):
        self.forward('DELETE')


def main():
    global KEY
    HOME.mkdir(parents=True, exist_ok=True)
    os.chmod(HOME, 0o700)
    KEY = load_key()
    if SOCKET.exists():
        SOCKET.unlink()
    old_umask = os.umask(0o177)
    server = Server(str(SOCKET), Handler)
    os.umask(old_umask)
    os.chmod(SOCKET, 0o600)
    log(f'broker started pid={os.getpid()} socket={SOCKET.name}')
    try:
        server.serve_forever()
    finally:
        server.server_close()
        if SOCKET.exists():
            SOCKET.unlink()


if __name__ == '__main__':
    sys.exit(main())
