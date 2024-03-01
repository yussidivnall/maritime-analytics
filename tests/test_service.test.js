// TODO - None of this is actually mocked! do actual tests sometime!
jest.mock('@google-cloud/storage');
jest.mock('ws');

// const aisListener = require('../src/services/listener_service');

describe('Tests for the service', ()=>{
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = {...OLD_ENV}; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  // it('Should be empty when no service running', ()=>{
  //   info = aisListener.getInfo();
  //   expect(info).toStrictEqual({
  //     'arena': [],
  //     'tracked_boats': [],
  //   });
  //   state = aisListener.getState();
  //   expect(state).toStrictEqual([]);
  // });

  it('Should dump some shit I guess', () =>{
    process.env.CONFIG_BUCKET='Bucky';
    process.env.CONFIG_PATH='McBucketface';
  });
});
