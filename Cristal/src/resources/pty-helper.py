#!/usr/bin/env python3
"""
PTY Helper for Cristal Obsidian Plugin
Based on polyipseity/obsidian-terminal implementation.

Usage: python3 -c "$(cat pty-helper.py)" <shell> [args...]

Communication:
- stdin (fd 0): User input -> shell
- stdout (fd 1): Shell output -> parent
- fd 3: Resize commands (format: "cols x rows\n")
"""

from os import (
    execvp as _execvp,
    read as _read,
    waitpid as _waitpid,
    waitstatus_to_exitcode as _ws_to_ec,
    write as _write,
)
from selectors import DefaultSelector as _DefaultSelector, EVENT_READ as _EVENT_READ
from struct import pack as _pack
import sys as _sys
from sys import exit as _exit, stdin as _stdin, stdout as _stdout
from typing import Callable as _Callable, cast as _cast

if _sys.platform != "win32":
    from fcntl import ioctl as _ioctl
    import pty as _pty
    from termios import TIOCSWINSZ as _TIOCSWINSZ

    _FORK = _cast(
        _Callable[[], tuple[int, int]],
        _pty.fork,
    )
    _CHUNK_SIZE = 1024
    _STDIN = _stdin.fileno()
    _STDOUT = _stdout.fileno()
    _CMDIO = 3

    def main():
        if len(_sys.argv) < 2:
            print("Usage: pty-helper.py <shell> [args...]", file=_sys.stderr)
            _exit(1)

        pid, pty_fd = _FORK()
        if pid == 0:
            # Child process - exec shell
            _execvp(_sys.argv[1], _sys.argv[1:])

        def write_all(fd: int, data: bytes):
            while data:
                data = data[_write(fd, data):]

        with _DefaultSelector() as selector:
            running = True

            def pipe_pty():
                try:
                    data = _read(pty_fd, _CHUNK_SIZE)
                except OSError:
                    data = b""
                if not data:
                    selector.unregister(pty_fd)
                    global running
                    running = False
                    return
                write_all(_STDOUT, data)

            def pipe_stdin():
                data = _read(_STDIN, _CHUNK_SIZE)
                if not data:
                    selector.unregister(_STDIN)
                    return
                write_all(pty_fd, data)

            def process_cmdio():
                data = _read(_CMDIO, _CHUNK_SIZE)
                if not data:
                    selector.unregister(_CMDIO)
                    return
                for line in data.decode("UTF-8", "strict").splitlines():
                    # Format: "cols x rows"
                    parts = line.split("x", 2)
                    if len(parts) == 2:
                        cols = int(parts[0].strip())
                        rows = int(parts[1].strip())
                        # TIOCSWINSZ expects: rows, cols, xpixel, ypixel
                        _ioctl(
                            pty_fd,
                            _TIOCSWINSZ,
                            _pack("HHHH", rows, cols, 0, 0),
                        )

            selector.register(pty_fd, _EVENT_READ, pipe_pty)
            selector.register(_STDIN, _EVENT_READ, pipe_stdin)

            # Check if fd 3 exists (resize channel)
            try:
                import os
                os.fstat(_CMDIO)
                selector.register(_CMDIO, _EVENT_READ, process_cmdio)
            except OSError:
                pass

            while running:
                for key, _ in selector.select():
                    key.data()

        _exit(_ws_to_ec(_waitpid(pid, 0)[1]))

else:
    def main():
        raise NotImplementedError(_sys.platform)

if __name__ == "__main__":
    main()
