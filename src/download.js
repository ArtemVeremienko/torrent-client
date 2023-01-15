import { getPeers } from './tracker.js'
import { Socket } from 'node:net'

export function downloadTorrent(torrent) {
  getPeers(torrent, (peers) => {
    console.log('PEERS: ', peers)
    peers.forEach(download)
  })
}

function download(peer) {
  const { ip, port } = peer
  const socket = Socket()

  socket.on('error', (err) => {
    console.log('ERROR: ', err)
  })

  socket.connect(port, ip, console.log)

  socket.on('data', (data) => {
    console.log('DATA: ', data)
  })
}
