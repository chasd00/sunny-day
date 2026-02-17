# summary

Convert an XLIFF (.xlf) file to CSV format.

# description

Parses a standard XLIFF file and extracts translation units into a CSV format.

# flags.file.summary

Path to the .xlf file.

# flags.outputfile.summary

Output filename

# flags.outputfile.description

If you want the output to go to a file instead of stdout (and without using shell redirection) then you must specify an output filename. Note, if your filename ends with .xlsx then an Excel Spreadsheet is created otherwise a standard text/csv file will be created.

# examples

Convert a translation file to CSV:

- <%= config.bin %> <%= command.id %> --file translations/en_US.xlf

Convert a translation file to Excel:

- <%= config.bin %> <%= command.id %> --file translations/en_US.xlf --outputfile translations.xlsx
