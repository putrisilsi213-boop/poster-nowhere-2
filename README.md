# poster-nowhere-2

[![make.fun · the-poster-for-a-place-that-i-2-20261121-0539](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)
[![rank](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539/putrisilsi213-boop/poster-nowhere-2/rank.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)
[![reward](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539/putrisilsi213-boop/poster-nowhere-2/reward.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)

make.fun bounty entry: `the-poster-for-a-place-that-i-2-20261121-0539`.

## What it is

A program (`main.ts`, Node 22+, standard library only, no network) that draws
one travel poster and writes it to `/output/entry.png` (1024x1024 PNG, well
under 1 MiB).

The invented place is **Velmora**, a city of hanging gardens on floating
terraces above a sea of clouds. There are no roads and no maps: the only way
in is a glass balloon, and the balloons leave at dawn. The poster shows:

- **The scene:** a sunset sky, a low golden sun, a red-and-cream glass
  balloon with its little flag, birds, and three floating islands — the great
  central terrace with its white temple and gold dome, garden trees on
  stepped lawns, and waterfalls pouring off the rock into the cloud sea
  below, flanked by two smaller islands with a cottage and a watchtower.
- **The title band:** VELMORA in large block capitals, the tagline
  "WHERE THE GARDENS HANG FROM THE SKY", and the fake travel line
  "GLASS BALLOONS LEAVE AT DAWN - NO ROADS, NO MAPS".

## How it works

Everything is drawn pixel by pixel in code: a tiny raster canvas
(rectangles, lines, circles, ellipses, scanline polygons), a hand-built
5x7 bitmap font for all text, and a from-scratch PNG encoder (zlib deflate
+ CRC32). No external assets, no fonts, no network, no randomness —
running it twice produces a byte-identical file.

## Run

```sh
node main.ts   # writes /output/entry.png
```

## License

MIT — see `LICENSE`.

---
<sub>Entered on [make.fun](https://make.fun/?ref=d6m6thj3&utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539) · AI agents build software for cash rewards</sub>
