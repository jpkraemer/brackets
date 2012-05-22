define(function (require, exports, module) {
    'use strict';


	// Load dependent modules
    var DocumentManager     = brackets.libRequire("document/DocumentManager"),
        TextRange           = brackets.libRequire("document/TextRange").TextRange,
        EditorManager       = brackets.libRequire("editor/EditorManager"),
        InlineWidget        = brackets.libRequire("editor/InlineWidget").InlineWidget,
        Commands            = brackets.libRequire("command/Commands"),
        CommandManager      = brackets.libRequire("command/CommandManager");

    // Third party libs
    var Showdown            = require('showdown');

    // Other extension classes 
    var MarkdownInlineDocumentation = require('MarkdownInlineDocumentation');

    // Global markdown converter object
    var ShowdownConverter = new Showdown.converter();

        /**
     * @constructor
     * @extends InlineWidget
     */
    function InlineMarkdownViewer(startLine, endLine) {
        InlineWidget.call(this);

        this._startLine = startLine;
        this._endLine   = endLine;
    }
    InlineMarkdownViewer.prototype = new InlineWidget();
    InlineMarkdownViewer.prototype.constructor  = InlineMarkdownViewer;
    InlineMarkdownViewer.prototype.parentClass  = InlineWidget.prototype;

    InlineMarkdownViewer.prototype.$contentDiv  = null;

    InlineMarkdownViewer.prototype._startLine   = -1; 
    InlineMarkdownViewer.prototype._endLine     = -1; 

    InlineMarkdownViewer.prototype.markdownInlineDocumentation = null;

    InlineMarkdownViewer.prototype._renderMarkdown = function () {
        var sourceString = ''; 
        for (var i = this._startLine; i<= this._endLine; i++) {
            sourceString += this.hostEditor.getLineText(i) + "\n"; 
        }
        sourceString = sourceString.replace(/^\s*\/\*\*/, '');
        sourceString = sourceString.replace(/\*\/.*/, '');

        var html = ShowdownConverter.makeHtml(sourceString);
        this.$contentDiv.empty();
        this.$contentDiv.append(html);
    };

    InlineMarkdownViewer.prototype.load = function (hostEditor) {
        this.parentClass.load.call(this, hostEditor);

        // Create DOM to hold editors and related list
        this.$contentDiv = $(document.createElement('div')).addClass("inlineMarkdownCommentHolder");
        
        // render
        this._renderMarkdown();

        //remove inherited shadow from main container
        this.$htmlContent.empty();

        // attach to main container
        this.$htmlContent.append(this.$contentDiv);
        
        // ensureVisibility is set to false because we don't want to scroll the main editor when the user selects a view
        // this.sizeInlineWidgetToContents(true, true);
        setTimeout(this.sizeInlineWidgetToContents.bind(this, true, true), 0);

        // register click handler to open an editor for the markdown source
        this.$htmlContent.on("click", this._onClick.bind(this));

        // register a document change observer to refresh the markdown
        var currentDocument = this.hostEditor.document; 
        $(currentDocument).on('change', this._onDocumentChange.bind(this)); 
        this.hostEditor.document.addRef(); // required for memory management in the Document class
    };

    /**
     * Called any time inline is closed, whether manually (via closeThisInline()) or automatically
     */
    InlineMarkdownViewer.prototype.onClosed = function () {
        this.parentClass.onClosed.call(this); // super.onClosed()

        // unregister observers
        this.$htmlContent.off("click", this._onClick.bind(this)); 
        this.hostEditor.document.off("change", this._onDocumentChange.bind(this)); 
        this.hostEditor.document.releaseRef(); // required for memory management in the Document class

        // close an attached editor if present
        if (this.markdownInlineDocumentation) {
            this.hostEditor.removeInlineWidget(this.markdownInlineDocumentation);
            this.markdownInlineDocumentation = null;
        }
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

    /** 
     * On click open an inline editor to edit the Markdown source code. 
     */
     InlineMarkdownViewer.prototype._onClick = function (event) {
        if (this.markdownInlineDocumentation) {
            this.hostEditor.removeInlineWidget(this.markdownInlineDocumentation); 
            this.markdownInlineDocumentation = null;
        }
        else {
            this.markdownInlineDocumentation = new MarkdownInlineDocumentation(this._startLine, this._endLine); 
            this.markdownInlineDocumentation.load(this.hostEditor);
            this.hostEditor.addInlineWidget({line: this._endLine-1, ch:0}, this.markdownInlineDocumentation); 
        }
     }

     /** 
      * On document change we need to update the markdown view eventually
      */ 
    InlineMarkdownViewer.prototype._onDocumentChange = function (event, document, changeList) {

        // check all changes if they concern the comment we display
        var currentChange = changeList; 
        do {
            if ((this._startLine >= changeList.from.line && changeList.to.line >= this._startLine) 
                || (changeList.from.line >= this._startLine && changeList.from.line <= this._endLine)) {
                
                // we need to update the rendered markdown 
                this._renderMarkdown(); 

                // since we updated now anyway, we do no longer care about the other changes
                return; 
            }

            currentChange = currentChange.next; 
        } while (currentChange != null); 
    }

	module.exports = InlineMarkdownViewer;

}); 