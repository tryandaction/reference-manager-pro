/**
 * Workflow Executor
 *
 * Executes workflow definitions by running steps sequentially,
 * managing context, handling errors, and reporting progress.
 */

import * as vscode from 'vscode';
import { WorkflowDefinition, WorkflowStep } from '../config';
import {
    WorkflowContext,
    WorkflowStepResult,
    WorkflowExecutionResult,
    WorkflowErrorHandler,
    WorkflowProgressReporter,
} from './types';
import { OperationRegistry } from './operationRegistry';

/**
 * Default error handler for workflows
 */
export class DefaultWorkflowErrorHandler implements WorkflowErrorHandler {
    async onStepError(
        step: { id: string; operation: string; label?: string },
        error: Error,
        context: WorkflowContext
    ): Promise<'continue' | 'abort' | 'retry'> {
        const stepLabel = step.label || step.id;

        // If step is configured to continue on error, just warn and continue
        const workflowStep = context.results.get('__current_step') as WorkflowStep | undefined;
        if (workflowStep?.continueOnError) {
            vscode.window.showWarningMessage(
                `⚠️ Step "${stepLabel}" failed: ${error.message}. Continuing...`
            );
            return 'continue';
        }

        // Otherwise, ask user what to do
        const choice = await vscode.window.showErrorMessage(
            `❌ Step "${stepLabel}" failed: ${error.message}`,
            'Abort Workflow',
            'Continue Anyway',
            'Retry Step'
        );

        if (choice === 'Retry Step') {
            return 'retry';
        }
        if (choice === 'Continue Anyway') {
            return 'continue';
        }
        return 'abort';
    }

    async onWorkflowComplete(results: WorkflowStepResult[]): Promise<void> {
        const failed = results.filter(r => !r.success);
        const succeeded = results.filter(r => r.success);

        if (failed.length === 0) {
            vscode.window.showInformationMessage(
                `✅ Workflow completed successfully (${succeeded.length} steps)`
            );
        } else {
            vscode.window.showWarningMessage(
                `⚠️ Workflow completed with ${failed.length} failed step(s) and ${succeeded.length} successful step(s)`
            );
        }
    }
}

/**
 * VS Code progress reporter for workflows
 */
class VSCodeProgressReporter implements WorkflowProgressReporter {
    constructor(
        private progress: vscode.Progress<{ message?: string; increment?: number }>
    ) {}

    reportProgress(stepIndex: number, totalSteps: number, stepLabel: string): void {
        this.progress.report({
            message: `${stepLabel} (${stepIndex + 1}/${totalSteps})`,
            increment: (100 / totalSteps),
        });
    }

    reportStepComplete(_stepId: string, _success: boolean, _message?: string): void {
        // Progress already reported in reportProgress
    }
}

/**
 * Workflow executor
 */
export class WorkflowExecutor {
    private errorHandler: WorkflowErrorHandler;

    constructor(
        private readonly workflow: WorkflowDefinition,
        private readonly operationRegistry: OperationRegistry,
        errorHandler?: WorkflowErrorHandler
    ) {
        this.errorHandler = errorHandler || new DefaultWorkflowErrorHandler();
    }

    /**
     * Execute the workflow
     * @param editor Target editor
     * @param cancellationToken Cancellation token
     * @returns Workflow execution result
     */
    async execute(
        editor: vscode.TextEditor,
        cancellationToken: vscode.CancellationToken
    ): Promise<WorkflowExecutionResult> {
        const startTime = Date.now();
        const context: WorkflowContext = {
            editor,
            results: new Map(),
            errors: new Map(),
            cancellationToken,
        };

        const stepResults: WorkflowStepResult[] = [];

        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Running workflow: ${this.workflow.name}`,
                cancellable: true,
            },
            async (progress, token) => {
                const reporter = new VSCodeProgressReporter(progress);

                for (let i = 0; i < this.workflow.steps.length; i++) {
                    const step = this.workflow.steps[i]!;

                    if (token.isCancellationRequested || cancellationToken.isCancellationRequested) {
                        vscode.window.showWarningMessage('Workflow cancelled by user');
                        break;
                    }

                    reporter.reportProgress(i, this.workflow.steps.length, step.label || step.operation);

                    // Store current step for error handler
                    context.results.set('__current_step', step);

                    let retryCount = 0;
                    const maxRetries = 3;
                    let stepResult: WorkflowStepResult | null = null;

                    while (retryCount <= maxRetries) {
                        try {
                            stepResult = await this.executeStep(step, context);
                            stepResults.push(stepResult);

                            if (!stepResult.success && !step.continueOnError) {
                                const action = await this.errorHandler.onStepError(
                                    step,
                                    stepResult.error || new Error('Step failed'),
                                    context
                                );

                                if (action === 'abort') {
                                    return { aborted: true };
                                } else if (action === 'retry' && retryCount < maxRetries) {
                                    retryCount++;
                                    stepResults.pop(); // Remove failed result, will retry
                                    continue;
                                }
                            }

                            break; // Success or continue on error
                        } catch (error) {
                            const err = error as Error;
                            stepResult = {
                                stepId: step.id,
                                success: false,
                                error: err,
                                message: err.message,
                            };
                            stepResults.push(stepResult);

                            const action = await this.errorHandler.onStepError(step, err, context);

                            if (action === 'abort') {
                                return { aborted: true };
                            } else if (action === 'retry' && retryCount < maxRetries) {
                                retryCount++;
                                stepResults.pop(); // Remove failed result, will retry
                                continue;
                            }

                            if (!step.continueOnError) {
                                return { aborted: true };
                            }

                            break; // Continue on error
                        }
                    }
                }

                return { aborted: false };
            }
        );

        const executionTime = Date.now() - startTime;

        // Call completion handler
        await this.errorHandler.onWorkflowComplete(stepResults);

        return {
            workflowId: this.workflow.id,
            stepResults,
            overallSuccess: stepResults.every(r => r.success) && !result.aborted,
            executionTime,
        };
    }

    /**
     * Execute a single workflow step
     * @param step Workflow step to execute
     * @param context Workflow context
     * @returns Step result
     */
    private async executeStep(
        step: WorkflowStep,
        context: WorkflowContext
    ): Promise<WorkflowStepResult> {
        const operation = this.operationRegistry.get(step.operation);
        if (!operation) {
            throw new Error(`Unknown operation: ${step.operation}`);
        }

        const result = await operation.execute(context, step.options);

        // Store result for next steps
        context.results.set(step.id, result.data);

        return {
            stepId: step.id,
            success: result.success,
            data: result.data,
            message: result.message,
        };
    }
}
