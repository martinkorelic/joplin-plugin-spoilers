module.exports =  {
    default: function(context) {
        const pluginId = context.pluginId;
        console.info(`${pluginId} : Content Plugin default function`);
        
        return {
            plugin: async function(markdownIt, _options) {
                const contentScriptId = _options.contentScriptId;

                markdownIt.block.ruler.after('fence', 'spoiler_block', spoiler_block, {alt: ['paragraph', 'reference', 'blockquote', 'list']});

                markdownIt.inline.ruler.after('escape', 'spoiler_inline', tokenize_spoiler);
                markdownIt.inline.ruler2.after('emphasis', 'spoiler_inline', function (state) {
                    var curr,
                        tokens_meta = state.tokens_meta,
                        max = (state.tokens_meta || []).length;

                    postProcess(state, state.delimiters);

                    for (curr = 0; curr < max; curr++) {
                        if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
                            postProcess(state, tokens_meta[curr].delimiters);
                        }
                    }
                });

                // Inline spoiler open renderer
                const spoiler_open_defaultRender = markdownIt.renderer.rules.spoiler_open || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options, env, self);
                };
                
                const spoiler_inline_open = function(tokens, idx, options, env, self) {

                    const token = tokens[idx];

                    if (token.type !== 'spoiler_open') return spoiler_open_defaultRender(tokens, idx, options, env, self);
                    
                    // Generate a random id to distinguish between events
                    let ranhex = genRanHex(8);
                    // We use a checkbox hack to implement a clickable event
                    return `<input type="checkbox" class="spoiler-inline" id=${ranhex}><label class="spoiler-inline" for=${ranhex}><span class="spoiler-inline">`;
                };

                markdownIt.renderer.rules.spoiler_open = spoiler_inline_open;

                // Inline spoiler close renderer
                const spoiler_close_defaultRender = markdownIt.renderer.rules.spoiler_close || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options, env, self);
                };

                const spoiler_inline_close = function(tokens, idx, options, env, self) {

                    const token = tokens[idx];

                    if (token.type !== 'spoiler_close') return spoiler_close_defaultRender(tokens, idx, options, env, self);
                    
                    return `</span></label>`;
                };

                markdownIt.renderer.rules.spoiler_close = spoiler_inline_close;
                
            },
            // Assests such as JS or CSS that should be loaded in the rendered HTML document
            assets: function() {
                return [

                    /* For some reason this fails when exporting (cannot find the css file in assets)
                    {
                        name: 'spoiler-style.css'
                    }
                    */

                    // Styling of spoiler blocks
                    {
                        inline: true,
                        mime: 'text/css',
                        text: `
                        .spoiler-block {
                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                        0 10px 10px -5px rgba(0, 0, 0, 0.04);
                            width: 100%;
                            color: black;
                            background: #c2c2c2;
                            border-radius: 8px;
                            border: 1px solid #7a7a7a;
                            position: relative;
                            margin-top: 1em;
                            margin-bottom: 1em;
                            display: grid;
                        }

                        .spoiler-block-input {
                            display: none;
                        }

                        label.spoiler-block-title {
                            cursor: pointer;
                        }

                        .summary-title {
                            user-select: none;
                            padding: 0.8em;
                            font-family: monospace;
                            border-radius: 8px;
                            font-size: 18px;
                        }

                        .summary-title:hover {
                            opacity: 0.7;
                        }
                        
                        .summary-title:before {
                            margin-right: 0.3em;
                            font-size: 1.6em;
                            vertical-align: text-top;
                            content: "\u2B9E  ";
                            display: inline-block;
                            transform-origin: center;
                            transition: 200ms linear;
                        }

                        @keyframes open {
                            0% {
                              opacity: 0;
                            }
                            100% {
                              opacity: 1;
                            }
                        }

                        #spoiler-block-body {
                            display: none;
                            animation: open 0.3s ease-in-out;
                        }

                        #spoiler-block-title {
                            cursor: pointer;
                        }

                        input.spoiler-block-input:checked ~ label ~ div#spoiler-block-body {
                            display: block;
                        }

                        input.spoiler-block-input:checked ~ label#spoiler-block-title:before {
                            transform: rotate(90deg);
                        }

                        .summary-content {
                            border-top: 1px solid #7a7a7a;
                            cursor: default;
                            padding: 1em;
                        }

                        /* Styles for exporting */
                        @media print {

                            #spoiler-block-body {
                                display: block;
                                animation: none;
                            }

                            .summary-title:before {
                                content: "";
                            }

                        }
                        `
                    },

                    // Styling of inline spoilers
                    {
                        inline: true,
                        mime: 'text/css',
                        text: `
                        input.spoiler-inline {
                            display: none;
                        }

                        input.spoiler-inline + label.spoiler-inline {
                            cursor: pointer;
                            background: #000;
                            border-radius: 3px;
                            box-shadow: 0 0 1px #ffffff;
                            color: #000;
                            user-select: none;
                            display: inline-flex;
                        }
                        
                        input.spoiler-inline + label.spoiler-inline > span.spoiler-inline {
                            opacity: 0;
                        }

                        input.spoiler-inline:checked + label.spoiler-inline > span.spoiler-inline {
                            background: #0001;
                            color: inherit;
                            box-shadow: none;
                            user-select: text;
                            opacity: 1;
                        }

                        input.spoiler-inline:checked + label.spoiler-inline {
                            background: #0001;
                            color: inherit;
                            box-shadow: none;
                            user-select: text;
                            display: inline-flex;
                        }
                        `
                    }
                ];
            },
        }
    }
}

// Tokenizing the spoiler blocks
function spoiler_block(state, start, end, silent) {

    let found = false,
    pos = state.bMarks[start]+ state.tShift[start],
    max = state.eMarks[start],
    next;

    var token;
    let curLine = start;

    if (pos + 2 > max)
    { 
	    console.info(`spoiler : Exit from 'spoiler_block' : no data`);
    	return false;
    }

    // Check when it starts with ':['
    if (state.src.slice(pos, pos+2) !== ':[')  
    { 
	    console.info(`spoiler : Exit from 'spoiler_block' : no start token`);
    	return false;
    }
    pos += 2;

    // We don't accept empty card formats
    if (state.src.slice(pos, pos+2) == ']:')
    { 
	    console.info(`spoiler : Exit from 'spoiler_block' : empty card`);
    	return false;
    }
    pos += 2;

    if (silent) return true;    

    console.info(`spoiler : Entry into 'spoiler_block' : real block at ${curLine} - ${end} (${state.level})`);
    
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
    
    // Spoiler block
    token = state.push('spoiler_block_open', 'div', 1);
    token.attrs = [[ 'class', 'spoiler-block']];

    // We generate a random id to distinguish between events
    let ranhex = genRanHex(8);

    // Input
    token = state.push('spoiler_title_input', 'input', 0);
    token.attrs = [[ 'class', 'spoiler-block-input' ], [ 'type', 'checkbox' ], [ 'id', ranhex ]];

    // Spoiler title - label
    token = state.push('spoiler_title_open', 'label', 1);
    token.attrs = [[ 'class', 'summary-title' ], [ 'id', 'spoiler-block-title' ], [ 'for', ranhex ]];

    token = state.push('inline', '', 0);
    token.map = [ title, title ];
    token.content = state.getLines(title, title+1, state.tShift[title], false).trim();
    token.children = [];

    token = state.push('spoiler_title_close', 'label', -1);

    // Spoiler body - div
    token = state.push('spoiler_body_open', 'div', 1);
    token.attrs = [[ 'class', 'summary-content' ], [ 'id', 'spoiler-block-body' ]];

	let bracketLevel = 1;
    
    // Content starts
    for (next = curLine; !found;) {
        next++;
        
        if (next >= end) {
		    console.info(`spoiler : Loop break in 'spoiler_block' : at ${next} >= ${end}`);
            break;
        }
        
        pos = state.bMarks[next] + state.tShift[next];
        max = state.eMarks[next];
        
        if (pos < max && state.tShift[next] < state.blkIndent) {
            break;
        }
        
        if (state.src.slice(pos, max).length == 2 && state.src.slice(pos, max).trim().slice(-2) == ':[') {
			bracketLevel ++;
		}

        // Check if there's only ']:' on the line
        if (state.src.slice(pos, max).length == 2 && state.src.slice(pos, max).trim().slice(-2) == ']:') {
			if (bracketLevel == 1)
            	found = true;
            else
				bracketLevel --;
        }
    }

    // We use to render markdown within
    state.md.block.tokenize(state, curLine, next, false);
    
    state.line = next + 1;

    // Finalize body
    state.push('spoiler_body_close', 'div', -1);

    // Finalize details    
    state.push('spoiler_block_close', 'div', -1);

    console.info(`spoiler : Exit from 'spoiler_block' : real exit at ${next}`);
    return true;
}

// Insert each marker as a separate text token, and add it to delimiter list
function tokenize_spoiler(state, silent) {
    var i, scanned, token, len, ch,
        start = state.pos,
        marker = state.src.charCodeAt(start);

    if (silent) { return false; }

    if (marker !== 0x25/* % */) { return false; }

    scanned = state.scanDelims(state.pos, true);
    len = scanned.length;
    ch = String.fromCharCode(marker);

    if (len < 2) { return false; }

    if (len % 2) {
        token         = state.push('text', '', 0);
        token.content = ch;
        len--;
    }

    for (i = 0; i < len; i += 2) {
        token         = state.push('text', '', 0);
        token.content = ch + ch;

        if (!scanned.can_open && !scanned.can_close) { continue; }

        state.delimiters.push({
            marker: marker,
            length: 0,     // disable "rule of 3" length checks meant for emphasis
            jump:   i / 2, // 1 delimiter = 2 characters
            token:  state.tokens.length - 1,
            end:    -1,
            open:   scanned.can_open,
            close:  scanned.can_close
        });
    }

    state.pos += scanned.length;

    return true;
}

// Walk through delimiter list and replace text tokens with tags
function postProcess(state, delimiters) {
    var i, j,
        startDelim,
        endDelim,
        token,
        loneMarkers = [],
        max = delimiters.length;

    for (i = 0; i < max; i++) {
        startDelim = delimiters[i];

        if (startDelim.marker !== 0x25/* % */) {
            continue;
        }

        if (startDelim.end === -1) {
            continue;
        }

        endDelim = delimiters[startDelim.end];

        token         = state.tokens[startDelim.token];
        token.type    = 'spoiler_open';
        token.tag     = 'spoiler';
        token.nesting = 1;
        token.markup  = '%%';
        token.content = '';

        token         = state.tokens[endDelim.token];
        token.type    = 'spoiler_close';
        token.tag     = 'spoiler';
        token.nesting = -1;
        token.markup  = '%';
        token.content = '';

        if (state.tokens[endDelim.token - 1].type === 'text' &&
            state.tokens[endDelim.token - 1].content === '%') {

            loneMarkers.push(endDelim.token - 1);
        }
    }

    // If a marker sequence has an odd number of characters, it's splitted
    // like this: `%%%%` -> `%` + `%%` + `%%`, leaving one marker at the
    // start of the sequence.
    //
    // So, we have to move all those markers after subsequent s_close tags.
    //
    while (loneMarkers.length) {
        i = loneMarkers.pop();
        j = i + 1;

        while (j < state.tokens.length && state.tokens[j].type === 'spoiler_close') {
            j++;
        }

        j--;

        if (i !== j) {
            token = state.tokens[j];
            state.tokens[j] = state.tokens[i];
            state.tokens[i] = token;
        }
    }
}

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');