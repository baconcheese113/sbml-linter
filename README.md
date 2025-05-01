# SBML Linter

SBML Linter is a Visual Studio Code extension designed to lint SBML (Systems Biology Markup Language) files using the libSBML validator. It provides real-time feedback on SBML file issues, helping users ensure their models are valid and adhere to SBML standards.

## Features

- **Real-time Validation**: Automatically validates SBML files when opened or saved.
- **Error and Warning Diagnostics**: Displays detailed diagnostics for errors and warnings in SBML files.
- **Seamless Integration**: Works with `.xml` and `.sbml` files.

## Requirements

- The SBML validator executable (`sbml_validator.exe`) must be located in the `validator` folder of the extension.

## Installation

1. Install the extension from the Visual Studio Code Marketplace.
2. Ensure the `sbml_validator.exe` file is present in the `validator` folder.

## Usage

1. Open an SBML file (`.xml` or `.sbml`) in Visual Studio Code.
2. The extension will automatically validate the file and display diagnostics in the Problems panel.
3. Fix issues based on the diagnostics provided.

## Extension Settings

This extension does not currently add any custom settings.

## Known Issues

- Non-SBML XML files may briefly trigger validation before being ignored.
- The validator executable must be manually placed in the `validator` folder.

## Release Notes

### 0.0.1

- Initial release with basic SBML validation and diagnostics.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/your-repo/sbml-linter).

## License

This extension is licensed under the MIT License. See the LICENSE file for details.
