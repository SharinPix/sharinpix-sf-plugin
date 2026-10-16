# summary

Push SharinPix form templates to Salesforce org.

# description

Uploads SharinPix form templates from local JSON files to the connected Salesforce org. This command reads form templates from the local directory and creates or updates corresponding records in Salesforce. Existing forms will be updated unless the force flag is used to skip them.

# flags.org.summary

The Salesforce org to push form templates to.

# flags.org.description

The target Salesforce org where the SharinPix form templates will be uploaded and stored.

# flags.delete.summary

Delete main form templates whose Id is not the mainId of any local file.

# flags.delete.description

When enabled, delete main form template records whose Id is not the mainId of any local file, including after a rename. A file with no mainId protects nothing. This operation cannot be undone.

# flags.csv.summary

Convert local CSV files to JSON before pushing.

# flags.csv.description

When enabled, the command first runs the CSV-to-JSON conversion (same as `sharinpix:form:csv2json`) on files in `sharinpix/forms`, then proceeds to push the resulting JSON files.

# flags.activate.summary

Activate the pushed form template version.

# flags.activate.description

When enabled, the newly pushed form template version is set as the active version in Salesforce. Without this flag, the version is created but not activated.

# examples

- Push all form templates to the default org:

  <%= config.bin %> <%= command.id %>

- Push form templates to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Push form templates and delete orphaned records:

  <%= config.bin %> <%= command.id %> --delete

- Convert CSV to JSON, then push:

  <%= config.bin %> <%= command.id %> --csv

- Push form templates and activate the new versions:

  <%= config.bin %> <%= command.id %> --activate

# info.created

Created form template %s

# info.updated

Updated form template %s

# info.skipped

Skipped form template %s (no changes detected)

# info.deleted

Deleted form template %s

# info.summary

Push completed: %d forms uploaded, %d forms failed, %d forms skipped, %d forms deleted
