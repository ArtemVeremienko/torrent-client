import { Buffer } from 'node:buffer'
import { randomBytes } from 'node:crypto'
import { createSocket } from 'node:dgram'
import { parse } from 'node:url'
import { infoHash, size } from './torrent-parser.js'
import { genId } from './util.js'

export function getPeers(torrent, callback) {
  const socket = createSocket('udp4')
  const url = torrent.announce.toString('utf8')
  const connReq = buildConnReq()

  udpSend(socket, connReq, url)

  socket.on('message', (response) => {
    const responseType = respType(response)
    if (responseType === 'connect') {
      const connResp = parseConnResp(response)
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent)
      udpSend(socket, announceReq, url)
    } else if (responseType === 'announce') {
      const announceResp = parseAnnounceResp(response)
      callback(announceResp.peers)
    }
  })

  socket.on('error', console.error.bind(null, 'ERROR: '))

  socket.on('connect', console.log.bind(null, 'CONNECT: '))
}

export function udpSend(
  socket,
  message,
  rawUrl,
  callback = console.log.bind(null, 'UDP SEND: ')
) {
  const { port, hostname, protocol } = parse(rawUrl)
  console.log({ rawUrl, hostname, port, protocol })
  socket.send(message, 0, message.length, port, hostname, callback)
}

export function respType(resp) {
  const action = resp.readUInt32BE(0)
  const responseTypeMap = {
    0: 'connect',
    1: 'announce',
  }

  return responseTypeMap[action]
}

export function buildConnReq() {
  const buf = Buffer.alloc(16)
  buf.writeUInt32BE(0x417, 0)
  buf.writeUInt32BE(0x27101980, 4)
  buf.writeUInt32BE(0, 8)
  randomBytes(4).copy(buf, 12)

  return buf
}

export function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8),
  }
}

export function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98)

  // connection id
  connId.copy(buf, 0)
  // action
  buf.writeUInt32BE(1, 8)
  // transaction id
  randomBytes(4).copy(buf, 12)
  // info hash
  infoHash(torrent).copy(buf, 16)
  // peerId
  genId().copy(buf, 36)
  // downloaded
  Buffer.alloc(8).copy(buf, 56)
  // left
  size(torrent).copy(buf, 64)
  // uploaded
  Buffer.alloc(8).copy(buf, 72)
  // event
  buf.writeUInt32BE(0, 80)
  // ip address
  buf.writeUInt32BE(0, 80)
  // key
  randomBytes(4).copy(buf, 88)
  // num want
  buf.writeInt32BE(-1, 92)
  // port
  buf.writeUInt16BE(port, 96)

  return buf
}

function group(iterable, groupSize) {
  const groups = []
  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize))
  }

  return groups
}

export function parseAnnounceResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map((address) => ({
      ip: address.slice(0, 4).join('.'),
      port: address.readUInt16BE(4),
    })),
  }
}
