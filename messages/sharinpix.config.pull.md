# summary

Pull organization config from SharinPix API.

# description

Downloads the organization configuration from the SharinPix API and saves it to a local JSON file. This command connects to your Salesforce org to obtain an authentication token, then fetches the config from the SharinPix API endpoint.

# flags.org.summary

The Salesforce org to authenticate with.

# flags.org.description

The Salesforce org used to obtain the authentication token for accessing the SharinPix API.

# examples

- Pull organization config using the default org:

  <%= config.bin %> <%= command.id %>

- Pull organization config from a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

# info.success

Successfully pulled organization config to sharinpix/configs/config.json

# error.failed

Failed to pull organization config: %s

# error.notFound

Config file not found at sharinpix/configs/config.json
