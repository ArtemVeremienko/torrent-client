import { readFileSync } from 'node:fs'

const CharCodes = {
  d: 'd'.charCodeAt(0),
  e: 'e'.charCodeAt(0),
  l: 'l'.charCodeAt(0),
  i: 'i'.charCodeAt(0),
  ':': ':'.charCodeAt(0),
}

class BEncoding {
  dictionaryStart = CharCodes.d
  dictionaryEnd = CharCodes.e
  listStart = CharCodes.l
  listEnd = CharCodes.e
  numberStart = CharCodes.i
  numberEnd = CharCodes.e
  byteArrayDivider = CharCodes[':']

  /**
   *
   * @param {Buffer} bytes
   * @returns {object}
   */
  decode(bytes) {
    const iterator = bytes.values()
    const { value } = iterator.next()
    return this.decodeNextObject(iterator, value)
  }

  /**
   *
   * @param {IterableIterator<number>} iterator
   * @returns
   */
  decodeNextObject(iterator, current) {
    switch (current) {
      case this.dictionaryStart:
        return this.decodeDictionary(iterator)
      case this.listStart:
        return this.decodeList(iterator)
      case this.numberStart:
        return this.decodeNumber(iterator)
      default:
        return this.decodeByteArray(iterator, current)
    }
  }
  /**
   *
   * @param {String} path
   * @returns {object}
   */
  decodeFile(path) {
    try {
      const torrentFile = readFileSync(path)
      return this.decode(torrentFile)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   *
   * @param {IterableIterator<number>} iterator
   * @returns {number} number
   */
  decodeNumber(iterator) {
    const stringArr = []

    while (true) {
      const { value } = iterator.next()
      if (value === this.numberEnd) break
      stringArr.push(value)
    }

    return Number(Buffer.from(stringArr))
  }

  /**
   *
   * @param {IterableIterator<number>} iterator
   * @returns {Buffer}
   */
  decodeByteArray(iterator, current) {
    const stringLength = [current]

    while (true) {
      const { value } = iterator.next()
      if (value === this.byteArrayDivider) break
      stringLength.push(value)
    }

    const string = []
    const length = Number(Buffer.from(stringLength))

    for (let i = 0; i < length; i++) {
      string.push(iterator.next().value)
    }

    return Buffer.from(string)
  }

  /**
   *
   * @param {IterableIterator<number>} iterator
   * @return {Array}
   */
  decodeList(iterator) {
    const arr = []

    while (true) {
      const { value } = iterator.next()
      if (value === this.listEnd) break
      arr.push(this.decodeNextObject(iterator, value))
    }

    return arr
  }

  /**
   *
   * @param {IterableIterator<number>} iterator
   * @return {Record}
   */
  decodeDictionary(iterator) {
    const obj = {}

    while (true) {
      const { value } = iterator.next()
      if (value === this.dictionaryEnd) break
      const objKey = this.decodeByteArray(iterator, value).toString('utf8')
      const { value: nextValue } = iterator.next()
      const objValue = this.decodeNextObject(iterator, nextValue)
      obj[objKey] = objValue
    }

    return obj
  }
}
const decoder = new BEncoding()

console.log(decoder.decodeFile(process.argv[2]))

/*
console.log('string', decoder.decode(Buffer.from('8:announce')).toString())
console.log(
  'string',
  decoder
    .decode(Buffer.from('33:http://192.168.1.74:6969/announce7:comment'))
    .toString()
)

console.log('integer', decoder.decode(Buffer.from('i32768e')))
console.log('integer', decoder.decode(Buffer.from('i-3e')))

console.log('list', decoder.decode(Buffer.from('l4:spam4:eggse')))
console.log('list', decoder.decode(Buffer.from('le')))

console.log(
  'dictionary',
  decoder.decode(Buffer.from('d3:cow3:moo4:spam4:eggse'))
)
console.log('dictionary', decoder.decode(Buffer.from('d4:spaml1:a1:bee')))
console.log(
  'dictionary',
  decoder.decode(
    Buffer.from(
      'd9:publisher3:bob17:publisher-webpage15:www.example.com18:publisher.location4:homee'
    )
  )
)
console.log('dictionary', decoder.decode(Buffer.from('de')))
*/
