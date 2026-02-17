# Contributing to pysealer-vscode

Thank you for your interest in contributing to pysealer-vscode! We welcome contributions of all kinds, including bug fixes, feature enhancements, documentation improvements, and more. Please follow the guidelines below to ensure a smooth contribution process.

## Getting Started

To get started developing pysealer-vscode, follow these steps:

1. **Fork the Repository**: Start by forking the pysealer-vscode repository to your GitHub account.
2. **Clone Your Fork**: Clone your forked repository to your local machine:
  ```bash
  git clone https://github.com/<your-username>/pysealer-vscode.git
  cd pysealer-vscode
  ```
3. **Install npm Dependencies**: Install Node.js dependencies:
  ```bash
  npm install
  ```
4. **Bundle Python Libraries**: Install pysealer and other Python libs into `bundled/libs/`:
  ```bash
  npm run bundle:python
  ```
5. **Compile the Extension**: Build the VS Code extension:
  ```bash
  npm run compile
  ```
6. **Open in VS Code**: Open the project in Visual Studio Code and use the Run and Debug panel to launch the extension for development.

## Running Pysealer-vscode Locally

To run Pysealer-vscode locally:

- Open the project in Visual Studio Code.
- Go to the Run and Debug panel (left sidebar, play icon).
- Select "Launch Extension" and click the green run button. This will open a new VS Code window with the extension loaded in development mode.
- Use the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux) and search for "Pysealer" to test extension commands.

## Versioning and Realeases

### Updating the Bundled Pysealer Version

- Change the version in `requirements.txt` (e.g. `pysealer>=0.9.0`)
- Run `npm install` to install dependencies
- Run `npm run bundle:python` to install pysealer and other libs into `bundled/libs/` (this runs `scripts/install_bundled_libs.py`)

### Making Releases to Pysealer-vscode

- Bump the npm version (replace `0.6.0` with your target):
	- Patch: `npm version patch`
	- Minor: `npm version minor`
	- Major: `npm version major`
- Push tags: `git push origin main --tags`

## Development Workflow

When working on Pysealer-vscode, follow these steps:

- **Code Changes**: Make your changes in a new branch:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- **Commit Messages**: Write clear and concise commit messages. Follow the format:
  ```
  feat: Add new feature
  fix: Fix a bug
  docs: Update documentation
  ```
- **Push Changes**: Push your branch to your forked repository:
  ```bash
  git push origin feature/your-feature-name
  ```
- **Create a Pull Request**: Open a pull request to the `main` branch of the original repository. Follow the Pull request format specified below.

## Issue Format

When creating an issue, please follow this format to ensure clarity and consistency:

```text
[feat/bug/docs/question] short description of the issue

Description:
- What is the issue or feature request?
- Steps to reproduce (if applicable)
- Expected behavior vs. actual behavior (if applicable)
- Any additional context or screenshots

Environment:
- Python version: <e.g., 3.10>
- Operating system: <e.g., macOS 12>
- Pysealer-vscode version: <e.g., 0.8.9>

Linked Pull Requests (if any): #<PR-number>
```

## Pull Request Format

When creating a pull request, please follow this format to ensure clarity and consistency:

```text
[feat/fix/docs] short description of the change

Description:
- What does this PR do?
- Why is this change necessary?
- Are there any dependencies or prerequisites?
- Add any other supporting information here.

Review Process: Describe how this PR can be reviewed?

Linked Issues: Closes #<issue-number>
```

## Future Work Ideas

- Add a serialized format for viewing diffs when the pysealer check command fails.
- Add basic tests to the extension to ensure it works.
- Fix any bundling issues with versions and os that are currently occuring.

Thank you for contributing to Pysealer-vscode! Your efforts help make this project better for everyone.
