/**
 * Initialize Project Command
 * 
 * Sets up cryptographic keys for the project using pysealer init.
 */

import * as vscode from 'vscode';
import { execAsync } from '../utils/exec';
import { getBundledPysealerCommand } from '../utils/pysealer';
import { getPythonPath } from '../utils/python';
import { handlePysealerError } from '../utils/errorHandler';

/**
 * Initialize Project Operation
 * 
 * Executes pysealer init on the project directory. This sets up cryptographic
 * keys needed for the locking process.
 * 
 * @param projectPath - Absolute path to the project directory
 */
export async function initProject(projectPath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer init...';
    statusBarItem.show();

    try {
        // Resolve Python interpreter and construct init command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, projectPath, 'init');
        
        // Execute pysealer init
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd: projectPath });
        
        // Show success status (auto-hide after 3 seconds)
        statusBarItem.text = '$(check) Pysealer init applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log output for debugging
        if (stdout) { console.log('Pysealer output:', stdout); }
        if (stderr) { console.warn('Pysealer warnings:', stderr); }
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'init');
    }
}

/**
 * Register Init Project Command
 */
export function registerInitProjectCommand(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand('pysealer.initProject', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        await initProject(workspaceFolder.uri.fsPath);
    });

    context.subscriptions.push(command);
}
