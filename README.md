# Code library (CodBi)

A formcycle plugin developed as a joint cooperation of the Bavarian formcycle developer community. Adds additional
features to forms and the form designer.

WIP/TODO

## Installation

Install the plugin via the plugin menu in the formcycle backend. You can install it as either as a client-scoped or
system-scoped plugin.

This will make several settings available in the form designer within the `form` tab (the properties panel on the
right-hand side).

## Features

This plugin provides a JavaScript library that adds new functions to your forms. In particular:

WIP/TODO

## Localization

You can customize localized messages in the form by editing the I18N variables in the backend (`Files & templates` ->
`I18N variables`). The plugin only ships with support for German and English, this lets you support other languages as
well. The I18N keys and their default values are as follows:

* `TODO` - default value

## Adding new configuration templates

To add a new configuration template for the code library that the user can select in the form designer:

* Open `src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-config-template.properties`
  and a new line with the technical name of the template.
* Open each `src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/i18n_*.properties` and
  add a localized string for the new template for each language. (The key should be called
  `designer.property.config_template.option.NAME`).
* Add a TypeScript file with the contents of the template in
  `src/main/web/packages/form/src/index-config-template-NAME.ts`

Note: The __technical name must contain only letters, numbers, and dashes__ (0-9, a-z, A-Z, -).

## Development

This is a [Maven](https://maven.apache.org/) project that requires Maven to build. It also uses
[yarn](https://yarnpkg.com/) for the frontend resources. You do not need to install yarn or node.js, the
[frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin) automatically downloads and installs the
required tools locally.

> The following assumes you are using Linux or macOS. For Windows, substitute `./mvnw` with `mvnw.cmd`.
> 

### Build

See also the IDE section below. To build the plugin via the command line:

```shell
./mvnw clean package
```

For quick builds with non-minified resources and no tests, use:

```shell
./mvnw package -P dev
```

To start a formcycle server (on port 8080 if free) with the plugin, use:

```shell
./mvnw fc-server:run-ms-war
```

Then open [http://localhost:8080/xima-formcycle](http://localhost:8080/xima-formcycle) in your browser. The default
username and password are `sadmin / admin`.

To build and upload the plugin to the locally running formcycle server:

```shell
./mvnw -P dev fc-deploy:deploy 
```

(If port 8080 was not free, the server will have started on another free port such as 8081. In this case,
you need to add `-DfcDeployUrl=http://localhost:PORT/xima-formcycle` to the command.)

### Test

Tests are run automatically during the build. To run the tests explicitly:

```shell
./mvnw test
```

To run the frontend tests explicitly via Jest for a particular package:

```shell
cd src/main/web/packages/form
yarn test
```

### IDE

For common IDEs, there are some configurations in the `ide` folder. These are pre-configured settings for VSCode,
IntelliJ, and Eclipse.

* __Eclipse__ Several launch configurations, e.g. for starting a formcycle server with the plugin installed, and to
  upload the plugin to a running server.
  * You may need to install the [Enhanced Kotlin for Eclipse](https://github.com/bvfalcon/kotlin-eclipse-2024).
  * Eclipse does not support [Maven Wrapper](https://maven.apache.org/wrapper/). You may need to `-Denforcer.skip` when
    you see the build fail due to the wrong Maven version getting used.
* __IntelliJ__ Several run configurations, e.g. for starting a formcycle server with the plugin installed, and to upload
  the plugin to a running server.
  * Make sure you also set the default encoding for Java properties files to UTF-8, see `Editor` -> `File Encodings`
    -> `Default encoding for properties files`. 
  * To regenerate auto generated resources, open the Maven window and click on the regenerate button in the toolbar at
    the top.
* __Visual Studio Code__ A workspace file with all workspaces configured. Just go to `File` ->
  `Open Workspace from File` and select file in the `ide/vscode` folder.
  * The workspace also contains a few extension recommendations that you should install.
  * When you first open a TypeScript file, the IDE will ask for permission, click on `Allow` to enable TypeScript
    support.

We recommend IntelliJ for the backend Kotlin code and Visual Studio Code for the frontend CSS + TypeScript code.

Note: There are some auto-generated files, such as
`target/generated-sources/com/github/xima/xima_formcycle_entwicklerkreis/fc/plugin/codbi/EMessageKey.kt`.
If you are using IntelliJ, you may need to press the `Generate Sources` button at the top of the Maven window.

### Debugging

For the server-side Kotlin code: You can attach to the JVM process via any remote debugging tool of your choice. When
you start the formcycle server  via the IDE in debugging mode, you should be able to simply set a breakpoint anywhere in
the JVM code.

For the client-side TypeScript code: You can use the browser's developer tools to debug the code. If you built the
plugin with the `dev` profile, the transpiled JavaScript file will contain an inline source map that lets your browser
show you the original TypeScript code in the debugger.

### Code style / formatting

We use [spotless](https://github.com/diffplug/spotless/blob/main/plugin-maven/README.md) to format all code. There's
also a git hook that's installed automatically and formats code upon commit. If you want to format the code manually,
you can run:

```shell
./mvnw spotless:apply
```

This will format all code in the project.

Note: For Kotlin, this uses [ktfmt](https://facebook.github.io/ktfmt/). They have a plugin for IntelliJ. If you use it,
just leave the code style to the default value `Meta`.  For CSS and TypeScript, this uses[biome](https://biomejs.dev/).
They have an extension for Visual Studio Code.

### Project structure

**Code generation**

The folder `/home/awa/git/CodBi-Dev/src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/`
contains several properties files:

* `constants.properties` - Constant strings that are used in the Kotlin and TypeScript code. For example, contains
  the technical names of the additional properties available in the form designer. 
* `i18n_*.prpoerties` - Localized strings for the Kotlin and TypeScript code.
* `codbi-config-template.properties` - List of available configuration templates for the code library. The key is an
  arbitrary identifier, the value is used to identify the template. Usually key is equal to the value.

These are needed by both the Kotlin and TypeScript code. To ensure consistency, the Maven build generates Kotlin files
and TypeScript files from these properties files. To generate these files manually, run the `generate-sources` Maven
goal.

```shell
./mvnw generate-sources
```

Your IDE of choice may do this automatically, or may  have a button to do this.

**Backend (Kotlin)**

The backend code uses Kotlin, with Maven as a package manager. All code resides in the package
`com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi`.

**Frontend (CSS + TypeScript)**

The frontend CSS and TypeScript resources are in the `src/main/web` folder. It uses [Yarn Berry](https://yarnpkg.com/)
as the package manager, with [PnP](https://yarnpkg.com/features/pnp) enabled. The project consist of the root package
and 3 sub packages in the `packages` folder. Each package is also a separate Yarn workspace:

* `packages/common` - Common code needed by the other 2 packages.
* `packages/designer` - Code for the form designer, e.g. to add new properties to the form designer.
* `packages/form` - Code for the web form, i.e. the actual code library, such as additional validator functions etc.

We use TypeScript to ensure the code is consistent and conforms to the formcycle API. formcycle provides packages that
contain the types for the form designer API (`@de-xima/fc-form-designer`) and the web form API
(`@de-xima/fc-form-renderer`).

For simplicity, we use plain CSS (no preprocessor such as SASS), but allow recent CSS features such as
[nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting). The CSS gets processed by
[postcss](https://postcss.org/) during the build to be compatible with older browsers.

Unit tests use [Jest](https://jestjs.io/).
