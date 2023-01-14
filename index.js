'use strict'

import { open, size } from './torrent-parser.js'
import { getPeers } from './tracker.js'

const torrent = open('test')
console.log(torrent)
getPeers(torrent, (peers) => {
  console.log('PEERS: ', peers)
})
