import { readFileSync } from 'node:fs'
import bencode from 'bencode'
import { createHash } from 'node:crypto'

export function open(filepath, fileExtension = 'torrent') {
  const torrentFile = readFileSync(`${filepath}.${fileExtension}`)
  return bencode.decode(torrentFile)
}

export function size(torrent) {
  const { info } = torrent
  const buf = Buffer.alloc(8)

  const size = info.files
    ? info.files.map((file) => file.length).reduce((a, b) => a + b, 0)
    : info.length

  const bignum = BigInt(size)
  buf.writeBigInt64BE(bignum)
  console.log('SIZE: ', { size, bignum, buf })

  return buf
}

export function infoHash(torrent) {
  const info = bencode.encode(torrent.info)
  const hash = createHash('sha1').update(info).digest()
  console.log(hash)

  return hash
}
