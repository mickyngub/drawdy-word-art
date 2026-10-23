# Changelog

## 1.0.2

- a new icon, shown on the marketplace card and on the extension's button

## 1.0.1

- the panel now uses Drawdy's own colours and font
- the preview has an empty state, and the selected style gets a lime ring instead of a fill
- a restyled font grid and colour swatches

## 1.0.0

First public release

- type up to three lines and place them on the board as a transparent word art image
- six styles: Retro 3D, Neon, Chrome, Outline, Bubble and Rainbow wave, each previewed live with your text
- five display fonts: Bungee, Pacifico, Righteous, Anton and Rubik Mono One
- colours named by what they paint in each style, with the controls a style doesn't use hidden
- an arc from -100 to 100 that bends the text up like a rainbow or down like a smile, and a size from 48 to 200 px
- images are transparent PNGs drawn at twice their board size, so they stay crisp when zoomed in
- select placed word art to edit it in the panel and update it in place, keeping its spot, width, layer, frame, group, opacity and lock
- new word art lands beside existing content instead of on top of it, clear of the panel, and is selected; the board keeps its zoom
- style settings are remembered between sessions; the text is not, and nothing is saved while word art from the board is being edited
- a font that can't load within 8 seconds falls back to the browser's sans-serif, and the panel says so
- ⌘Z and Ctrl+Z undo on the board from the panel, Escape in a field leaves the field, and the panel follows the board theme while open
- storage and board permissions are asked when the panel first opens, not when the board loads
- a full board, a denied permission or a board that doesn't answer gets a clear message instead of a stuck button
