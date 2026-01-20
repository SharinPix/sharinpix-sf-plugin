# summary

Push all SharinPix assets (forms and permissions) to Salesforce org.

# description

Uploads all local SharinPix form templates and permissions to the connected Salesforce org. This is a convenience command that executes both sharinpix:form:push and sharinpix:permission:push.

# flags.org.summary

The Salesforce org to push assets to.

# flags.org.description

The target Salesforce org where the SharinPix assets will be pushed.

# flags.delete.summary

Delete assets in the org that do not exist locally.

# flags.delete.description

If specified, any form templates or permissions that exist in the org but not in the local project will be deleted.

# examples

- Push all assets to the default org:

  <%= config.bin %> <%= command.id %>

- Push all assets to a specific org:

  <%= config.bin %> <%= command.id %> --target-org myorg@example.com

- Push all assets and delete missing ones from the org:

  <%= config.bin %> <%= command.id %> --delete
