[![Build Status](https://travis-ci.org/joelday/vscode-docthis.svg?branch=master)](https://travis-ci.org/joelday/vscode-docthis) [![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amp;business=7YU9WH4ANAB4Q&amp;lc=US&amp;item_name=Document%20This&amp;item_number=vscode-docthis%20extension&amp;currency_code=USD&amp;bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)

# Document This
"Document This" is a Visual Studio Code extension that automatically generates detailed JSDoc comments for both TypeScript and JavaScript files.

![Demo](images/demo.gif)

# Tags
Supports JSDoc and Closure Compiler tags: @class, @description, @enum, @export, @function, @implements, @interface, @param, @private, @returns or @return, @static, @template, @type, @memberOf and @date.

# Options
#### docthis.includeTypes
When enabled, type information is added to comment tags.

Default: true

#### docthis.includeMemberOfOnClassMembers
When enabled, memberOf information is added to comment tags on class members.

Default: true

#### docthis.includeMemberOfOnInterfaceMembers
When enabled, memberOf information is added to comment tags on interface members.

Default": true

#### docthis.includeDescriptionTag
When enabled, JSDoc comments for functions and methods will include @description.
Default: false

#### docthis.enableHungarianNotationEvaluation
When enabled, hungarian notation will be used as a type hint.

Default: false

#### docthis.inferTypesFromNames
When enabled, will use names of params & methods as type hints.

Default: false

#### docthis.includeAuthorTag
When enabled, will add the @author tag.

Default: false

#### docthis.authorName
When docthis.includeAuthorTag is enabled, will add @author tag with this value.

Default: "(Set the text for this tag by adding docthis.authorName to your settings file.)"

#### docthis.includeDateTag
When enabled, will add the @date tag in YYYY-MM-DD format.

Default: false

#### docthis.returnsTag
Put @returns in place of @returns

Default: true

# Commands
## Document This
`Ctrl+Alt+D` and again `Ctrl+Alt+D`

Generates documentation for whatever the caret is on or inside of.

## Trace TypeScript Syntax Node
Prints info about the node ancestry at a given caret position.

## Thank you for using Document This!
