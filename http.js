import { appendFile, rm } from 'node:fs/promises'
import https from 'node:https'

const FILE_NAME = 'response.html'

rm(FILE_NAME).then(
  (...args) => console.log('REMOVED', args),
  (...args) => console.log('RM ERROR', args)
)

https
  .get('https://nnmclub.to/', (res) => {
    const { statusCode, headers } = res
    console.log('RES: ', { statusCode, headers })

    const buf = []

    res.on('data', (d) => {
      buf.push(d)
    })

    res.on('close', () => {
      console.log(buf)
      appendFile(FILE_NAME, buf)
    })
  })
  .on('error', (err) => {
    console.error('GOT ERROR: ', err.message)
  })
