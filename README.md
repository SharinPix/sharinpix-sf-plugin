# SharinPix Salesforce CLI Plugin

[![NPM](https://img.shields.io/npm/v/@sharinpix/sharinpix-sf-cli.svg?label=@sharinpix/sharinpix-sf-cli)](https://www.npmjs.com/package/@sharinpix/sharinpix-sf-cli) [![Downloads/week](https://img.shields.io/npm/dw/@sharinpix/sharinpix-sf-cli.svg)](https://npmjs.org/package/@sharinpix/sharinpix-sf-cli) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/sharinpix/sharinpix-sf-cli/main/LICENSE.txt)

The SharinPix Salesforce CLI plugin provides tools to interact with SharinPix form templates and permissions in your Salesforce orgs. This plugin allows you to pull and push form templates and permissions from/to your Salesforce org, saving them as local JSON files for version control and deployment management.

## Learn about `sf` plugins

Salesforce CLI plugins are based on the [oclif plugin framework](<(https://oclif.io/docs/introduction.html)>). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](#tooling) used by Salesforce.

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is required to keep these tests active in your plugin if you plan to have it bundled.

### Tooling

- [@salesforce/core](https://github.com/forcedotcom/sfdx-core)
- [@salesforce/kit](https://github.com/forcedotcom/kit)
- [@salesforce/sf-plugins-core](https://github.com/salesforcecli/sf-plugins-core)
- [@salesforce/ts-types](https://github.com/forcedotcom/ts-types)
- [@salesforce/ts-sinon](https://github.com/forcedotcom/ts-sinon)
- [@salesforce/dev-config](https://github.com/forcedotcom/dev-config)
- [@salesforce/dev-scripts](https://github.com/forcedotcom/dev-scripts)

### Hooks

For cross clouds commands, e.g. `sf env list`, we utilize [oclif hooks](https://oclif.io/docs/hooks) to get the relevant information from installed plugins.

This plugin includes sample hooks in the [src/hooks directory](src/hooks). You'll just need to add the appropriate logic. You can also delete any of the hooks if they aren't required for your plugin.

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Usage

```bash
sf org login web
sf plugins install @sharinpix/sharinpix-sf-cli

# Pull form templates and permissions from Salesforce
sf sharinpix form pull -o yourusername@salesforce.com
sf sharinpix permission pull -o yourusername@salesforce.com

# Push form templates and permissions to Salesforce
sf sharinpix form push -o yourusername@salesforce.com
sf sharinpix permission push -o yourusername@salesforce.com

# Push with deletion of orphaned records (records that exist in Salesforce but have no corresponding local files)
sf sharinpix form push -o yourusername@salesforce.com --delete
sf sharinpix permission push -o yourusername@salesforce.com -d
```

## Issues

Please report any issues at https://github.com/sharinpix/sharinpix-sf-cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have npm installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:sharinpix/sharinpix-sf-cli

# Install the dependencies and compile
yarn && yarn run build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev sharinpix form pull --target-org myorg@example.com
./bin/dev sharinpix permission pull --target-org myorg@example.com
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Key Features

### Deletion Functionality

Both `form push` and `permission push` commands support a `--delete/-d` flag that provides automatic cleanup of orphaned records:

- **Orphaned Records**: Records that exist in your Salesforce org but no longer have corresponding local JSON files
- **Safety**: Deletion only occurs when the flag is explicitly provided
- **Reporting**: The command reports how many records were deleted, failed, uploaded, and skipped
- **Error Handling**: If a deletion fails, it's logged as a warning and counted in the failed total

**⚠️ Important**: Use the `--delete` flag with caution as deletions cannot be undone. Always ensure you have backups of your data before using this feature.

**Example Workflow**:

1. Pull existing records: `sf sharinpix form pull`
2. Remove unwanted local JSON files
3. Push with cleanup: `sf sharinpix form push --delete`

## Commands

<!-- commands -->

- [`sf sharinpix form pull`](#sf-sharinpix-form-pull)
- [`sf sharinpix form push`](#sf-sharinpix-form-push)
- [`sf sharinpix permission pull`](#sf-sharinpix-permission-pull)
- [`sf sharinpix permission push`](#sf-sharinpix-permission-push)

## `sf sharinpix form pull`

Pull SharinPix form templates from Salesforce org.

```
USAGE
  $ sf sharinpix form pull [--json] [-o <value>]

FLAGS
  -o, --target-org=<value>  The Salesforce org to pull form templates from.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Retrieves all SharinPix form templates from the connected Salesforce org and saves them as JSON files in the local sharinpix/forms directory. This command fetches the form template metadata and downloads the actual form definition files.

EXAMPLES
  Pull all form templates from the default org:

    $ sf sharinpix form pull

  Pull form templates from a specific org:

    $ sf sharinpix form pull --target-org myorg@example.com
```

## `sf sharinpix form push`

Push SharinPix form templates to Salesforce org.

```
USAGE
  $ sf sharinpix form push [--json] [-o <value>] [-d]

FLAGS
  -d, --delete              Delete form templates from org that no longer have corresponding local files.
  -o, --target-org=<value>  The Salesforce org to push form templates to.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Uploads SharinPix form templates from local JSON files to the connected Salesforce org. This command reads form templates from the local directory and creates or updates corresponding records in Salesforce. Existing forms will be updated unless the force flag is used to skip them.

  When the --delete flag is used, the command will also delete form template records from Salesforce that no longer have corresponding local JSON files. Use this flag with caution as deletions cannot be undone.

EXAMPLES
  Push all form templates to the default org:

    $ sf sharinpix form push

  Push form templates to a specific org:

    $ sf sharinpix form push --target-org myorg@example.com

  Push form templates and delete orphaned records:

    $ sf sharinpix form push --delete

  Push to specific org with deletion:

    $ sf sharinpix form push --target-org myorg@example.com --delete
```

## `sf sharinpix permission pull`

Pull SharinPix permissions from Salesforce org.

```
USAGE
  $ sf sharinpix permission pull [--json] [-o <value>]

FLAGS
  -o, --target-org=<value>  The Salesforce org to pull SharinPix permissions from.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Retrieves all SharinPix permissions from the connected Salesforce org and saves them as JSON files in the local sharinpix/permission directory. This command fetches the permission metadata and the JSON configuration data stored in the sharinpix__Json__c field.

EXAMPLES
  Pull all SharinPix permissions from the default org:

    $ sf sharinpix permission pull

  Pull SharinPix permissions from a specific org:

    $ sf sharinpix permission pull --target-org myorg@example.com
```

## `sf sharinpix permission push`

Push SharinPix permissions to Salesforce org.

```
USAGE
  $ sf sharinpix permission push [--json] [-o <value>] [-d]

FLAGS
  -d, --delete              Delete SharinPix permissions from org that no longer have corresponding local files.
  -o, --target-org=<value>  The Salesforce org to push SharinPix permissions to.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Uploads SharinPix permissions from local JSON files to the connected Salesforce org. This command reads permission configurations from the local directory and creates or updates corresponding records in Salesforce. The sharinpix__Json__c field will be updated with the JSON configuration data.

  When the --delete flag is used, the command will also delete SharinPix permission records from Salesforce that no longer have corresponding local JSON files. Use this flag with caution as deletions cannot be undone.

EXAMPLES
  Push all SharinPix permissions to the default org:

    $ sf sharinpix permission push

  Push SharinPix permissions to a specific org:

    $ sf sharinpix permission push --target-org myorg@example.com

  Push SharinPix permissions and delete orphaned records:

    $ sf sharinpix permission push --delete

  Push to specific org with deletion:

    $ sf sharinpix permission push --target-org myorg@example.com -d
```

<!-- commandsstop -->
