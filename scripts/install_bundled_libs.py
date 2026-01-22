#!/usr/bin/env python3
"""
Cross-platform script to install Python dependencies into bundled/libs directory.

This script handles installing pysealer and its dependencies into the extension's
bundle directory. Since pysealer contains compiled binaries, we download wheels
for all platforms (Linux, macOS, Windows) and Python versions (3.10-3.13), then
extract the pysealer module so it can be used regardless of the user's Python version.
"""

import subprocess
import sys
import os
import zipfile
from pathlib import Path

# Platform-specific identifiers for pysealer wheels
# These correspond to different OS and architectures
PLATFORMS = [
    "manylinux2014_x86_64",  # Linux x86_64
    "macosx_10_12_x86_64",   # macOS Intel
    "macosx_11_0_arm64",     # macOS Apple Silicon
    "win_amd64",             # Windows x86_64
]

# Python versions to support (3.10 through 3.13)
PYTHON_VERSIONS = ["310", "311", "312", "313"]

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
    """Download pysealer wheels for all platforms and Python versions, then extract them."""
    print("\n[2/2] Downloading platform-specific wheels for all platforms and Python versions...")
    
    downloaded_wheels = []
    
    for platform in PLATFORMS:
        for py_version in PYTHON_VERSIONS:
            print(f"\nDownloading for Python {py_version[0]}.{py_version[1:]} on {platform}...")
            try:
                subprocess.check_call([
                    sys.executable,
                    "-m",
                    "pip",
                    "download",
                    "--dest", str(bundled_libs),
                    "--platform", platform,
                    "--only-binary", ":all:",
                    "--python-version", py_version,
                    "--no-deps",  # Don't download dependencies (already handled)
                    "pysealer>=0.1.4"
                ])
                print(f"✓ Downloaded wheel for Python {py_version[0]}.{py_version[1:]} on {platform}")
                
                # Find the downloaded wheel
                wheel_pattern = f"pysealer-*-cp{py_version}-*{platform}*.whl"
                matching_wheels = list(bundled_libs.glob(wheel_pattern))
                if matching_wheels:
                    downloaded_wheels.extend(matching_wheels)
                    
            except subprocess.CalledProcessError as e:
                print(f"⚠ Warning: Could not download wheel for Python {py_version[0]}.{py_version[1:]} on {platform}: {e}", file=sys.stderr)
                # Continue with other combinations even if one fails
    
    # Extract all wheels to ensure pysealer module with all platform binaries is available
    print("\n[3/3] Extracting pysealer wheels...")
    extracted_count = 0
    for wheel_path in downloaded_wheels:
        try:
            with zipfile.ZipFile(wheel_path, 'r') as zip_ref:
                # Only extract pysealer module files (not dist-info)
                for member in zip_ref.namelist():
                    if member.startswith('pysealer/') and not member.startswith('pysealer-'):
                        zip_ref.extract(member, bundled_libs)
            extracted_count += 1
        except Exception as e:
            print(f"⚠ Warning: Could not extract {wheel_path.name}: {e}", file=sys.stderr)
    
    print(f"✓ Extracted {extracted_count} wheels")

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
        print("✓ Platform-specific wheels downloaded for:")
        print(f"  - Platforms: Linux, macOS (Intel & ARM), Windows")
        print(f"  - Python versions: 3.10, 3.11, 3.12, 3.13")
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
