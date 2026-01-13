# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sunny Day is a Salesforce CLI plugin that provides metadata analysis utilities for Salesforce developers and administrators. The plugin is built using the oclif framework and integrates with the Salesforce CLI as the `sday` command namespace.

## Commands

### Development

```bash
# Install dependencies
yarn

# Build the project (compiles TypeScript and runs linting)
yarn build

# Compile TypeScript only
yarn compile

# Run linting
yarn lint

# Format code with Prettier
yarn format

# Clean build artifacts
yarn clean

# Clean all artifacts including node_modules
yarn clean-all
```

### Testing

```bash
# Run all tests (unit tests + linting)
yarn test

# Run only unit tests without linting
yarn test:only

# Run NUT (non-unit) tests - integration tests that execute actual CLI commands
yarn test:nuts
```

### Local Development & Installation

```bash
# Link the plugin to your sf CLI for local testing
sf plugins link .

# After linking, test commands with:
sf sday ps2csv --help
```

## Architecture

### Command Structure

Commands are located in `src/commands/` and follow the oclif command structure:
- Commands extend `SfCommand` from `@salesforce/sf-plugins-core`
- Each command has a corresponding message file in `messages/` that defines help text, flag descriptions, and examples
- Command classes define flags, summary, description, examples, and a `run()` method that returns a typed result

### Current Commands

**`ps2csv`** (`src/commands/sday/ps2csv.ts`): Converts portions of a Permission Set to CSV format
- Reads Permission Set metadata XML files from `force-app/main/default/permissionsets/`
- Uses `fast-xml-parser` to parse XML into objects
- Supports filtering by permission type: `objectPermissions`, `fieldPermissions`, `userPermissions`
- Outputs to stdout or file with customizable column ordering
- Expected file location is hardcoded to `force-app/main/default/permissionsets`

### Key Dependencies

- **@salesforce/core**: Provides `SfProject` for project resolution and `Messages` for i18n
- **@salesforce/sf-plugins-core**: Base `SfCommand` class and `Flags` utilities
- **@oclif/core**: Core oclif framework
- **fast-xml-parser**: XML parsing for Salesforce metadata files
- **wireit**: Build orchestration (defined in package.json `wireit` section)

### Testing Structure

Two types of tests:
1. **Unit tests** (`test/**/*.test.ts`): Mock-based tests using `@salesforce/core/testSetup` and Chai
2. **NUT tests** (`test/**/*.nut.ts`): Integration tests using `@salesforce/cli-plugins-testkit` that execute actual CLI commands

Test fixtures are located in `test/testproject/`, which contains a minimal Salesforce project with sample Permission Set files.

### Message Files

Message files in `messages/` use markdown format and define:
- Command summaries and descriptions
- Flag summaries and descriptions
- Examples with templated values (`<%= config.bin %>`, `<%= command.id %>`)

Messages are loaded using `Messages.loadMessages('@chasd00/sunny-day', 'sday.ps2csv')`.

### Build System

The project uses **wireit** for build orchestration:
- Build tasks are defined in the `wireit` section of package.json
- Each task declares its command, input files, output files, and dependencies
- Tasks include: compile, lint, format, test, test:compile, test:only

### TypeScript Configuration

- Extends `@salesforce/dev-config/tsconfig-strict-esm`
- Compiles `src/**/*.ts` to `lib/` directory
- Uses ES modules (package.json has `"type": "module"`)

### Plugin Configuration

The plugin is configured in package.json under the `oclif` key:
- Commands directory: `./lib/commands`
- Binary name: `sf`
- Topic: `sday` with description
- Uses flexible taxonomy for command organization

## Roadmap

**1.1 release (March 2026)**:
- Permission Set Group to CSV command (`psg2csv`)
- Contributing section in README

**1.2 release (April 2026)**:
- Compare flag to identify differences between permission sets/groups
