# summary

Push SharinPix form templates to Salesforce org.

# description

Uploads SharinPix form templates from local JSON files to the connected Salesforce org. This command reads form templates from the local directory and creates or updates corresponding records in Salesforce. Existing forms will be updated unless the force flag is used to skip them.

# flags.org.summary

The Salesforce org to push form templates to.

# flags.org.description

The target Salesforce org where the SharinPix form templates will be uploaded and stored.

# flags.dir.summary

Directory containing form template JSON files.

# flags.dir.description

The local directory path containing the SharinPix form template JSON files to be pushed to Salesforce. Defaults to 'sharinpix/forms'.

# flags.force.summary

Force push all forms, including existing ones.

# flags.force.description

When enabled, forces the push of all form templates even if they already exist in the Salesforce org. Without this flag, existing forms will be updated.

# examples

- Push all form templates to the default org:

  <%= config.bin %> <%= command.id %>

- Push form templates from a specific directory:

  <%= config.bin %> <%= command.id %> --dir /path/to/forms

- Push form templates to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Force push all forms, including existing ones:

  <%= config.bin %> <%= command.id %> --force

# info.created

Created form template %s

# info.updated

Updated form template %s

# info.summary

Push completed: %d forms uploaded, %d forms failed, %d forms skipped
