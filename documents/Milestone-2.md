# Summary of Deliverables

Milestone 2 and its associated deliverables are available for viewing at
https://github.com/dasher-project/redash/projects/2

- Publish code style guidelines (#44)
  - Code style guidelines can be found [here](https://github.com/dasher-project/dasher-web/blob/main/documents/Development.md) and the source code is automatically scanned for
    violations via Github Action
- Automate CI build for existing targets (#71)
  - Builds are automatically made for desktop applications and distributed through Github [here](https://github.com/dasher-project/dasher-electron/releases)
- Select target platforms (#70)
  - Dasher will target Windows, MacOS, and Linux as an Electron native web application. Mobile devices will have custom keyboards
- Rename branch (#76)
  - Branches referencing master have all been renamed to main
- Sign Windows and Mac builds (#92)
  - Dasher desktop code is now signed on mainstream desktop platforms
- Mozolm integration
  - Dasher electron can now run with Mozolm text prediction
- Rename repo (#77)
  - The repository is now renamed to Dasher-Web to better describe application structure
