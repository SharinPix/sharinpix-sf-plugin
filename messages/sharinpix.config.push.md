# summary

Push organization config to SharinPix API.

# description

Uploads the organization configuration from a local JSON file to the SharinPix API. This command connects to your Salesforce org to obtain an authentication token, then pushes the config to the SharinPix API endpoint.

# flags.org.summary

The Salesforce org to authenticate with.

# flags.org.description

The Salesforce org used to obtain the authentication token for accessing the SharinPix API.

# examples

- Push organization config using the default org:

  <%= config.bin %> <%= command.id %>

- Push organization config to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

# info.success

Successfully pushed organization config to SharinPix API

# error.failed

Failed to push organization config: %s

# error.notFound

Config file not found at sharinpix/config.json. Run 'sharinpix:config:pull' first or create the file manually.
