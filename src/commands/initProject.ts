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
 * @param envFilePath - Optional path to .env file (defaults to .env in project root)
 * @param githubToken - Optional GitHub personal access token for uploading public key
 */
export async function initProject(
    projectPath: string, 
    envFilePath?: string,
    githubToken?: string
): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer init...';
    statusBarItem.show();

    try {
        // Resolve Python interpreter and construct init command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(
            pythonPath, 
            projectPath, 
            'init',
            envFilePath,
            githubToken
        );
        
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

        // Prompt for optional env file path
        const useCustomEnv = await vscode.window.showQuickPick(
            ['Use default .env file', 'Enter .env file path manually'],
            {
                placeHolder: 'Choose .env file location',
                title: 'Pysealer Init: Environment File'
            }
        );

        if (!useCustomEnv) {
            return; // User cancelled
        }

        let envFilePath: string | undefined;
        if (useCustomEnv === 'Enter .env file path manually') {
            const inputPath = await vscode.window.showInputBox({
                prompt: 'Enter the path to your .env file',
                placeHolder: '.env or /path/to/.env.production',
                value: '.env',
                title: 'Environment File Path',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Path cannot be empty';
                    }
                    return null;
                }
            });

            if (!inputPath) {
                return; // User cancelled
            }

            envFilePath = inputPath.trim();
        }

        // Prompt for optional GitHub token
        const useGithubToken = await vscode.window.showQuickPick(
            ['Skip GitHub integration', 'Provide GitHub Personal Access Token'],
            {
                placeHolder: 'Upload public key to GitHub?',
                title: 'Pysealer Init: GitHub Integration'
            }
        );

        if (!useGithubToken) {
            return; // User cancelled
        }

        let githubToken: string | undefined;
        if (useGithubToken === 'Provide GitHub Personal Access Token') {
            githubToken = await vscode.window.showInputBox({
                prompt: 'Enter your GitHub Personal Access Token',
                password: true,
                placeHolder: 'ghp_...',
                title: 'GitHub Personal Access Token',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (value && !value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
                        return 'GitHub tokens typically start with "ghp_" or "github_pat_"';
                    }
                    return null;
                }
            });

            if (githubToken === undefined) {
                return; // User cancelled
            }
        }

        await initProject(workspaceFolder.uri.fsPath, envFilePath, githubToken);
    });

    context.subscriptions.push(command);
}
