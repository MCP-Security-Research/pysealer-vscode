/**
 * Execution Utilities
 * 
 * Provides promisified exec function for async/await usage.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Promisified version of exec for async/await usage
 */
export const execAsync = promisify(exec);
