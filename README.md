# Document This
"Document This" is a Visual Studio Code extension that automatically generates detailed JSDoc comments for both TypeScript and JavaScript files.

![Demo](images/demo.gif)

# Functionality
Supports official JSDoc and Closure Compiler tags: @class, @constant, @enum, @export, @function, @implements, @interface, @param, @private, @returns, @static, @template and @type.

# Commands
## Document This
`Windows: Ctrl+Alt+D Ctrl+Alt+D` | `Mac: Cmd+Option+D Cmd+Option+D`

Generates documentation for whatever the caret is on or inside of.
## Document Everything
`Windows: Ctrl+Alt+D Ctrl+Alt+E` | `Mac: Cmd+Option+D Cmd+Option+E`

Generates documentation for all symbols that are supported by the extension.
## Document Everything Visible
`Windows: Ctrl+Alt+D Ctrl+Alt+V` | `Mac: Cmd+Option+D Cmd+Option+V`

Generates documentation for exported, public and protected symbols in the document.

## Thank you for using Document This!
[![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amp;business=7YU9WH4ANAB4Q&amp;lc=US&amp;item_name=Document%20This&amp;item_number=vscode-docthis%20extension&amp;currency_code=USD&amp;bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)

## Changes

### 0.1.16
- @extends and @implements tags now contain type parameters for extended and implemented types.
- Extension is activated at startup and lazily initialized internally so that a better error message can be shown when a .ts/.js document hasn't been opened yet.
- Errors now have a "Report Issue" button that opens a pre-filled GitHub issue form.