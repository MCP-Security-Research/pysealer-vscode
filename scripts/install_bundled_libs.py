#!/usr/bin/env python3
"""
Cross-platform script to install Python dependencies into bundled/libs directory.

This script handles installing pysealer and its dependencies into the extension's
bundle directory, making the extension self-contained.
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    # Get the project root directory (parent of scripts/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    bundled_libs = project_root / "bundled" / "libs"
    requirements_file = project_root / "requirements.txt"
    
    # Create bundled/libs directory if it doesn't exist
    bundled_libs.mkdir(parents=True, exist_ok=True)
    
    print(f"Installing dependencies to: {bundled_libs}")
    print(f"Using requirements from: {requirements_file}")
    
    # Check if requirements.txt exists
    if not requirements_file.exists():
        print(f"Error: {requirements_file} not found!", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Install packages using pip
        # --target installs to a specific directory
        # --upgrade ensures we get the latest versions
        # --no-cache-dir prevents caching to save space
        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "--target", str(bundled_libs),
            "--upgrade",
            "--no-cache-dir",
            "-r", str(requirements_file)
        ])
        
        print("\n✓ Successfully installed bundled dependencies!")
        print(f"✓ Packages installed to: {bundled_libs}")
        
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error installing dependencies: {e}", file=sys.stderr)
        print("\nMake sure you have pip installed and can access the internet.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
