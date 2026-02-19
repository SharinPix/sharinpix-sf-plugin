# summary

Generate CSV files from SharinPix form JSON definitions.

# description

Scans the local `sharinpix/forms` directory for SharinPix form JSON definition files and generates corresponding CSV files. The CSV files contain a header row built from all element keys and one row per element. Nested values are stringified.

# flags.edit.summary

Launch SharinPix CLI CSV editor after conversion

# flags.edit.description

When set (default), opens a lightweight web CSV editor in your browser with a dropdown of all CSV files. Use --no-edit to skip.

# flags.port.summary

Port for the SharinPix CLI CSV editor server

# flags.port.description

Port for the local editor (0 = random). Use with --no-open to print the URL.

# flags.recursive.summary

Include subfolders in file list

# flags.recursive.description

List CSV files in subfolders of the output directory. Use --no-recursive for top-level only.

# flags.open.summary

Open SharinPix CLI CSV editor in browser

# flags.open.description

When set (default), opens the SharinPix CLI CSV editor URL in your browser. Use --no-open to only print the URL.

# examples

- Generate CSV files for all local SharinPix form JSON definitions:

  <%= config.bin %> <%= command.id %>

- Generate CSV files without launching the SharinPix CLI CSV editor:

  <%= config.bin %> <%= command.id %> --no-edit

- Run SharinPix CLI CSV editor on a fixed port without opening the browser:

  <%= config.bin %> <%= command.id %> --port 3456 --no-open

# info.converted

Converted %s to CSV

# info.skipped

Skipped %s: %s

# info.summary

Conversion completed: %d file(s) converted, %d file(s) skipped

# info.editorStarting

SharinPix CLI CSV editor at %s (Ctrl+C to stop)

# info.noCsvFiles

No CSV files in output folder. Skipping SharinPix CLI CSV editor.

# error.directoryNotFound

Directory %s not found or could not be read: %s

# error.noElementsArray

No 'elements' array found

# error.emptyElementsArray

Empty 'elements' array
