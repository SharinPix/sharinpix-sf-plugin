# summary

Push SharinPix form templates to Salesforce org.

# description

Uploads SharinPix form templates from local JSON files to the connected Salesforce org. This command reads form templates from the local directory and creates or updates corresponding records in Salesforce. Existing forms will be updated unless the force flag is used to skip them.

# flags.org.summary

The Salesforce org to push form templates to.

# flags.org.description

The target Salesforce org where the SharinPix form templates will be uploaded and stored.

# flags.delete.summary

Delete form templates from org that no longer have corresponding local files.

# flags.delete.description

When enabled, this flag will delete form template records from the Salesforce org if their corresponding local JSON files are missing. Use with caution as this operation cannot be undone.

# examples

- Push all form templates to the default org:

  <%= config.bin %> <%= command.id %>

- Push form templates to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Push form templates and delete orphaned records:

  <%= config.bin %> <%= command.id %> --delete

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
