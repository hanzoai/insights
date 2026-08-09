"""StatsD over UDP, in the Telegraf tag dialect.

Counters, gauges and timings, addressed to an agent that never answers. A
datagram that cannot be sent is dropped rather than raised: a measurement must
not be able to break the request that emitted it.

Tags are always written the Telegraf way -- `stat,key=value:payload` -- because
that is the only dialect this instance has ever emitted.
"""

import socket
from time import perf_counter
from typing import Any, Optional

from django.conf import settings

Tags = Optional[dict[str, Any]]


class Timer:
    """Measures a span and sends the elapsed milliseconds when it stops."""

    def __init__(self, client: "StatsClient", stat: str) -> None:
        self._client = client
        self._stat = stat
        self._started: Optional[float] = None
        self.ms: Optional[float] = None

    def start(self) -> "Timer":
        # perf_counter, not time: a clock adjustment mid-span would otherwise
        # show up as a negative duration.
        self._started = perf_counter()
        return self

    def stop(self) -> "Timer":
        if self._started is None:
            raise RuntimeError("Timer.stop() called before Timer.start()")
        self.ms = 1000.0 * (perf_counter() - self._started)
        self._client.timing(self._stat, self.ms)
        return self


class StatsClient:
    """A statsd client that sends and never reads."""

    def __init__(self, host: Optional[str], port: int, prefix: str, separator: str) -> None:
        # Resolved once, here, so a name that does not resolve is a boot failure
        # rather than a silent per-metric one.
        family, _, _, _, addr = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_DGRAM)[0]
        self._addr = addr
        self._sock = socket.socket(family, socket.SOCK_DGRAM)
        self._prefix = prefix
        self._separator = separator

    def incr(self, stat: str, count: int = 1, tags: Tags = None) -> None:
        self._send(stat, f"{count}|c", tags)

    def gauge(self, stat: str, value: float, tags: Tags = None) -> None:
        # statsd reads a leading `-` as "adjust by", not "set to", so a negative
        # reading needs an explicit zero ahead of it to land as a value.
        if value < 0:
            self._send(stat, "0|g", tags)
        self._send(stat, f"{value}|g", tags)

    def timing(self, stat: str, ms: float, tags: Tags = None) -> None:
        self._send(stat, f"{ms:0.6f}|ms", tags)

    def timer(self, stat: str) -> Timer:
        return Timer(self, stat)

    def _send(self, stat: str, payload: str, tags: Tags) -> None:
        if self._prefix:
            stat = f"{self._prefix}{self._separator}{stat}"
        if tags:
            stat = "{},{}".format(stat, ",".join(f"{k}={v}" for k, v in tags.items()))
        try:
            self._sock.sendto(f"{stat}:{payload}".encode("ascii"), self._addr)
        except (OSError, RuntimeError):
            pass


statsd = StatsClient(
    host=settings.STATSD_HOST,
    port=int(settings.STATSD_PORT),
    prefix=settings.STATSD_PREFIX,
    separator=settings.STATSD_SEPARATOR,
)
