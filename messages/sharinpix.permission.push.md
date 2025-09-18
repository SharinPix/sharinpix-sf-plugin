# summary

Push SharinPix permissions to Salesforce org.

# description

Uploads SharinPix permissions from local JSON files to the connected Salesforce org. This command reads permission configurations from the local directory and creates or updates corresponding records in Salesforce. The sharinpix**Json**c field will be updated with the JSON configuration data.

# flags.org.summary

The Salesforce org to push SharinPix permissions to.

# flags.org.description

The target Salesforce org where the SharinPix permissions will be uploaded and stored.

# flags.delete.summary

Delete SharinPix permissions from org that no longer have corresponding local files.

# flags.delete.description

When enabled, this flag will delete SharinPix permission records from the Salesforce org if their corresponding local JSON files are missing. Use with caution as this operation cannot be undone.

# examples

- Push all SharinPix permissions to the default org:

  <%= config.bin %> <%= command.id %>

- Push SharinPix permissions to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Push SharinPix permissions and delete orphaned records:

  <%= config.bin %> <%= command.id %> --delete

# info.created

Created SharinPix permission %s

# info.updated

Updated SharinPix permission %s

# info.skipped

Skipped SharinPix permission %s (no changes detected)

# info.deleted

Deleted SharinPix permission %s

# info.summary

Push completed: %d permissions uploaded, %d permissions failed, %d permissions skipped, %d permissions deleted
