/**
 * Remove File Command
 * 
 * Executes pysealer remove on a Python file to remove seals/decorators.
 */

import * as vscode from 'vscode';
import { execAsync } from '../utils/exec';
import { getBundledPysealerCommand } from '../utils/pysealer';
import { getPythonPath } from '../utils/python';
import { handlePysealerError } from '../utils/errorHandler';

/**
 * Remove File Operation
 * 
 * Executes pysealer remove on a specific Python file to remove pysealer
 * decorators and seals.
 * 
 * @param filePath - Absolute path to the Python file to remove seals from
 */
export async function removeFile(filePath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer remove...';
    statusBarItem.show();

    try {
        // Determine working directory from workspace context
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Resolve Python interpreter and construct command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, filePath, 'remove');
        
        // Execute pysealer remove
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd });
        
        // Show success status (auto-hide after 3 seconds)
        statusBarItem.text = '$(check) Pysealer seals removed';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log output for debugging
        if (stdout) { console.log('Pysealer output:', stdout); }
        if (stderr) { console.warn('Pysealer warnings:', stderr); }
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'remove');
    }
}

/**
 * Register Remove File Command
 */
export function registerRemoveFileCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand('pysealer.removeFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        await removeFile(editor.document.uri.fsPath);
    });

    context.subscriptions.push(command);
}
