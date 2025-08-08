# summary

Pull SharinPix form templates from Salesforce org.

# description

Retrieves all SharinPix form templates from the connected Salesforce org and saves them as JSON files in the local sharinpix/forms directory. This command fetches the form template metadata and downloads the actual form definition files.

# flags.org.summary

The Salesforce org to pull form templates from.

# flags.org.description

The target Salesforce org containing the SharinPix form templates to be pulled.

# examples

- Pull all form templates from the default org:

  <%= config.bin %> <%= command.id %>

- Pull form templates from a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

# info.hello

Pulled form template %s from %s
