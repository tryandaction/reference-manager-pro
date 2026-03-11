/**
 * Workflow Manager
 *
 * Manages workflow registration, execution, and UI interactions.
 * Provides commands for running and managing custom workflows.
 */

import * as vscode from 'vscode';
import { WorkflowDefinition } from '../config';
import { WorkflowExecutor } from './workflowExecutor';
import { OperationRegistry } from './operationRegistry';
import {
    SmartFixOperation,
    FormatLocalOperation,
    FormatAIOperation,
    ValidateOperation,
    RemoveDuplicatesOperation,
    FindUnusedOperation,
} from './operations';

/**
 * Workflow system manager
 */
export class WorkflowManager {
    private operationRegistry: OperationRegistry;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.operationRegistry = new OperationRegistry();
        this.registerBuiltInOperations();
    }

    /**
     * Register all built-in operations
     */
    private registerBuiltInOperations(): void {
        this.operationRegistry.register('smartFix', new SmartFixOperation());
        this.operationRegistry.register('formatLocal', new FormatLocalOperation());
        this.operationRegistry.register('formatAI', new FormatAIOperation());
        this.operationRegistry.register('validate', new ValidateOperation());
        this.operationRegistry.register('removeDuplicates', new RemoveDuplicatesOperation());
        this.operationRegistry.register('findUnused', new FindUnusedOperation());
    }

    /**
     * Register workflow commands from configuration
     * @param context Extension context
     * @param workflows Workflow definitions from config
     */
    registerWorkflowCommands(
        context: vscode.ExtensionContext,
        workflows: WorkflowDefinition[]
    ): void {
        // Clear previous workflow command registrations
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        // Register each workflow as a command
        for (const workflow of workflows) {
            if (!workflow.showInMenu) {
                continue;
            }

            const commandId = `referenceManager.workflow.${workflow.id}`;
            const command = vscode.commands.registerCommand(commandId, async () => {
                await this.executeWorkflow(workflow);
            });

            this.disposables.push(command);
            context.subscriptions.push(command);
        }

        // Register workflow manager command
        const managerCommand = vscode.commands.registerCommand(
            'referenceManager.manageWorkflows',
            async () => {
                await this.showWorkflowManager(workflows);
            }
        );

        this.disposables.push(managerCommand);
        context.subscriptions.push(managerCommand);
    }

    /**
     * Execute a workflow
     * @param workflow Workflow definition to execute
     */
    async executeWorkflow(workflow: WorkflowDefinition): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'bibtex') {
            vscode.window.showErrorMessage('Current file is not a BibTeX file');
            return;
        }

        const executor = new WorkflowExecutor(workflow, this.operationRegistry);

        try {
            const result = await executor.execute(
                editor,
                new vscode.CancellationTokenSource().token
            );

            if (result.overallSuccess) {
                vscode.window.showInformationMessage(
                    `✅ Workflow "${workflow.name}" completed successfully in ${result.executionTime}ms`
                );
            } else {
                const failedSteps = result.stepResults.filter(r => !r.success);
                vscode.window.showWarningMessage(
                    `⚠️ Workflow "${workflow.name}" completed with ${failedSteps.length} failed step(s)`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(
                `❌ Workflow "${workflow.name}" failed: ${(error as Error).message}`
            );
        }
    }

    /**
     * Show workflow manager UI
     * @param workflows Available workflows
     */
    async showWorkflowManager(workflows: WorkflowDefinition[]): Promise<void> {
        const items = workflows.map(w => ({
            label: `$(play) ${w.name}`,
            description: w.description,
            detail: `${w.steps.length} steps • Scope: ${w.scope}`,
            workflow: w,
        }));

        items.push({
            label: '$(gear) Open Workflow Settings',
            description: 'Configure custom workflows',
            detail: 'Edit workflows in VS Code settings',
            workflow: null as any,
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a workflow to run or manage',
            matchOnDescription: true,
            matchOnDetail: true,
        });

        if (!selected) {
            return;
        }

        if (selected.workflow) {
            await this.executeWorkflow(selected.workflow);
        } else {
            // Open settings
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'referenceManager.customization.workflows'
            );
        }
    }

    /**
     * Get operation registry (for testing)
     */
    getOperationRegistry(): OperationRegistry {
        return this.operationRegistry;
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.operationRegistry.dispose();
    }
}
