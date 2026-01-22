# pysealer extension for Visual Studio Code

Visual Studio Code extension for [pysealer](https://github.com/MCP-Security-Research/pysealer) - cryptographically sign your Python functions and classes to detect unauthorized code modifications.

## Overview

Pysealer helps you maintain code integrity by automatically adding cryptographic signatures to your Python functions and classes. Each function or class receives a unique `@pysealer` decorator containing an Ed25519 cryptographic signature that verifies both authorship and integrity, making it easy to detect unauthorized code modifications.

This VS Code extension provides seamless integration with the pysealer CLI tool, allowing you to:

- 🔒 **Lock files** with cryptographic signatures directly from the editor
- ✅ **Verify integrity** of signed Python code in your workspace
- 🚨 **Detect tampering** through automatic signature validation

## Features

Whenever a Python file is saved, the pysealer locks are automatically added or updated for that file.

### File Locking Command

Right-click any Python file or use the command palette to lock files with pysealer signatures:

- **Command**: `Pysealer: Lock Current File`
- Automatically adds locks to all functions and classes in the active Python file
- Provides instant feedback on success or failure

## Requirements

This extension bundles the pysealer CLI tool with support for **Python 3.10, 3.11, 3.12, and 3.13**.

**No additional installation required!** The extension includes pysealer and works out of the box.

Before using the extension, initialize pysealer in your project:

```bash
python -m pysealer init  # Generates and saves cryptographic keys to .env
```

Or use the command palette: `Pysealer: Initialize Project`

## Contributing

Contributions are welcome! If you have suggestions, bug reports, or want to help improve this extension, feel free to open an issue or submit a pull request.

## License

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.
