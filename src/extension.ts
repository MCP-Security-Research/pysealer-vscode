/**
 * Pysealer VS Code Extension
 * 
 * This extension automatically runs the pysealer lock command on Python files
 * when they are saved, adding type annotations and decorators to improve code quality.
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

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
export function activate(context: vscode.ExtensionContext) {
    console.log('Pysealer extension is now active!');

    // Register command to manually lock the current file
    // This can be triggered via the command palette: "Pysealer: Lock File"
    const lockCommand = vscode.commands.registerCommand('dyga01.lockFile', async () => {
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
        
        // Execute the pysealer lock command on the file
        const { stdout, stderr } = await execAsync(`pysealer lock "${filePath}"`, { cwd });
        
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
        // Check if pysealer is not installed
        if (error.message.includes('command not found') || error.message.includes('not recognized')) {
            vscode.window.showErrorMessage('Pysealer is not installed. Please run: pip install pysealer');
        } else {
            // Show other errors from pysealer execution
            vscode.window.showErrorMessage(`Pysealer error: ${error.message}`);
        }
        console.error('Pysealer locks failed:', error);
    }
}

/**
 * Deactivates the extension
 * 
 * This function is called when the extension is deactivated.
 * Currently, no cleanup is needed as VS Code automatically disposes
 * of all subscriptions added to context.subscriptions.
 */
export function deactivate() {}
