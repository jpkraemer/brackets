define(function (require, exports, module) {
    'use strict';


	// Load dependent modules
    var DocumentManager     = brackets.libRequire("document/DocumentManager"),
        TextRange           = brackets.libRequire("document/TextRange").TextRange,
        EditorManager       = brackets.libRequire("editor/EditorManager"),
        InlineWidget        = brackets.libRequire("editor/InlineWidget").InlineWidget,
        Commands            = brackets.libRequire("command/Commands"),
        CommandManager      = brackets.libRequire("command/CommandManager");

    var Showdown            = require('extensions/user/markdown/showdown.js');

    var ShowdownConverter = new Showdown.converter();
        /**
     * @constructor
     * @extends InlineWidget
     */
    function InlineMarkdownViewer(markdownString) {
        InlineWidget.call(this);

        this._markdownString = markdownString;
    }
    InlineMarkdownViewer.prototype = new InlineWidget();
    InlineMarkdownViewer.prototype.constructor = InlineMarkdownViewer;
    InlineMarkdownViewer.prototype.parentClass = InlineWidget.prototype;

    InlineMarkdownViewer.prototype.$contentDiv = null;

    InlineMarkdownViewer.prototype._markdownString = '';

    InlineMarkdownViewer.prototype._renderMarkdown = function () {
        var html = ShowdownConverter.makeHtml(this._markdownString);
        this.$contentDiv.empty();
        this.$contentDiv.append(html);
    };

    InlineMarkdownViewer.prototype.load = function (hostEditor) {
        this.parentClass.load.call(this, hostEditor);
        
        // Create DOM to hold editors and related list
        this.$contentDiv = $(document.createElement('div')).addClass("inlineEditorHolder");
        
        // render
        this._renderMarkdown();

        // attach to main container
        this.$htmlContent.append(this.$contentDiv);
        
        // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
        // this.sizeInlineWidgetToContents(true, true);
        setTimeout(this.sizeInlineWidgetToContents.bind(this, true, true), 0);
    };

    /**
     * Called any time inline is closed, whether manually (via closeThisInline()) or automatically
     */
    InlineMarkdownViewer.prototype.onClosed = function () {
        this.parentClass.onClosed.call(this); // super.onClosed()
    };

    /**
     * Sizes the inline widget height to be the maximum between the rule list height and the editor height
     * @override 
     * @param {boolean} force the editor to resize
     * @param {boolean} ensureVisibility makes the parent editor scroll to display the inline editor. Default true.
     */
    InlineMarkdownViewer.prototype.sizeInlineWidgetToContents = function (force, ensureVisibility) {
        // Size the code mirror editors height to the editor content
        // this.parentClass.sizeInlineWidgetToContents.call(this, force);
        // Size the widget height to the max between the editor content and the related rules list
        var widgetHeight = this.$htmlContent[0].scrollHeight;
        this.hostEditor.setInlineWidgetHeight(this, widgetHeight, ensureVisibility);

        // The related rules container size itself based on htmlContent which is set by setInlineWidgetHeight above.
        // this._updateRelatedContainer();
    };

	module.exports = InlineMarkdownViewer;

}); 