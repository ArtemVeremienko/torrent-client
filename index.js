'use strict'

import { open, size } from './torrent-parser.js'
import { getPeers } from './tracker.js'

const torrent = open('test2')

getPeers(torrent, (peers) => {
  console.log('PEERS: ', peers)
})
