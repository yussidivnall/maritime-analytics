/* eslint require-jsdoc: 0 */
class File {
  constructor() {}

  async download() {
    // Mock downloading a config from BUCKET

    const conf = {
      'arena': [[[51.399, 2.2666], [50.85, 0.639]]],
      'boats': [],
      'granularity': 30000,
    };
    return [
      Buffer.from(JSON.stringify(conf)),
      {contentType: 'application/octet-stream'},
    ];
  }
}

class Bucket {
  constructor() {}

  file() {
    // Return a mocked File instance
    return new File();
  }
}

class Storage {
  constructor() {}

  bucket() {
    // Return a mocked Bucket instance
    return new Bucket();
  }
}

module.exports = {
  Storage,
  Bucket,
  File,
};
