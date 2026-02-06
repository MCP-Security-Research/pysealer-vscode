/**
 * Auto-lock on Save
 * 
 * Automatically runs pysealer lock when Python files are saved.
 */

import * as vscode from 'vscode';
import { lockFile } from '../commands/lockFile';

/**
 * Register Auto-lock Save Handler
 * 
 * Sets up event listener to automatically lock Python files on save.
 */
export function registerAutoLockHandler(context: vscode.ExtensionContext): void {
    const saveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'python') {
            await lockFile(document.uri.fsPath);
        }
    });

    context.subscriptions.push(saveHandler);
}
