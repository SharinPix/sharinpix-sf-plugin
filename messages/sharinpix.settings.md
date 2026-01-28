# summary

Open the SharinPix settings page in a Salesforce org.

# description

Opens the SharinPix settings Lightning page in your default browser for the specified Salesforce org. This command is a convenience wrapper around `sf org open` with the path set to `/lightning/n/sharinpix__SharinPix_setting`.

# flags.org.summary

The Salesforce org to open.

# flags.org.description

The target Salesforce org (username or alias) where the SharinPix settings page should be opened.

# examples

- Open the SharinPix settings page for a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

