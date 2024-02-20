const {formatPositionReport} = require('../src/helpers/formatters');

describe('Tests formatters', () => {
  const positionReport = {
    Message: {
      PositionReport: {
        Cog: 229.4,
        CommunicationState: 59916,
        Latitude: 51.045973333333336,
        Longitude: 1.3993183333333334,
        MessageID: 1,
        NavigationalStatus: 0,
        PositionAccuracy: false,
        Raim: false,
        RateOfTurn: 0,
        RepeatIndicator: 0,
        Sog: 11.8,
        Spare: 0,
        SpecialManoeuvreIndicator: 0,
        Timestamp: 42,
        TrueHeading: 230,
        UserID: 511101258,
        Valid: true,
      },
    },
    MessageType: 'PositionReport',
    MetaData: {
      MMSI: 511101258,
      MMSI_String: 511101258,
      ShipName: 'ASG PORTOFINO       ',
      latitude: 51.045973333333336,
      longitude: 1.3993183333333334,
      time_utc: '2024-02-18 16:48:42.320210921 +0000 UTC',
    },
  };


  test('Test formatting of position reports from request message', () => {
    const message = positionReport;
    const expected = {
      'cog': 229.4,
      'lat': 51.045973333333336,
      'long': undefined,
      'mmsi': 511101258,
      'msg_id': 1,
      'nav_status': 0,
      'pos_accuracy': false,
      'raim': false,
      'rate_of_turn': 0,
      'repeat_indicator': 0,
      'ship_name': 'ASG PORTOFINO       ',
      'sog': 11.8,
      'spare': 0,
      'special_manoeuvre_indicator': 0,
      'time_stamp': 42,
      'time_utc': '2024-02-18 16:48:42.32021',
      'true_heading': 230,
      'user_id': 511101258,
      'valid': true,
    };

    const formatted = formatPositionReport(message);
    console.log(formatted);
    expect(formatted).toEqual(expected);
  });
});
