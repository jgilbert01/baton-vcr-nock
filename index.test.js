const supertest = require('supertest');

const { vcr } = require('./');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'https://api.github.com';
const client = supertest(endpoint);

describe('index.js', () => {
  it.skip('should record', () => {
    const ctx = vcr({ mode: 'record', fixtureName: 'x' });
    // console.log('ctx: ', stringify(ctx));

    return client.get('/repos/jgilbert01/baton-vcr-nock')
      .set('User-Agent', 'Awesome-Octocat-App')
      .set('Accept-Encoding', 'deflate')
      .expect(200)
      .then(() => {
        console.log('ctx: ', stringify(ctx));
      });
  });

  it('should replay', () => {
    const ctx = vcr({ mode: 'replay' });
    // console.log('ctx: ', stringify(ctx));

    return client.get('/repos/jgilbert01/baton-vcr-nock')
    .set('User-Agent', 'Awesome-Octocat-App')
    .set('Accept-Encoding', 'deflate')
    .expect(200)
      .then(() => {
        console.log('ctx: ', stringify(ctx));
      });
  });
});

function stringify(obj) {
  let cache = [];
  let str = JSON.stringify(obj, function (key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  }, 2);
  cache = null; // reset the cache
  return str;
}