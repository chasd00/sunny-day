# Sunny Day

[![NPM](https://img.shields.io/npm/v/@chasd00/sunny-day.svg?label=sunny-day)](https://www.npmjs.com/package/@chasd00/sunny-day) [![Downloads/week](https://img.shields.io/npm/dw/@chasd00/sunny-day.svg)](https://npmjs.org/package/@chasd00/sunny-day) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/chasd00/sunny-day/main/LICENSE.txt)

## About

This is a Salesforce CLI plugin containing handy metadata analysis utilities. I created this plugin to get metadata processing functionality that I find useful into the hands of all Salesforce developers/administrators.

## `ps2csv` Usage Examples

1. Output all user permissions for a permission set with name my_ps as CSV and make the first column the permission name.

   ```
   sf sday ps2csv --permissionset my_ps --permission userPermissions
   ```

2. Same as above but now write the output to a file.

   ```
   sf sday ps2csv --permissionset my_ps --permission userPermissions --outputfile user_perms.csv
   ```

   Note: If your output filename ends with .xlsx then an Excel spreadsheet is created instead of a plain text/csv file

3. Output object level permissions

   ```
   sf sday ps2csv --permissionset my_ps --permission objectPermissions
   ```

4. Output field level permissions from a project in another folder.

   ```
   sf sday ps2csv --projectdir ../my_other_sandbox --permissionset my_ps --permission fieldPermissions
   ```

5. Get the full list of options and more info.

   ```
   sf sday ps2csv --help
   ```

## `psg2csv` Usage Examples

Command `psg2csv` works just `ps2csv` above except it analyzes PermissionSetGroups. `psg2csv` combines all Permission Sets that make up the group and also applies the Muting Permission Set if one exists.

1. Output all user permissions for a permission set group with name my_ps_group as CSV.

   ```
   sf sday psg2csv --permissionsetgroup my_ps_group --permission userPermissions
   ```

## `xlf2csv` Usage Examples

Command `xlf2csv` reads a translation file exported from Tranlations Workbench in XLIFF format and then outputs CSV.

1. Output to stdout

   ```
   sf sday xlf2csv --file ./translations/my_translation_file.xlf
   ```

2. Write the output to a spreadsheet

   ```
   sf sday xlf2csv --file ./translations/my_translation_file.xlf --outputfile translations.xlsx
   ```

## Agent Usage

1. Pipe stdout to an agent for more processing.

   `sf sday ps2csv --permissionset my_ps --permission userPermissions | claude -p "what granted permissions are related to sites or communities?"`

## Install

To install the latest version:

```bash
sf plugins install @chasd00/sunny-day
```

If you don't want to install the official release you can clone this repository and link it to your `sf` command:

```bash
# Clone the repository
git clone git@github.com:chasd00/sunny-day.git

# Install the dependencies and compile
yarn && yarn build

# Link sunny-day to your sf cli
sf plugins link .
```

## Issues

Log any issues you find here https://github.com/chasd00/sunny-day/issues

## Roadmap/Wants

- psVScsv: given a PS name, path to a CSV, and permission type compare the PS and CSV then output any differences. Used to ensure permission sets balance to a specification spreadsheet. (maybe a psgVScsv too)

- --explode flag on psg2csv that does not combine the permission sets that make up the group and outputs each permisson set and its permission in the output file.

## Changelog

- 6/27/2026 - version 1.2.1 released
  - fixed a bug in psg2csv related to applying muting permission sets
  - fixed a bug when a permission is specified but doesn't exist in the permissionset
  - fixed a bug related to CSV output, under certain conditions it will fail with an error
