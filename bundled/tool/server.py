"""
Pysealer Language Server Entry Point

This script serves as the entry point for the bundled pysealer tool.
It adds the bundled libraries to the Python path and executes commands.
"""

import sys
import pathlib

# Add bundled libraries to Python path
# This allows the extension to use its own isolated version of pysealer
BUNDLE_DIR = pathlib.Path(__file__).parent.parent
LIBS_DIR = BUNDLE_DIR / "libs"

# Insert at the beginning to prioritize bundled packages
if LIBS_DIR.exists():
    sys.path.insert(0, str(LIBS_DIR))
else:
    print(f"Error: Bundled libs directory not found: {LIBS_DIR}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    # Import and run pysealer CLI
    try:
        from pysealer.cli import main
        main()
    except ImportError as e:
        print(f"Error: Could not import pysealer. Make sure it's installed in bundled/libs/", file=sys.stderr)
        print(f"Import error: {e}", file=sys.stderr)
        print(f"\nSearched in: {LIBS_DIR}", file=sys.stderr)
        print(f"Python version: {sys.version}", file=sys.stderr)
        sys.exit(1)
