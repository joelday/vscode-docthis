[![Build Status](https://travis-ci.org/joelday/vscode-docthis.svg?branch=master)](https://travis-ci.org/joelday/vscode-docthis)

# Document This
"Document This" is a Visual Studio Code extension that automatically generates detailed JSDoc comments for both TypeScript and JavaScript files.

![Demo](images/demo.gif)

# Functionality
Supports JSDoc and Closure Compiler tags: @class, @description, @enum, @export, @function, @implements, @interface, @param, @private, @returns, @static, @template, @type and @memberOf.

# Commands
## Document This
`Ctrl+Alt+D` and again `Ctrl+Alt+D`

Generates documentation for whatever the caret is on or inside of.
## Document Everything
`Ctrl+Alt+D` and after `Ctrl+Alt+E`

Generates documentation for all symbols that are supported by the extension.
## Document Everything Visible
`Ctrl+Alt+D` and after `Ctrl+Alt+V`

Generates documentation for exported, public and protected symbols in the document.

## Trace TypeScript Syntax Node
Prints info about the node ancestry at a given caret position.

## Thank you for using Document This!
[![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amp;business=7YU9WH4ANAB4Q&amp;lc=US&amp;item_name=Document%20This&amp;item_number=vscode-docthis%20extension&amp;currency_code=USD&amp;bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)

## Changes
### 0.3.10
- Adds option to infer param type & method return type from names if no type info is available. Controlled using the `docthis.inferTypesFromNames` option.

### 0.3.7
- Upgraded TypeScript and VSCode internals.

### 0.3.6
- Adds .vue extension support.

### 0.3.5
- Adds support for hungarian notation for functions and methods. Controlled using the `docthis.enableHungarianNotationEvaluation` option.

### 0.3.4
- Adds support for including a @description tag for functions and methods. Controlled using the `docthis.includeDescriptionTag` option.

### 0.3.3
- Adds support for jumping to the description location of the inserted comment. Controlled using the `docthis.enableJumpToDescriptionLocation` option.
- Adds support for the @memberOf tag for properties and methods of a class. Controlled using the `docthis.includeMemberOfOnClassMembers` option.
- Adds support for the @memberOf tag for properties and methods of an interface. Controlled using the `docthis.includeMemberOfOnInterfaceMembers` option.

### 0.3.2
- Adds a config option `docthis.automaticForBlockComments` used to disable automatic comments for `/**`.
- Adds a config option `docthis.includeTypes` used to disable insertion of type names in tags.

### 0.3.1
- Fix an indenting issue with '/**' output.
- No longer inserting '/**' output when caret is inside of the documented symbol.

### 0.3.0
- Typing `/**` now automatically attempts a documentation at the typed location.
- No longer emitting arrow function types. [Blocked by #1100](https://github.com/jsdoc3/jsdoc/issues/1100)
- Unknown types now emit `{any}` instead of nothing.
- Improved GitHub issue template.

### 0.2.4
- No longer shows error for jsx and tsx files.

### 0.2.3
- @readonly is automatically added to property "get" accessors that are not accompanied by a "set" accessor.

### 0.2.2
- Fixes issue where nested functions caused @returns to be added to void returning parents.
- Arrow functions were being ignored in various cases.

### 0.2.1
- Add @returns whenever there is an explicit return type other than void.

### 0.2.0
- Support for documenting function expressions in assignment to properties or variables.
- A new "Trace TypeScript Syntax Node" command that prints info about the node ancestry at a given caret position.
- Resolving Mac system key binding collision.

### 0.1.16
- @extends and @implements tags now contain type parameters for extended and implemented types.
- Extension is activated at startup and lazily initialized internally so that a better error message can be shown when a .ts/.js document hasn't been opened yet.
- Errors now have a "Report Issue" button that opens a pre-filled GitHub issue form.
