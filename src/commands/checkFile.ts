/**
 * Check File Command
 * 
 * Executes pysealer check on a Python file without modifying it.
 */

import * as vscode from 'vscode';
import { execAsync } from '../utils/exec';
import { getBundledPysealerCommand } from '../utils/pysealer';
import { getPythonPath } from '../utils/python';
import { handlePysealerError } from '../utils/errorHandler';

/**
 * Check File Operation
 * 
 * Executes pysealer check on a specific Python file. This analyzes the file
 * for issues without modifying it.
 * 
 * @param filePath - Absolute path to the Python file to check
 */
export async function checkFile(filePath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer check...';
    statusBarItem.show();

    try {
        // Determine working directory from workspace context
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Resolve Python interpreter and construct command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, filePath, 'check');
        
        // Execute pysealer check
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd });
        
        // Show success status (auto-hide after 3 seconds)
        statusBarItem.text = '$(check) Pysealer check complete';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Display check results to user
        if (stdout) {
            vscode.window.showInformationMessage(`Pysealer check: ${stdout.trim()}`);
            console.log('Pysealer output:', stdout);
        }
        if (stderr) { console.warn('Pysealer warnings:', stderr); }
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'check');
    }
}

/**
 * Register Check File Command
 */
export function registerCheckFileCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand('pysealer.checkFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        await checkFile(editor.document.uri.fsPath);
    });

    context.subscriptions.push(command);
}
