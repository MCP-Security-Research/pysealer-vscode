/**
 * Lock File Command
 * 
 * Executes pysealer lock on a Python file to add type annotations and decorators.
 */

import * as vscode from 'vscode';
import { execAsync } from '../utils/exec';
import { getBundledPysealerCommand } from '../utils/pysealer';
import { getPythonPath } from '../utils/python';
import { handlePysealerError } from '../utils/errorHandler';

/**
 * Lock File Operation
 * 
 * Executes pysealer lock on a specific Python file.
 * 
 * @param filePath - Absolute path to the Python file to lock
 */
export async function lockFile(filePath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer lock...';
    statusBarItem.show();

    try {
        // Determine working directory from workspace context
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Resolve Python interpreter and construct command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, filePath);
        
        // Execute pysealer lock
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd });
        
        // Show success status (auto-hide after 3 seconds)
        statusBarItem.text = '$(check) Pysealer locks applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log output for debugging
        if (stdout) { console.log('Pysealer output:', stdout); }
        if (stderr) { console.warn('Pysealer warnings:', stderr); }
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'locks');
    }
}

/**
 * Register Lock File Command
 */
export function registerLockFileCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand('pysealer.lockFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        await lockFile(editor.document.uri.fsPath);
    });

    context.subscriptions.push(command);
}
