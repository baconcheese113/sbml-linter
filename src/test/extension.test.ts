import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('SBML Linter Integration Tests', () => {
	vscode.window.showInformationMessage('Running SBML Linter tests...');

	const exampleSBML = `
<sbml xmlns="http://www.sbml.org/sbml/level2/version4" level="2" version="4">
  <model id="TestModel">
    <listOfReactions>
      <reaction id="vTest">
        <kineticLaw>
          <math xmlns="http://www.w3.org/1998/Math/MathML">
            <apply>
              <plus/>
              <ci>KmX</ci>
              <ci>X</ci>
            </apply>
          </math>
        </kineticLaw>
      </reaction>
    </listOfReactions>
  </model>
</sbml>
`;

	let testDoc: vscode.TextDocument;
	let testEditor: vscode.TextEditor;

	test('Linter should run and return diagnostics on SBML file', async () => {
		// Create a temporary SBML file
		const tempFilePath = path.join(__dirname, 'test_model.xml');
		fs.writeFileSync(tempFilePath, exampleSBML, 'utf8');

		testDoc = await vscode.workspace.openTextDocument(tempFilePath);
		testEditor = await vscode.window.showTextDocument(testDoc);

		// Allow time for the extension to activate and run diagnostics
		await new Promise(resolve => setTimeout(resolve, 500));

		// Fetch diagnostics for this document
		const diagnostics = vscode.languages.getDiagnostics(testDoc.uri);

		console.log('[Test] Diagnostics found:', diagnostics);

		// Assert that diagnostics were generated
		assert.ok(diagnostics.length > 0, 'Expected at least one diagnostic');
		assert.strictEqual(diagnostics[0].source, 'SBML Validator');
		assert.ok(diagnostics[0].message.includes('A <reaction> definition must contain at least one <speciesReference>'), 'Diagnostic message should mention a missing <speciesReference>');
		assert.match(
			diagnostics[0].message,
			/reaction|species|math|units/i,
			'Diagnostic message should mention an SBML validation concept'
		  );
		  

		// Clean up
		fs.unlinkSync(tempFilePath);
	});

	test('Linter should ignore non-SBML .xml files', async () => {
		const nonSBML = `
<note>
  <to>User</to>
  <from>Linter</from>
  <heading>Reminder</heading>
  <body>This is not SBML.</body>
</note>
		`;

		const tempFilePath = path.join(__dirname, 'not_sbml.xml');
		fs.writeFileSync(tempFilePath, nonSBML, 'utf8');

		const doc = await vscode.workspace.openTextDocument(tempFilePath);
		await vscode.window.showTextDocument(doc);

		// Give the extension time to maybe try linting
		await new Promise(resolve => setTimeout(resolve, 500));

		const diagnostics = vscode.languages.getDiagnostics(doc.uri);

		console.log('[Test] Diagnostics found (non-SBML):', diagnostics);

		// Expect no diagnostics
		assert.strictEqual(diagnostics.length, 0, 'Non-SBML XML files should not produce diagnostics');

		fs.unlinkSync(tempFilePath);
	});

});
