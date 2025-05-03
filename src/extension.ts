import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export function activate(context: vscode.ExtensionContext) {
  console.log('[SBML-Linter] Extension activated');

  const diagnostics = vscode.languages.createDiagnosticCollection('sbml');
  context.subscriptions.push(diagnostics);

  const parser = new XMLParser({ ignoreAttributes: false });

  const platform = process.platform;
  console.log(`[SBML-Linter] Platform: ${platform}`);
  let exePath: string;
  if (platform === 'win32') {
    exePath = path.join(context.extensionPath, 'validator', 'windows', 'sbml_validator.exe');
  } else if (platform === 'linux') {
    exePath = path.join(context.extensionPath, 'validator', 'linux', 'sbml_validator');
  } else if (platform === 'darwin') {
    exePath = path.join(context.extensionPath, 'validator', 'mac', 'sbml_validator_mac');
  }

  const validateDocument = (document: vscode.TextDocument) => {
    const filePath = document.fileName;
    const content = document.getText();

    if (!filePath.endsWith('.xml') && !filePath.endsWith('.sbml')) {
      return;
    }

    // Check for <sbml> root
    let isSBML = false;
    try {
      const parsed = parser.parse(content);
      if (parsed && parsed.sbml) {
        isSBML = true;
      }
    } catch (err: any) {
      console.warn('[SBML-Linter] Failed to parse XML:', err.message);
    }

    if (!isSBML) {
      diagnostics.delete(document.uri);
      return;
    }

    // Ensure validator exists
    if (!fs.existsSync(exePath)) {
      vscode.window.showErrorMessage(`SBML validator not found at: ${exePath}`);
      return;
    }

    // Run validator
    const start = Date.now();
    try {
      const output = cp.execFileSync(exePath, [filePath], { encoding: 'utf8' });
      const results = JSON.parse(output.trim());
      console.log(`[SBML-Linter] Validator completed in ${Date.now() - start}ms`);

      const fileDiagnostics: vscode.Diagnostic[] = results.map((e: any) => {
        const lineNum = Math.max(0, e.line - 1);
        const lineText = document.lineAt(lineNum).text;

        let endCol = lineText.length;
        let startCol = lineText.length - lineText.trimStart().length;

        const severity = e.severity === 'error'
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning;

        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(lineNum, startCol, lineNum, endCol),
          e.message,
          severity
        );

        diagnostic.source = 'SBML Validator';
        return diagnostic;
      });

      diagnostics.set(document.uri, fileDiagnostics);
    } catch (err: any) {
      console.error('[SBML-Linter] Validator error:', err.message);
      vscode.window.showErrorMessage('SBML validator failed: ' + err.message);
    }
  };

  vscode.workspace.onDidSaveTextDocument(validateDocument);
  vscode.workspace.onDidOpenTextDocument(validateDocument);
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      validateDocument(editor.document);
    }
  });

  if (vscode.window.activeTextEditor) {
    validateDocument(vscode.window.activeTextEditor.document);
  }
}
