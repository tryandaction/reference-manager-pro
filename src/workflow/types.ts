/**
 * Workflow System Type Definitions
 *
 * This module defines the core types for the workflow execution system,
 * enabling users to create custom multi-step operations.
 */

import * as vscode from 'vscode';

/**
 * Workflow execution context
 * Shared state passed between workflow steps
 */
export interface WorkflowContext {
    /** Current editor */
    editor: vscode.TextEditor;
    /** Accumulated results from previous steps */
    results: Map<string, any>;
    /** Errors encountered during execution */
    errors: Map<string, Error>;
    /** Cancellation token */
    cancellationToken: vscode.CancellationToken;
}

/**
 * Result of a single workflow step execution
 */
export interface WorkflowStepResult {
    /** Step ID */
    stepId: string;
    /** Success status */
    success: boolean;
    /** Result data (passed to next step) */
    data?: any;
    /** Error if failed */
    error?: Error;
    /** User-facing message */
    message?: string;
}

/**
 * Result of complete workflow execution
 */
export interface WorkflowExecutionResult {
    /** Workflow ID */
    workflowId: string;
    /** Results from all steps */
    stepResults: WorkflowStepResult[];
    /** Overall success status */
    overallSuccess: boolean;
    /** Total execution time in milliseconds */
    executionTime?: number;
}

/**
 * Operation result interface
 */
export interface OperationResult {
    /** Success status */
    success: boolean;
    /** Result data */
    data?: any;
    /** User-facing message */
    message?: string;
}

/**
 * Operation interface
 * All workflow operations must implement this interface
 */
export interface Operation {
    /**
     * Execute the operation
     * @param context Workflow execution context
     * @param options Operation-specific options
     * @returns Operation result
     */
    execute(
        context: WorkflowContext,
        options?: Record<string, any>
    ): Promise<OperationResult>;
}

/**
 * Workflow error handler interface
 */
export interface WorkflowErrorHandler {
    /**
     * Handle step failure
     * @param step The failed step
     * @param error The error that occurred
     * @param context Workflow context
     * @returns Action to take: continue, abort, or retry
     */
    onStepError(
        step: { id: string; operation: string; label?: string },
        error: Error,
        context: WorkflowContext
    ): Promise<'continue' | 'abort' | 'retry'>;

    /**
     * Handle workflow completion with errors
     * @param results All step results
     */
    onWorkflowComplete(results: WorkflowStepResult[]): Promise<void>;
}

/**
 * Workflow progress reporter interface
 */
export interface WorkflowProgressReporter {
    /**
     * Report progress for a step
     * @param stepIndex Current step index (0-based)
     * @param totalSteps Total number of steps
     * @param stepLabel Step label
     */
    reportProgress(stepIndex: number, totalSteps: number, stepLabel: string): void;

    /**
     * Report step completion
     * @param stepId Step ID
     * @param success Whether step succeeded
     * @param message Optional message
     */
    reportStepComplete(stepId: string, success: boolean, message?: string): void;
}
