import { getPeers } from './tracker.js'
import { Socket } from 'node:net'
import { buildHandshake, buildInterested, parseMessage } from './message.js'

export function downloadTorrent(torrent) {
  getPeers(torrent, (peers) => {
    console.log('PEERS: ', peers)
    peers.forEach((peer) => download(peer, torrent))
  })
}

function download(peer, torrent) {
  const { ip, port } = peer
  const socket = new Socket()

  socket.on('error', (err) => {
    console.log('ERROR: ', err)
  })

  socket.connect(port, ip, () => {
    socket.write(buildHandshake(torrent))
  })

  onWholeMsg(socket, (msg) => msgHandler(msg, socket))
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0)
  let handshake = true

  socket.on('data', (recvBuf) => {
    // msgLen calculates the length of a whole message
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4

    savedBuf = Buffer.concat([savedBuf, recvBuf])

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()))
      savedBuf = savedBuf.slice(msgLen())
      handshake = false
    }
  })
}

function msgHandler(msg, socket) {
  if (isHandshake(msg)) {
    socket.write(buildInterested())
  } else {
    const message = parseMessage(msg)
    const { id, payload } = message

    if (id === 0) chockeHandler()
    if (id === 1) unchockeHandler()
    if (id === 4) haveHandler(payload)
    if (id === 5) bitfieldHandler(payload)
    if (id === 7) pieceHandler(payload)
  }
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString('utf8', 1) === 'BitTorrent protocol'
  )
}

function chockeHandler() {}

function unchockeHandler() {}

function haveHandler(payload) {}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}
