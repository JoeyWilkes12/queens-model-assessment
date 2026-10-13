"""Runtime containment preflight, without credentials or inference calls."""
import http.client
import json
import os
from pathlib import Path
import socket

assert os.getuid() != 0
interfaces = {p.name for p in Path("/sys/class/net").iterdir() if p.is_dir()}
active = {name for name in interfaces if int(Path(f"/sys/class/net/{name}/flags").read_text(), 16) & 1}
# Linux may expose dormant kernel tunnel devices even with --network=none.
assert active <= {"lo"} and not any(name.startswith(("eth", "en", "veth")) for name in interfaces), interfaces
for ip in ("1.1.1.1", "169.254.169.254"):
    try:
        socket.create_connection((ip, 443), timeout=1).close()
    except OSError:
        pass
    else:
        raise AssertionError("Unexpected direct networking")
for p in ("/input/unauthorized-write", "/ipc/unauthorized-write", "/unauthorized-write"):
    try:
        Path(p).write_text("probe")
    except OSError:
        pass
    else:
        raise AssertionError("Unexpected writable mount")
assert not Path("/var/run/docker.sock").exists()
assert not Path("/Users").exists()
status = Path("/proc/self/status").read_text()
assert "CapEff:\t0000000000000000" in status
assert "NoNewPrivs:\t1" in status
connection = http.client.HTTPConnection("localhost", timeout=5)
connection.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
connection.sock.connect("/ipc/subq.sock")
connection.request("GET", "/health")
assert connection.getresponse().status == 200
connection.close()
result = {"non_root": True, "interfaces": sorted(interfaces), "active_interfaces": sorted(active), "direct_internet_blocked": True,
          "metadata_ip_blocked": True, "readonly_input_socket_root": True,
          "docker_socket_absent": True, "host_home_absent": True, "capabilities_dropped": True,
          "no_new_privileges": True, "broker_health": True}
Path("/output/isolation.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({"event": "isolation_preflight", **result}), flush=True)
