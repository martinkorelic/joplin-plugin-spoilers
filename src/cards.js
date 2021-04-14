module.exports = {
    default: function(context) {
        return {
            plugin: async function(markdownIt, _options) {
                const pluginId = context.pluginId;
                const contentScriptId = _options.contentScriptId;

                markdownIt.block.ruler.after('fence', 'spoiler_card', spoiler_card, {alt: ['paragraph', 'reference', 'blockquote', 'list']});
                
                /*
                const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options, env, self);
                };
                markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
                    let token = tokens[idx];

                    // We detect if card block
                    if (token.info !== 'card') return defaultRender(tokens, idx, options, env, self);

                    // Split the card title and body by :[]:
                    let card = token.content.match(/(?<title>.+)\n:\[(?<body>(?:.|\n)*?)\]:/i);

                    // Return default renderer if formatted wrong
                    if (!card) return defaultRender(tokens, idx, options, env, self);

                    let { title, body } = card.groups;

                    if (!title || !body) return defaultRender(tokens, idx, options, env, self);

                     // Re render markdown content within
                    return `
                    <details> \
                        <summary class="summary-title">${title}</summary>
                        <div class="summary-content">
                        ${markdownIt.render(body)}
                        </div>
                    </details>`;
                }*/
            },
            // Assests such as JS or CSS that should be loaded in the rendered HTML document
            assets: function() {
                return [
                    {
                        name: "./cards.css"
                    } 
                ];
            },
        }
    }
}

function spoiler_card(state, start, end, silent) {

    let lastPos, found = false,
    pos = state.bMarks[start]+ state.tShift[start],
    max = state.eMarks[start],
    next;

    var token;
    let curLine = start;

    if (pos + 2 > max) return false;

    // Check when it starts with ':['
    if (state.src.slice(pos, pos+2) !== ':[') return false;  
    pos += 2;

    // We don't accept empty card formats
    if (state.src.slice(pos, pos+2) == ']:') return false;
    pos += 2;

    if (silent) return true;    

    curLine++;
    // Correct formatting of the title
    if (state.isEmpty(curLine)) return false;

    let title = curLine;

    curLine++;
    // Needs to be atleast one empty line in between for better formatting
    if (!state.isEmpty(curLine)) return false;

    curLine++;
    // Now there needs to be atleast some content before we render the card
    if (state.isEmpty(curLine)) return false;

    // If the formatting is okay, we create new tokens
    /*
    1 means the tag is opening
    0 means the tag is self-closing
    -1 means the tag is closing
    */
    
    state.push('details_open', 'details', 1);

    token = state.push('summary_open', 'summary', 1);
    token.attrs = [[ 'class', 'summary-title' ]];

    token = state.push('inline', '', 0);
    token.map = [ title, title ];
    token.content = state.getLines(title, title+1, state.tShift[title], false).trim();
    token.children = [];

    state.push('summary_close', 'summary', -1);

    token = state.push('spoiler_card_body', 'div', 1);
    token.attrs = token.attr = [[ 'class', 'summary-content' ]];

    // Content starts
    for (next = curLine; !found;) {
        next++;
        
        if (next >= end) {
            break;
        }
        
        pos = state.bMarks[next] + state.tShift[next];
        max = state.eMarks[next];
        
        if (pos < max && state.tShift[next] < state.blkIndent) {
            break;
        }

        // Check if there's only ']:' on the line
        if (state.src.slice(pos, max).length == 2 && state.src.slice(pos, max).trim().slice(-2) == ']:') {
            lastPos = state.src.slice(0, max).lastIndexOf(']:');
            lastLine = state.src.slice(pos, lastPos);
            found = true;
        }
    }

    // We use to render markdown within
    state.md.block.tokenize(state, curLine, next, false);
    
    state.line = next + 1;

    // Finalize body
    state.push('spoiler_body_close', 'div', -1);

    // Finalize details    
    state.push('details_close', 'details', -1);
    return true;
}