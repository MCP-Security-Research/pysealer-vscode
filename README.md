# pysealer extension for Visual Studio Code

Visual Studio Code extension for [pysealer](https://github.com/MCP-Security-Research/pysealer)

> 💡 **Cryptographically sign Python functions and classes for defense-in-depth security**

This extension bundles pysealer version 0.9.0 for macOS, Windows, and Linux, with support for Python 3.10, 3.11, 3.12, 3.13, and 3.14. No additional installation is required—everything works out of the box.

Pysealer helps maintain code integrity by automatically adding `@pysealer._<signature>()` decorators containing signed representations of an underlying Python functions code.

## Overview

The pysealer-vscode extension brings all the core functionality of the [pysealer CLI](https://github.com/MCP-Security-Research/pysealer) directly into Visual Studio Code. You can lock, check, and remove cryptographic decorators from Python functions and classes, ensuring code integrity and tamper detection without leaving your editor.

Key features:

- 🔒 Lock files with Ed25519 cryptographic signatures
- ✅ Verify integrity of signed Python code
- 🚨 Detect unauthorized modifications automatically
- 🧩 Seamless integration with the pysealer CLI tool

All CLI commands are available from the command palette or context menu, making it easy to secure your Python codebase as you work.

## Features

The extension provides all core pysealer CLI commands directly in Visual Studio Code:

- `Initialize Project`: Set up pysealer and generate cryptographic keys
- `Lock Current File`: Add cryptographic decorators to all functions and classes in the active Python file
- `Check File Integrity`: Verify decorators and detect unauthorized modifications
- `Remove Decorators`: Remove all pysealer decorators from a file or folder

To use these features, open the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and search for "Pysealer" to view all available commands. You can also right-click a Python file for context menu actions.

For best results, follow the setup steps in the [pysealer README](https://github.com/MCP-Security-Research/pysealer#getting-started) before using the extension.

## Contributing

**🙌 Contributions are welcome!**

Before contributing, make sure to review the [CONTRIBUTING.md](CONTRIBUTING.md) document.

All ideas and contributions are appreciated—thanks for helping make pysealer-vscode better!

## License

pysealer-vscode is licensed under the MIT License. See [LICENSE](LICENSE) for details.
