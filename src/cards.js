module.exports = {
    default: function(context) {
        return {
            plugin: async function(markdownIt, _options) {
                const pluginId = context.pluginId;
                const contentScriptId = _options.contentScriptId;

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
                }

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