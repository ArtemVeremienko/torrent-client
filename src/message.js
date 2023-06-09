import { Buffer } from 'node:buffer'
import { infoHash } from './torrent-parser.js'
import { genId } from './util.js'

export function buildHandshake(torrent) {
  const buf = Buffer.alloc(68)
  // pstrlen
  buf.writeUInt8(19, 0)
  // pstr
  buf.write('BitTorrent protocol', 1)
  // reserved
  buf.writeUInt32BE(0, 20)
  buf.writeUInt32BE(0, 24)
  // info hash
  infoHash(torrent).copy(buf, 28)
  // peer id
  genId().copy(buf, 48)

  return buf
}

export function buildKeepAlive() {
  return Buffer.alloc(4)
}

export function buildChoke() {
  const buf = Buffer.alloc(5)
  // length
  buf.writeUInt32BE(1, 0)
  // id
  buf.writeUint8(0, 4)

  return buf
}

export function buildUnchoke() {
  const buf = Buffer.alloc(5)
  // length
  buf.writeUInt32BE(1, 0)
  // id
  buf.writeUInt8(1, 4)

  return buf
}

export function buildInterested() {
  const buf = Buffer.alloc(5)
  // length
  buf.writeUint32BE(1, 0)
  // id
  buf.writeUInt8(2, 4)

  return buf
}

export function buildUninterested() {
  const buf = Buffer.alloc(5)
  // length
  buf.writeUint32BE(1, 0)
  // id
  buf.writeUInt8(3, 4)

  return buf
}

export function buildHave(payload) {
  const buf = Buffer.alloc(9)
  // length
  buf.writeUInt32BE(5, 0)
  // id
  buf.writeUInt8(4, 4)
  // piece index
  buf.writeUInt32BE(payload, 5)

  return buf
}

export function buildBitfield(bitfield) {
  const buf = Buffer.alloc(14)
  // length
  buf.writeUInt32BE(payload.length + 1, 0)
  // id
  buf.writeUInt8(5, 4)
  // bitfield
  bitfield.copy(buf, 5)

  return buf
}

export function buildRequest(payload) {
  const { index, begin, length } = payload
  const buf = Buffer.alloc(17)
  // length
  buf.writeUInt32BE(13, 0)
  // id
  buf.writeUInt8(6, 4)
  // piece index
  buf.writeUInt32BE(index, 5)
  // begin
  buf.writeUInt32BE(begin, 9)
  // length
  buf.writeUInt32BE(length, 13)

  return buf
}

export function buildPiece(payload) {
  const { block, index, begin } = payload
  const buf = Buffer.alloc(block.length + 13)
  // length
  buf.writeUInt32BE(block.length + 9, 0)
  // id
  buf.writeUInt8(7, 4)
  // piece index
  buf.writeUInt32BE(index, 5)
  // begin
  buf.writeUInt32BE(begin, 9)
  // block
  block.copy(buf, 13)

  return buf
}

export function buildCancel(payload) {
  const { index, begin, length } = payload
  const buf = Buffer.alloc(17)
  // length
  buf.writeUInt32BE(13, 0)
  // id
  buf.writeUInt8(8, 4)
  // piece index
  buf.writeUInt32BE(index, 5)
  // begin
  buf.writeUInt32BE(begin, 9)
  // length
  buf.writeUInt32BE(length, 13)

  return buf
}

export function buildPort(payload) {
  const buf = Buffer.alloc(7)
  // length
  buf.writeUInt32BE(3, 0)
  // id
  buf.writeUInt8(9, 4)
  // listen-port
  buf.writeUInt16BE(payload, 5)

  return buf
}

export function parseMessage(msg) {
  const id = msg.length > 4 ? msg.readInt8(4) : null
  let payload = msg.length > 5 ? msg.slice(5) : null

  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8)
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4),
    }
    payload[id === 7 ? 'block' : 'length'] = rest
  }

  return {
    size: msg.readInt32BE(0),
    id,
    payload,
  }
}
