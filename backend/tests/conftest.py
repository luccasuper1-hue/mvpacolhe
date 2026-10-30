"""Test-process cleanup and Windows event-loop policy for Motor tests.

The application creates a global AsyncIOMotorClient at import time.  In the
isolated unit suite no network call is made, but PyMongo can otherwise keep a
monitor thread alive after pytest has finished collecting tests.
"""
import asyncio
import sys

if sys.platform == "win32":
    # Python 3.13/Windows may inherit a Proactor loop that stalls asyncio.run
    # in this Motor-free unit suite. Selector is a test-runner setting only;
    # production server architecture is unchanged.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def pytest_sessionfinish(session, exitstatus):
    try:
        from app import core
        core.client.close()
    except Exception:
        pass
