# summary

Convert a portion of a Permission Set Group to CSV.

# description

Output filtered Permission Set Group data to stdout or a file. Flags let you set the permissions to extract, output filename, project directory and other things.

# flags.permissionsetgroup.summary

Permission Set Group

# flags.permissionsetgroup.description

Permission Set Group developer name, leave off ".permissionsetgroup-meta.xml". Or don't, it doesn't matter.

# flags.permission.summary

Which permissions you're interested in

# flags.permission.description

Allows you to filter and extract specific classes of permissions like like Object, Field, or User permissions.

# flags.projectdir.summary

Project path

# flags.projectdir.description

Set the path to the project if you're not executing the command from a SF project root directory.

# flags.outputfile.summary

Output filename

# flags.outputfile.description

If you want the output to goto a file instead of stdout (and without using a shell redirection) then you must specify an output filename. Note, if your filename ends with .xlsx then an Excel Spreadsheet is created otherwise a standard text/csv file will be created.

# examples

From a permission set group with developer name my_permissionsetgroup located in a different project folder than the current working directory, extract all the field level permissions to a file named psg-fields.csv.

- <%= config.bin %> <%= command.id %> -d ~/prod-sf-project -p my_permissionsetgroup -r fieldPermissions -f psg-fields.csv

From the root directory of a project, extract and display all the user permissions from a permission set group with developer name system_support.

- <%= config.bin %> <%= command.id %> -p system_support -r userPermissions
