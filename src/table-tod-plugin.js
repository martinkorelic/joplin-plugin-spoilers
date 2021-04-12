
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
                    let { title, body } = token.content.match(/(?<title>.+)\n:\[(?<body>(?:.|\n)*?)\]:/i).groups;

                    // Re render markdown content within
                    console.log(markdownIt.render(token.content));

                    return `<div>${title}</div><div>${markdownIt.render(body)}</div>`;
                }

                

            },
            // Assests such as JS or CSS that should be loaded in the rendered HTML document
            assets: function() {
                return [];
            },
        }
    }
}