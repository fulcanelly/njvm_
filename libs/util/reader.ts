/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/
// import { Buffer } from 'buffer/'


export class Reader {
  bytes: Buffer
  offset: number

  constructor(bytes: Buffer, offset: number) {
    this.bytes = bytes;
    this.offset = offset || 0;
  }

  read8() {
    const data = this.bytes.readUInt8(this.offset);
    this.offset += 1;
    return data;
  }

  read32() {
    var data = this.bytes.readUInt32BE(this.offset);
    this.offset += 4;
    return data;
  }

  readString(length: number) {
    var data = this.bytes.toString('utf8', this.offset, this.offset + length)
    this.offset += length;
    return data;
  }


  readBytes(length: number) {
    var data = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return data;
  }

  read16() {
    const data = this.bytes.readUInt16BE(this.offset);
    this.offset += 2;
    return data;
  }

  static create(bytes: Buffer, offset: number = 0) {
    return new Reader(bytes, offset);
  }
}




