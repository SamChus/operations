import sys

print(sys.version)
print("Hello, World!")

if sys.version_info >= (3, 8):
    print("You are using Python 3.8 or later.")
else:
    print("You are using an older version of Python.")