# summary

Push SharinPix form templates to Salesforce org.

# description

Uploads SharinPix form templates from local JSON files to the connected Salesforce org. This command reads form templates from the local directory and creates or updates corresponding records in Salesforce. Existing forms will be updated unless the force flag is used to skip them.

# flags.org.summary

The Salesforce org to push form templates to.

# flags.org.description

The target Salesforce org where the SharinPix form templates will be uploaded and stored.

# examples

- Push all form templates to the default org:

  <%= config.bin %> <%= command.id %>

- Push form templates to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

# info.created

Created form template %s

# info.updated

Updated form template %s

# info.summary

Push completed: %d forms uploaded, %d forms failed, %d forms skipped
