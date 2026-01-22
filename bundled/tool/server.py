"""
Pysealer Language Server Entry Point

This script serves as the entry point for the bundled pysealer tool.
It adds the bundled libraries to the Python path, intelligently selecting
the correct platform-specific wheel for pysealer, then executes commands.
"""

import sys
import pathlib
import platform
import glob

def get_platform_tag():
    """
    Determine the appropriate platform tag for wheel selection.
    
    Returns the platform identifier that matches the wheel naming convention:
    - Linux: manylinux_2_17_x86_64
    - macOS Intel: macosx_10_12_x86_64
    - macOS ARM: macosx_11_0_arm64
    - Windows: win_amd64
    """
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    if system == "linux":
        if "x86_64" in machine or "amd64" in machine:
            return "manylinux_2_17_x86_64"
    elif system == "darwin":  # macOS
        if "arm64" in machine or "aarch64" in machine:
            return "macosx_11_0_arm64"
        elif "x86_64" in machine or "amd64" in machine:
            return "macosx_10_12_x86_64"
    elif system == "windows":
        if "amd64" in machine or "x86_64" in machine:
            return "win_amd64"
    
    return None

def find_pysealer_wheel(libs_dir):
    """
    Find the appropriate pysealer wheel for the current platform.
    
    Searches for .whl files matching the current platform and adds them
    to the Python path so they can be imported.
    """
    platform_tag = get_platform_tag()
    
    if not platform_tag:
        print(f"Warning: Could not determine platform tag for {platform.system()} {platform.machine()}", 
              file=sys.stderr)
        return False
    
    # Search for pysealer wheel matching this platform
    # Pattern: pysealer-*-{platform_tag}.whl
    pattern = str(libs_dir / f"pysealer-*{platform_tag}*.whl")
    matching_wheels = glob.glob(pattern)
    
    if matching_wheels:
        # Add the wheel to the path (pip will handle extraction internally)
        for wheel in matching_wheels:
            sys.path.insert(0, wheel)
        return True
    else:
        print(f"Warning: No pysealer wheel found for platform {platform_tag}", file=sys.stderr)
        print(f"Searched in: {libs_dir}", file=sys.stderr)
        print(f"Pattern: {pattern}", file=sys.stderr)
        return False

# Add bundled libraries to Python path
# This allows the extension to use its own isolated version of pysealer
BUNDLE_DIR = pathlib.Path(__file__).parent.parent
LIBS_DIR = BUNDLE_DIR / "libs"

# Insert at the beginning to prioritize bundled packages
if LIBS_DIR.exists():
    sys.path.insert(0, str(LIBS_DIR))
    
    # Find and add platform-specific pysealer wheel
    find_pysealer_wheel(LIBS_DIR)
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
        print(f"\nPlatform: {platform.system()} {platform.machine()}", file=sys.stderr)
        print(f"Python version: {sys.version}", file=sys.stderr)
        sys.exit(1)
