#!/bin/bash
clear

set -e

folder=$1
file=$2

# Check if the correct number of arguments is provided
if [ $# -ne 2 ]
then
echo "Usage: $0 <folder> <file>"
exit 1
fi

# Create the folder if it doesn't exist
if [ ! -d "$folder" ]
then
mkdir "$folder"
echo "Created folder $folder"
else
echo "Folder already exists"
fi

# Create the file if it doesn't exist
if [ ! -f "$file" ]
then
touch "$folder/$file"
echo "Created a $file under $folder"
else
echo "File already exists"
fi

