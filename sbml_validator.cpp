#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <sbml/SBMLTypes.h>
#include <algorithm> // For std::replace

// Struct to store validation error info
struct ValidationError {
    unsigned int line;
    std::string message;
    std::string severity;
};

// Converts validation errors to JSON
void printErrorsAsJSON(const std::vector<ValidationError>& errors) {
    std::cout << "[\n";
    for (size_t i = 0; i < errors.size(); ++i) {
        std::string message = errors[i].message;
        std::replace(message.begin(), message.end(), '\n', ' '); // Normalize line endings
        std::cout << "  { \"line\": " << errors[i].line
                  << ", \"message\": \"" << message << "\""
                  << ", \"severity\": \"" << errors[i].severity << "\" }";
        if (i < errors.size() - 1) std::cout << ",";
        std::cout << "\n";
    }
    std::cout << "]\n";
}

// Reads an entire file into a string
std::string readFileToString(const std::string& filePath) {
    std::ifstream t(filePath);
    std::stringstream buffer;
    buffer << t.rdbuf();
    return buffer.str();
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: sbml-validator <file.sbml>\n";
        return 1;
    }

    std::string sbmlContent = readFileToString(argv[1]);
    libsbml::SBMLDocument* document = libsbml::readSBMLFromString(sbmlContent.c_str());

    std::vector<ValidationError> errors;

    if (!document) {
        errors.push_back({0, "Failed to parse SBML file.", "fatal"});
    } else {
        if (document->getNumErrors() > 0) {
            for (unsigned int i = 0; i < document->getNumErrors(); ++i) {
                const libsbml::SBMLError* err = document->getError(i);
                std::string severity;
                switch (err->getSeverity()) {
                    case libsbml::LIBSBML_SEV_ERROR: severity = "error"; break;
                    case libsbml::LIBSBML_SEV_FATAL: severity = "fatal"; break;
                    case libsbml::LIBSBML_SEV_WARNING: severity = "warning"; break;
                    default: severity = "info"; break;
                }
                errors.push_back({err->getLine(), err->getMessage(), severity});
            }
        }

        unsigned int consistencyErrors = document->checkConsistency();
        if (consistencyErrors > 0) {
            for (unsigned int i = 0; i < document->getNumErrors(); ++i) {
                const libsbml::SBMLError* err = document->getError(i);
                if (err->getSeverity() == libsbml::LIBSBML_SEV_WARNING || err->getSeverity() == libsbml::LIBSBML_SEV_ERROR) {
                    std::string severity;
                    switch (err->getSeverity()) {
                        case libsbml::LIBSBML_SEV_ERROR: severity = "error"; break;
                        case libsbml::LIBSBML_SEV_FATAL: severity = "fatal"; break;
                        case libsbml::LIBSBML_SEV_WARNING: severity = "warning"; break;
                        default: severity = "info"; break;
                    }
                    errors.push_back({err->getLine(), err->getMessage(), severity});
                }
            }
        }
    }

    printErrorsAsJSON(errors);
    delete document;
    return 0;
}
