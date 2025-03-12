<div align="center">
    <img src="media/notter.png" alt="logo" width="200"/>
</div>

# Notter

Notter is a VSCode plugin that helps you manage TODOs within your codebase.
I realized that the already existing solutions are either too bloated with unneccesary features or too restrictive since they treat TODOs as simple comments in your source files. Whereas, I think there is more to a TODO line in a codebase, and it could make developers' lives easier.

That's why when you initialize a Notter instance, it creates a sqlite database under /.notter folder in your code base. It may sound like an overkill at first, however this gives you more possibilites in the long run. The core functionality of Notter is packed in the Python package called **notter** (https://github.com/taylandogan/notter). And this codebase **notter-vscode** is simply a frontend / UI for that. Therefore, technically you can install the **notter** package separately and use it in your CI/CD pipeline. This would give you the ability to block your builds, if:

- There are more than X unsolved/unattended TODOs in the codebase
- There is a TODO with a deadline within X days
- There is a TODO with priority X

The idea is to track TODOs in a more rigorous way to prevent disruptions on PROD environment due to a forgotten TODO like:

```
// TODO: Update the certificate before Nov 23rd
```

## Features

Currently, Notter is able to provide the following functionality:

- Visualize TODOs in your codebase in a collapsable tree view
- Jump into a TODO location by clicking on it on the tree view
- Search TODOs by a keyword
- Export all your TODOs into a .json file


Soon it will provide more functionality such as:
- Assigning priorities to your TODOs
- Setting a deadline for TODOs
- Warning/reminding developers about the TODOs within X days of a deadline

## Requirements

As mentioned earlier, Notter VSCode plugin actually depends on a Python package called **Notter** (https://github.com/taylandogan/notter).
But the Python package comes with the plugin already along with all the dependencies as a single executable file of size ~9MBs at the moment.
And this executable is generated only for MacOS for the time being. Thus, it is not possible to use Notter VSCode plugin using other operating systems for now. (It may still function properly on any UNIX based system)

## Extension Settings

This extension add the following configurations:

- `notter.projectSourceFolder`: Full path of the source folder that you want Notter to work on.

## Release Notes

To be updated...

### 0.1.0

Initial release of Notter VSCode plugin that can discover and display TODOs and comments (as NOTEs).

<!-- ### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z. -->

---
