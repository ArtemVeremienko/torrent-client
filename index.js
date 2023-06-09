'use strict'

import { open } from './src/torrent-parser.js'
import { downloadTorrent } from './src/download.js'

const torrentPath = process.argv[2]
const torrent = open(torrentPath, 'utf8')
console.log(torrent)
// downloadTorrent(torrent)
