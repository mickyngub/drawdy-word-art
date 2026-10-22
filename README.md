# Word Art

Turn a word or a short title into eye-catching word art on your Drawdy board: retro 3D, neon, chrome and more. The image remembers its text and style, so when the words change you edit it in place instead of making it again.

![Typing a word into Word Art, clicking through the Retro 3D, Rainbow wave and Neon styles, bending the Neon title with Arc and placing it on the board.](https://raw.githubusercontent.com/mickyngub/drawdy-word-art/main/docs/media/word-art.gif)

## What it's for

- **Titles and headings** that stand out on a busy board, a slide or a poster.
- **Fun moments**: party invites, team shout-outs, retro posters and stickers.
- **Labels that stay editable**: fix a typo or change the colours later, in place.

## How to use

1. Click the **Word Art** button on the right of the board.
2. Type your words in **Text**, up to three lines.
3. Under **Style**, pick one of six styles. Each tile previews your text in that style. Then choose a **Font**, the colours, **Arc** and **Size**. The preview updates as you go.
4. Click **Place on board**. The image lands in view, next to anything already there rather than on top of it.
5. To change it later, select it, click **Edit selected**, make your changes and click **Update**. **Place new** makes a copy instead, and **Stop editing** goes back to placing new ones.

## Styles and options

- **Retro 3D**: letters in the **Face colour**, fading lighter towards the bottom, with a dark outline and a 3D side in the **Depth colour**, drawn a little darker.
- **Neon**: a white core with a glow in the **Glow colour**.
- **Chrome**: polished silver with a dark outline. No colours to set.
- **Outline**: letters in the **Fill colour**, a thick **Outline colour** and a dark drop shadow.
- **Bubble**: puffy letters in the **Fill colour** with a lighter top and a thick **Outline colour**.
- **Rainbow wave**: letters bob on a wave with a rainbow fill and a thin dark outline. No colours and no arc to set.
- **Fonts**: Bungee, Pacifico, Righteous, Anton and Rubik Mono One.
- **Arc**: from -100 to 100. Above 0 the text bends up like a rainbow, below 0 it bends down like a smile, and 100 is a half circle. Each line bends on its own.
- **Size**: 48 to 200 px.

Only the controls a style uses are shown. Values you set for a hidden control are kept, so switching back to that style brings them back.

## Tips

- ⌘Z or Ctrl+Z takes word art back, from the panel too. Placing is one undo step; an update takes two, or three if the image was locked.
- Word art holds up to three lines and 80 characters. Extra lines are joined onto the third.
- Images are transparent PNGs drawn at twice their board size, so they stay crisp when you zoom in. Very wide art at a large size is drawn at a lower scale to fit Drawdy's image limit and comes out softer.
- If you resize word art on the board, **Update** keeps the new width. Rotation resets on update.
- Esc leaves the text box; press it again to close the panel.

## Privacy

- Your text stays in the panel and on your board. The panel downloads the five fonts from jsDelivr.
- Your style, font, colours, arc and size are saved in this browser for next time. The text itself lives only in the images you place.

## Credits and licence

- Fonts: Bungee, Pacifico, Righteous, Anton and Rubik Mono One (SIL Open Font Licence 1.1), served by [Fontsource](https://fontsource.org) through jsDelivr.
- The extension's code is [MIT](https://github.com/mickyngub/drawdy-word-art/blob/main/LICENSE). Building it yourself? See [DEVELOPMENT.md](https://github.com/mickyngub/drawdy-word-art/blob/main/DEVELOPMENT.md).
