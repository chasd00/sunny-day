# summary

Convert a portion of a Permission Set to CSV.

# description

Output filtered permission Set data to stdout or a file. Flags let you set the permissions to extract and which column should come first in the output such as field name.

# flags.permissionset.summary

Permission Set

# flags.permissionset.description

Permission Set developer name, leave off ".permissionset-meta.xml". Or don't, it doesn't matter.

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

If you want the output to goto a file instead of stdout (and without using a shell redirection) then you must specify an output filename.

# flags.firstcol.summary

First column of the CSV data

# flags.firstcol.description

Allows you to specify what the first column should be. For example, when filtering for field permissions it's useful to make the field name the first column in the CSV for readability. See the examples below

# examples

From a permission set with developer name my_permissionset located in a different project folder than the current working directory, extract all the field level permissions to a file named ps-fields.csv and make the first column field name.

- <%= config.bin %> <%= command.id %> -d ~/prod-sf-project -p my_permissionset -r fieldPermissions -f ps-fields.csv -c field

From the root directory of a project, extract and display all the user permissions from a permission with developer name system_support. Output userPermission name as the first column.

- <%= config.bin %> <%= command.id %> -p system_support -r userPermissions -c name
