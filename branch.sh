#!/bin/bash



branch_name=$1



if [ $? -ne 1 ]; then
   echo "Usage: $0 <branch_name>"
   exit 1
fi

checkout () {
    git checkout $branch_name
}

create_branch () {
    git checkout -b $branch_name
}

if git rev-parse --verify $branch_name >/dev/null 2>&1; then
    echo "Branch '$branch_name' already exists. Checking it out."
    checkout
else
    echo "Branch '$branch_name' does not exist. Creating and checking it out."
    create_branch
fi