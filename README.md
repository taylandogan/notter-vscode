# Notter

Notter is a VSCode plugin that helps you manage TODOs or NOTEs within your codebase.
It is currently in development, yet it will have features such as priority setting, reminders, archiving and more.

I realized the already existing solutions are restrictive since they treat TODOs as simple comments in your source files.
Whereas, I think there is more to a TODO line in a codebase, and it could make developers' lives easier.

## Features

Currently, Notter can only visualize the todos and comments in your project. But soon you'll be able to:

- Filter TODOs by keyword
- Prioritize TODOs
- Set a reminder for TODOs
- Export all your TODOs
- Archive TODOs for further analysis
- .. and more

## Requirements

Notter VSCode plugin actually depends on a Python package called Notter (https://github.com/taylandogan/notter).
But the Python package comes with the plugin already along with all the dependencies as a single executable file of size ~5.9MBs at the moment.
And this executable is generated only for MacOS for the time being. Thus, it is not possible to use Notter VSCode plugin using other operating systems for now.

## Extension Settings

This extension contributes the following settings:

- `notter.projectSourceFolder`: Full path of the source folder that you want Notter to work on.

## Known Issues

As mentioned before, Notter VSCode plugin only works for MacOS for the time being (Tested on MacOS Monterey 12.3).
Also the plugin cannot do much other than discovering and displaying TODOs in your codebase at the moment.

## Release Notes

### 0.1.0

Initial release of Notter VSCode plugin that can discover and display TODOs and comments (as NOTEs).

<!-- ### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z. -->

---
