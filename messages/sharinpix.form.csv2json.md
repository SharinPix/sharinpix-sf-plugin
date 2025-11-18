# summary

Generate JSON files from SharinPix form CSV definitions.

# description

Scans the local `sharinpix/forms` directory for SharinPix form CSV definition files and generates corresponding JSON files. Each CSV file is expected to have a header row of element keys and one row per element, as produced by the json2csv command.

# examples

- Generate JSON files for all local SharinPix form CSV definitions:

  <%= config.bin %> <%= command.id %>

# info.converted

Converted %s to JSON

# info.skipped

Skipped %s: %s

# info.summary

Conversion completed: %d file(s) converted, %d file(s) skipped

# error.directoryNotFound

Directory %s not found or could not be read: %s

# error.noDataRows

No data rows found

# error.jsonNotFound

Corresponding JSON file %s does not exist

# error.jsonReadFailed

Failed to read JSON file %s: %s

# error.jsonInvalid

Invalid JSON in file %s: %s

# error.jsonNotObject

JSON file %s is not a valid form definition (expected an object)
