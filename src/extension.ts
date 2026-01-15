import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('Vurze extension is now active!');

    // Register command to manually decorate current file
    const decorateCommand = vscode.commands.registerCommand('dyga01.decorateFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        await decorateFile(editor.document.uri.fsPath);
    });

    // Register save handler to automatically decorate Python files
    const saveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'python') {
            await decorateFile(document.uri.fsPath);
        }
    });

    context.subscriptions.push(decorateCommand, saveHandler);
}

async function decorateFile(filePath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running vurze decorate...';
    statusBarItem.show();

    try {
        const { stdout, stderr } = await execAsync(`vurze decorate "${filePath}"`);
        
        statusBarItem.text = '$(check) Vurze decorators applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        if (stdout) {
            console.log('Vurze output:', stdout);
        }
        if (stderr) {
            console.warn('Vurze warnings:', stderr);
        }
    } catch (error: any) {
        statusBarItem.dispose();
        
        if (error.message.includes('command not found') || error.message.includes('not recognized')) {
            vscode.window.showErrorMessage('Vurze is not installed. Please run: pip install vurze');
        } else {
            vscode.window.showErrorMessage(`Vurze error: ${error.message}`);
        }
        console.error('Vurze decoration failed:', error);
    }
}

export function deactivate() {}
