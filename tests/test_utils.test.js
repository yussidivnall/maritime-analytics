const {downloadAsJson, loadFileAsJson} = require('../helpers/utils');
describe('Test utils', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = {...OLD_ENV}; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });


  test('Load JSON from PATH', () => {
    process.env.CONFIG_PATH = '../config/ais_listener.conf.json';
    jsonFile = loadFileAsJson();
  });
});
