# summary

Pull all SharinPix assets (forms and permissions) from Salesforce org.

# description

Retrieves all SharinPix form templates and permissions from the connected Salesforce org. This is a convenience command that executes both sharinpix:form:pull and sharinpix:permission:pull.

# flags.org.summary

The Salesforce org to pull assets from.

# flags.org.description

The target Salesforce org containing the SharinPix assets to be pulled.

# examples

- Pull all assets from the default org:

  <%= config.bin %> <%= command.id %>

- Pull all assets from a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com
