"""Test-process cleanup for Motor's background topology monitor.

The application creates a global AsyncIOMotorClient at import time.  In the
isolated unit suite no network call is made, but PyMongo can otherwise keep a
monitor thread alive after pytest has finished collecting tests.
"""


def pytest_sessionfinish(session, exitstatus):
    try:
        from app import core
        core.client.close()
    except Exception:
        pass
