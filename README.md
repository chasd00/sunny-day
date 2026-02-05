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

## Roadmap

1.2 release (Targeting April 2026):

- adding a 'compare' flag. This will allows the user to compare one permission set (or permission set group) with another and identify differences.
- Add a "Contributing" section to the README laying out how to contribute to the project.

## Changelog

- 2/4/2026 - version 1.1.2 released
  - added command psg2csv that works just like ps2csv but analyzes Permission Set Groups and takes the Muting Permission Set into account if one exists

- 1/13/2026
  - sensible column ordering by default, now Permission Set name and object/field/user permission name are always the first two columns of the output
  - flag `--firstcol` is now marked as deprecated and does nothing
  - added support for writing directly to an Excel file if flag `--outputfile` has extension .xlsx
  - refactored a lot of the Permission Set parsing code for reusability when it's time to add psg2csv
  - added a CLAUDE.md file so Claude Code can help out where it can
- 1/9/2026 - version 1.0.0 released
