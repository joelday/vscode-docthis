### 0.6.0
- Now uses a completion provider instead of automatic insertion when typing '/**'.
No longer conflicts with VSCode's built in JSDoc generation!

### 0.5.0
- Support documentation generation for class methods.

### 0.4.7
- Protecting against error for /** auto documentation.

### 0.4.6
- Fix @type and @memberOf being emitted on the same line.

### 0.4.5
- Add support of @author tag. Controlled using `docthis.includeAuthorTag` and `docthis.authorName` options.
- No more unecessary jump lines for other tags than @description (to match use from usejsdoc.org)

### 0.4.4
- Change casing of @memberof to all lower-case.

### 0.4.3
- Omit @memberOf on unnamed classes.

### 0.4.2
- Support for unnamed classes.

### 0.4.1
- Support for variable assigned function expressions.
- No longer showing error message on /** autocomplete failures.

### 0.4.0
- Now adds documentation as snippets, with tab stops for descriptions!

### 0.3.11
- Support new documents that have not been saved to disk.
- Fixes support for `.vue` files and adds support for `.es6` files.
- Fixes issue with `docthis.automaticForBlockComments` failing to trigger.

### 0.3.10
- Adds option to infer param and return types from names when no type info is available. Controlled using the `docthis.inferTypesFromNames` option.

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
