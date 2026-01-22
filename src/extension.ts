/**
 * Pysealer VS Code Extension
 * 
 * This extension automatically runs the pysealer lock command on Python files
 * when they are saved, adding type annotations and decorators to improve code quality.
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * Activates the Pysealer extension
 * 
 * This function is called when the extension is activated. It registers:
 * 1. A manual command to lock the current file
 * 2. An automatic save handler for Python files
 * 
 * @param context - The extension context provided by VS Code
 */
// Store extension context globally for access in helper functions
let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    console.log('Pysealer extension is now active!');

    // Register command to manually lock the current file
    // This can be triggered via the command palette: "Pysealer: Lock File"
    const lockCommand = vscode.commands.registerCommand('pysealer.lockFile', async () => {
        // Get the currently active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        // Validate that the current file is a Python file
        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        // Run pysealer lock on the current file
        await lockFile(editor.document.uri.fsPath);
    });

    // Register save handler to automatically lock Python files
    // This event fires whenever any document is saved in the workspace
    const saveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
        // Only process Python files
        if (document.languageId === 'python') {
            await lockFile(document.uri.fsPath);
        }
    });

    // Add the command and save handler to the extension's subscriptions
    // This ensures they are properly disposed when the extension is deactivated
    context.subscriptions.push(lockCommand, saveHandler);
}

/**
 * Locks a Python file using the pysealer CLI tool
 * 
 * This function executes the pysealer lock command on the specified file,
 * displays status in the status bar, and handles any errors that occur.
 * 
 * @param filePath - The absolute file system path to the Python file to lock
 */
async function lockFile(filePath: string): Promise<void> {
    // Create and show a status bar item to indicate progress
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer lock...'; // $(sync~spin) is a spinning icon
    statusBarItem.show();

    try {
        // Get workspace folder for the file to set correct working directory
        // This ensures pysealer runs in the project root where dependencies are installed
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Get Python interpreter and bundled pysealer
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, filePath);
        
        // Execute the pysealer lock command on the file using bundled version
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd });
        
        // Update status bar to show success and auto-hide after 3 seconds
        statusBarItem.text = '$(check) Pysealer locks applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log command output for debugging purposes
        if (stdout) {
            console.log('Pysealer output:', stdout);
        }
        if (stderr) {
            console.warn('Pysealer warnings:', stderr);
        }
    } catch (error: any) {
        // Clean up status bar item on error
        statusBarItem.dispose();
        
        // Provide user-friendly error messages
        if (error.message.includes('python') || error.message.includes('Python')) {
            vscode.window.showErrorMessage('Python is not installed or not found in PATH. Please install Python 3.8 or later.');
        } else if (error.message.includes('Could not import pysealer')) {
            vscode.window.showErrorMessage('Pysealer bundled libraries are missing. Please reinstall the extension.');
        } else {
            // Show other errors from pysealer execution
            vscode.window.showErrorMessage(`Pysealer error: ${error.message}`);
        }
        console.error('Pysealer locks failed:', error);
    }
}

/**
 * Gets the Python interpreter path
 * 
 * Tries to find Python in this order:
 * 1. Python extension's configured interpreter
 * 2. python3 command
 * 3. python command
 * 
 * @returns The path to the Python interpreter
 */
async function getPythonPath(): Promise<string> {
    // Try to get Python path from Python extension
    try {
        const pythonExtension = vscode.extensions.getExtension('ms-python.python');
        if (pythonExtension) {
            if (!pythonExtension.isActive) {
                await pythonExtension.activate();
            }
            const pythonPath = pythonExtension.exports?.settings?.getExecutionDetails?.()?.execCommand?.[0];
            if (pythonPath) {
                return pythonPath;
            }
        }
    } catch (error) {
        console.warn('Could not get Python path from Python extension:', error);
    }
    
    // Fallback: try python3, then python
    try {
        await execAsync('python3 --version');
        return 'python3';
    } catch {
        try {
            await execAsync('python --version');
            return 'python';
        } catch {
            // If neither works, default to python3 and let the error handler catch it
            return 'python3';
        }
    }
}

/**
 * Constructs the command to run bundled pysealer
 * 
 * @param pythonPath - Path to the Python interpreter
 * @param filePath - Path to the file to lock
 * @returns The complete command string to execute
 */
function getBundledPysealerCommand(pythonPath: string, filePath: string): string {
    // Get path to bundled server.py
    const serverPath = path.join(extensionContext.extensionPath, 'bundled', 'tool', 'server.py');
    
    // Check if bundled version exists
    if (!fs.existsSync(serverPath)) {
        throw new Error('Bundled pysealer not found. Please reinstall the extension.');
    }
    
    // Construct command with proper quoting for cross-platform support
    // Using double quotes for paths handles spaces correctly on all platforms
    const quotedPythonPath = pythonPath.includes(' ') ? `"${pythonPath}"` : pythonPath;
    const quotedServerPath = `"${serverPath}"`;
    const quotedFilePath = `"${filePath}"`;
    
    return `${quotedPythonPath} ${quotedServerPath} lock ${quotedFilePath}`;
}

/**
 * Deactivates the extension
 * 
 * This function is called when the extension is deactivated.
 * Currently, no cleanup is needed as VS Code automatically disposes
 * of all subscriptions added to context.subscriptions.
 */
export function deactivate() {}
