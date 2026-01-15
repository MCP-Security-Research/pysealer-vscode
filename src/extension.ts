/**
 * Vurze VS Code Extension
 * 
 * This extension automatically runs the vurze decorate command on Python files
 * when they are saved, adding type annotations and decorators to improve code quality.
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Activates the Vurze extension
 * 
 * This function is called when the extension is activated. It registers:
 * 1. A manual command to decorate the current file
 * 2. An automatic save handler for Python files
 * 
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Vurze extension is now active!');

    // Register command to manually decorate current file
    // This can be triggered via the command palette: "Vurze: Decorate File"
    const decorateCommand = vscode.commands.registerCommand('dyga01.decorateFile', async () => {
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

        // Run vurze decorate on the current file
        await decorateFile(editor.document.uri.fsPath);
    });

    // Register save handler to automatically decorate Python files
    // This event fires whenever any document is saved in the workspace
    const saveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
        // Only process Python files
        if (document.languageId === 'python') {
            await decorateFile(document.uri.fsPath);
        }
    });

    // Add the command and save handler to the extension's subscriptions
    // This ensures they are properly disposed when the extension is deactivated
    context.subscriptions.push(decorateCommand, saveHandler);
}

/**
 * Decorates a Python file using the vurze CLI tool
 * 
 * This function executes the vurze decorate command on the specified file,
 * displays status in the status bar, and handles any errors that occur.
 * 
 * @param filePath - The absolute file system path to the Python file to decorate
 */
async function decorateFile(filePath: string): Promise<void> {
    // Create and show a status bar item to indicate progress
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running vurze decorate...'; // $(sync~spin) is a spinning icon
    statusBarItem.show();

    try {
        // Get workspace folder for the file to set correct working directory
        // This ensures vurze runs in the project root where dependencies are installed
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Execute the vurze decorate command on the file
        const { stdout, stderr } = await execAsync(`vurze decorate "${filePath}"`, { cwd });
        
        // Update status bar to show success and auto-hide after 3 seconds
        statusBarItem.text = '$(check) Vurze decorators applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log command output for debugging purposes
        if (stdout) {
            console.log('Vurze output:', stdout);
        }
        if (stderr) {
            console.warn('Vurze warnings:', stderr);
        }
    } catch (error: any) {
        // Clean up status bar item on error
        statusBarItem.dispose();
        
        // Provide user-friendly error messages
        // Check if vurze is not installed
        if (error.message.includes('command not found') || error.message.includes('not recognized')) {
            vscode.window.showErrorMessage('Vurze is not installed. Please run: pip install vurze');
        } else {
            // Show other errors from vurze execution
            vscode.window.showErrorMessage(`Vurze error: ${error.message}`);
        }
        console.error('Vurze decoration failed:', error);
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
