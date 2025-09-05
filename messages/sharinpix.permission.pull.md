# summary

Pull SharinPix permissions from Salesforce org.

# description

Retrieves all SharinPix permissions from the connected Salesforce org and saves them as JSON files in the local sharinpix/permission directory. This command fetches the permission metadata and the JSON configuration data stored in the sharinpix**Json**c field.

# flags.org.summary

The Salesforce org to pull SharinPix permissions from.

# flags.org.description

The target Salesforce org containing the SharinPix permissions to be pulled.

# examples

- Pull all SharinPix permissions from the default org:

  <%= config.bin %> <%= command.id %>

- Pull SharinPix permissions from a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

# info.hello

Pulled SharinPix permission %s (%s)
