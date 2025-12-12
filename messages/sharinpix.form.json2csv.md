# summary

Generate CSV files from SharinPix form JSON definitions.

# description

Scans the local `sharinpix/forms` directory for SharinPix form JSON definition files and generates corresponding CSV files. The CSV files contain a header row built from all element keys and one row per element. Nested values are stringified.

# examples

- Generate CSV files for all local SharinPix form JSON definitions:

  <%= config.bin %> <%= command.id %>

# info.converted

Converted %s to CSV

# info.skipped

Skipped %s: %s

# info.summary

Conversion completed: %d file(s) converted, %d file(s) skipped

# error.directoryNotFound

Directory %s not found or could not be read: %s

# error.noElementsArray

No 'elements' array found

# error.emptyElementsArray

Empty 'elements' array
