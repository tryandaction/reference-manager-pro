/**
 * Operation Registry
 *
 * Central registry for all workflow operations.
 * Operations are registered at extension activation and can be
 * referenced by name in workflow definitions.
 */

import { Operation } from './types';

/**
 * Registry for workflow operations
 */
export class OperationRegistry {
    private operations = new Map<string, Operation>();

    /**
     * Register an operation
     * @param name Operation name (must match WorkflowStep.operation)
     * @param operation Operation implementation
     */
    register(name: string, operation: Operation): void {
        if (this.operations.has(name)) {
            throw new Error(`Operation "${name}" is already registered`);
        }
        this.operations.set(name, operation);
    }

    /**
     * Get an operation by name
     * @param name Operation name
     * @returns Operation implementation or undefined if not found
     */
    get(name: string): Operation | undefined {
        return this.operations.get(name);
    }

    /**
     * Check if an operation is registered
     * @param name Operation name
     * @returns True if operation exists
     */
    has(name: string): boolean {
        return this.operations.has(name);
    }

    /**
     * Get all registered operation names
     * @returns Array of operation names
     */
    getOperationNames(): string[] {
        return Array.from(this.operations.keys());
    }

    /**
     * Unregister an operation
     * @param name Operation name
     * @returns True if operation was removed
     */
    unregister(name: string): boolean {
        return this.operations.delete(name);
    }

    /**
     * Clear all registered operations
     */
    clear(): void {
        this.operations.clear();
    }

    /**
     * Dispose of all operations
     */
    dispose(): void {
        this.clear();
    }
}
