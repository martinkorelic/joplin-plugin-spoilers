# Joplin Plugin - Spoilers

This Joplin plugin allows you to create inline spoilers and spoiler blocks with title and extendable body.

**Note**: Requires Joplin 1.7.11+

**Version**: 1.0.3

**Spoilers (inline)**

![](./docs/inline-spoiler-preview.gif)

**Spoiler blocks**

![](./docs/spoiler-block-preview.gif)



## Installation

- Open Joplin and navigate to `Preferences > Plugins`
- Search for `Spoilers` and click install
- Restart Joplin

### Uninstall

- Open Joplin and navigate to `Tools > Options > Plugins`
- Search for `Spoilers` plugin
- Press `Delete` to remove the plugin or `Disable` to disable it
- Restart Joplin

## Usage

### Spoiler (inline)

In order to create a spoiler (inline), you can:
- press on the `Spoiler` button or
- use the shortcut `Ctrl + Alt + O`
- select text and use any of the previous options
- or manually write in the following format:

```
%%spoiler%%
```

### Spoiler block

In order to create a spoiler block, you can:
- press on the `Spoiler block` button or
- use the shortcut `Ctrl + Alt + P`
- select text and use any of the previous options
- or manually write in the following format:

```
:[
Spoiler title here...

Spoiler body text here...

]:
```

Please note, that the empty line above and below spoiler body text is **needed**.
Spoiler title and body supports markdown formatting as well.

**Example**:
```
:[
3 ways to check if an Object has a property in JS

Using:
1. `hasOwnProperty()` method
2. `in` operator
3. Comparing with `undefined`
* * *
1) `hasOwnProperty()`
~~~js
const hero = {
  name: 'Batman'
};

hero.toString; // => function() {...}

hero.hasOwnProperty('toString'); // => false
~~~
* * *

]:
```

## Custom styles

If you would like to style the spoiler blocks to your preference, use the following in your `userstyle.css` file:


```css
/* Styling of the spoiler block title */
.summary-title {
  
}

/* Styling of the spoiler block body */
.summary-content {
  
}
```

### Exporting styles

By default when exporting with spoiler blocks, the blocks get extended, show the body and hides the arrows. Inline spoilers stay hidden.

Alternately, if you would like to style the spoiler blocks to your liking when exporting, use the following in you `userstyle.css` file:
```css
@media print {

  /* Hides the side arrow */
  .summary-title:before {
      content: "";
  }

  /* Container for spoiler blocks */
  .spoiler-block {}

  /* Container for spoiler title */
  #spoiler-block-title {}
  
  /* Container for spoiler body */
  #spoiler-block-body {
      /* Shows the body contents */
      display: block;
      animation: none;
  }

}
```

## Notes

- **There might be bugs**, [report them here](https://github.com/martinkorelic/joplin-plugin-spoilers/issues) and I'll try to fix them when I'll find time.

> Created on 12th April 2021