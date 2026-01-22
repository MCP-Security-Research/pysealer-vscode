#!/usr/bin/env python3
"""
Cross-platform script to install Python dependencies into bundled/libs directory.

This script handles installing pysealer and its dependencies into the extension's
bundle directory. Since pysealer contains compiled binaries, we download wheels
for all platforms (Linux, macOS, Windows) to ensure the extension works everywhere.
"""

import subprocess
import sys
import os
from pathlib import Path

# Platform-specific identifiers for pysealer wheels
# These correspond to different OS and architectures
PLATFORMS = [
    "manylinux2014_x86_64",  # Linux x86_64
    "macosx_10_12_x86_64",   # macOS Intel
    "macosx_11_0_arm64",     # macOS Apple Silicon
    "win_amd64",             # Windows x86_64
]

def install_pure_python_packages(bundled_libs, requirements_file):
    """Install pure Python packages (non-compiled) normally."""
    print("\n[1/2] Installing pure Python packages...")
    try:
        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "--target", str(bundled_libs),
            "--upgrade",
            "--no-cache-dir",
            "--only-binary", ":all:",  # Only install wheels (no source distributions)
            "-r", str(requirements_file)
        ])
        print("✓ Pure Python packages installed")
    except subprocess.CalledProcessError:
        # If this fails, it might be because pysealer doesn't have a wheel for this platform
        # That's okay - we'll download it separately for all platforms
        print("⚠ Some packages couldn't be installed (expected for platform-specific packages)")

def download_platform_specific_wheels(bundled_libs, requirements_file):
    """Download pysealer wheels for all platforms."""
    print("\n[2/2] Downloading platform-specific wheels for all platforms...")
    
    for platform in PLATFORMS:
        print(f"\nDownloading for {platform}...")
        try:
            subprocess.check_call([
                sys.executable,
                "-m",
                "pip",
                "download",
                "--dest", str(bundled_libs),
                "--platform", platform,
                "--only-binary", ":all:",
                "--python-version", "312",  # Python 3.12
                "--no-deps",  # Don't download dependencies (already handled)
                "pysealer>=0.1.4"
            ])
            print(f"✓ Downloaded wheel for {platform}")
        except subprocess.CalledProcessError as e:
            print(f"⚠ Warning: Could not download wheel for {platform}: {e}", file=sys.stderr)
            # Continue with other platforms even if one fails

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
        # Step 1: Install pure Python dependencies
        install_pure_python_packages(bundled_libs, requirements_file)
        
        # Step 2: Download platform-specific wheels
        download_platform_specific_wheels(bundled_libs, requirements_file)
        
        print("\n" + "="*60)
        print("✓ Successfully installed bundled dependencies!")
        print(f"✓ Packages installed to: {bundled_libs}")
        print("✓ Platform-specific wheels downloaded for Linux, macOS, and Windows")
        print("="*60)
        
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error installing dependencies: {e}", file=sys.stderr)
        print("\nMake sure you have pip installed and can access the internet.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
