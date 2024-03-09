/**
 * Fix Timestamp
 *
 * AISStream gives a timestamp in a bad format
 * 9 decimal places after second, max for big query is 6
 * TODO there might be an issue with the Time Zone
 * Bad Timestamp    2024-02-18 18:49:01.106148339 +0000 UTC
 * Fixed Timesample 2024-02-18 18:49:01.10614
 * Note dropping the ' +0000 UTC' lose timezone!
 *
 * @param {*} timestampStr
 * @return {Object}
 */
function fixTimestamp(timestampStr) {
  return timestampStr.substring(0, timestampStr.lastIndexOf('.')+6);
}


/**
 * Formats a position report to a flat dictionary
 * of relevant values To map to database
 *
 * @param {Object}record
 * @return {Object}
  */
function formatPositionReport(record) {
  const ret = {
    time_utc: fixTimestamp(record['MetaData']['time_utc']),
    mmsi: record['MetaData']['MMSI'],
    ship_name: record['MetaData']['ShipName'],
    cog: record['Message']['PositionReport']['Cog'],
    lat: record['Message']['PositionReport']['Latitude'],
    long: record['Message']['PositionReport']['Longitude'],
    msg_id: record['Message']['PositionReport']['MessageID'],
    nav_status: record['Message']['PositionReport']['NavigationalStatus'],
    pos_accuracy: record['Message']['PositionReport']['PositionAccuracy'],
    raim: record['Message']['PositionReport']['Raim'],
    rate_of_turn: record['Message']['PositionReport']['RateOfTurn'],
    repeat_indicator: record['Message']['PositionReport']['RepeatIndicator'],
    sog: record['Message']['PositionReport']['Sog'],
    spare: record['Message']['PositionReport']['Spare'],
    special_manoeuvre_indicator:
      record['Message']['PositionReport']['SpecialManoeuvreIndicator'],
    time_stamp: record['Message']['PositionReport']['Timestamp'],
    true_heading: record['Message']['PositionReport']['TrueHeading'],
    user_id: record['Message']['PositionReport']['UserID'],
    valid: record['Message']['PositionReport']['Valid'],

  };
  return ret;
};

module.exports = {
  formatPositionReport,
};
