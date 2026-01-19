# summary

Pull SharinPix form templates from Salesforce org.

# description

Retrieves all SharinPix form templates from the connected Salesforce org and saves them as JSON files in the local sharinpix/forms directory. This command fetches the form template metadata and downloads the actual form definition files.

# flags.org.summary

The Salesforce org to pull form templates from.

# flags.org.description

The target Salesforce org containing the SharinPix form templates to be pulled.

# flags.csv.summary

Also generate CSV files from the downloaded JSON form definitions.

# flags.csv.description

When enabled, after downloading all form templates as JSON into `sharinpix/forms`, the command runs the JSON-to-CSV conversion (same as `sharinpix:form:json2csv`).

# examples

- Pull all form templates from the default org:

  <%= config.bin %> <%= command.id %>

- Pull form templates from a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Pull form templates and also generate CSV files:

  <%= config.bin %> <%= command.id %> --csv

# info.hello

Pulled form template %s from %s
