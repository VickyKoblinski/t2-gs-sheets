var wsdl = "{{wsdl}}";
var version = "{{version}}";
var username = "{{username}}";
var password = "{{password}}";
var sheet = SpreadsheetApp.openById("{{sheetID}}");

//Object containing all lots
//{
//    UID:
//        {
//            Description,
//            OccupancyType,
//            Capacity,
//            Occupied,
//            Avaible,
//            Timestamp
//        },
//    ...
//}
var lots = {};

/**
 * Sends the SOAP Evenlope and returns the body.
 * @param {string} reqBody SOAP Envelope
 * @param {string} getResult Function name of result
 * @returns {string} XML Response
 */
function fetchSOAP(reqBody, getResult) {
  const options = {
    method: "post",
    contentType: "text/xml",
    payload: reqBody
  };

  const result = UrlFetchApp.fetch(wsdl, options);

  const xmlResult = XmlService.parse(result).getRootElement();
  const soapNamespace = xmlResult.getNamespace("soap");
  const GetResponse = xmlResult.getChild("Body", soapNamespace).getChildren()[
    0
  ];
  const responseNamespace = GetResponse.getNamespace();

  return GetResponse.getChild(getResult, responseNamespace).getText().trim();
}

/**
 * Generates the SOAP Envelope
 * @param {string} body Body of SOAP Envelope
 * @returns {string} Generated SOAP Envelope
 */
function getSOAP_envelope(body) {
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    "<soap:Body>" +
    body +
    "</soap:Body>" +
    "</soap:Envelope>"
  );
}

/**
 * Generates the version, username, and password portion of the SOAP Envelope Body.
 * @returns {string}
 */
function getSOAP_partial() {
  return (
    "<version>" +
    version +
    "</version>" +
    "<username>" +
    username +
    "</username>" +
    "<password>" +
    password +
    "</password>"
  );
}

/**
* Entry function that fetches the list of facilities from T2
* and begins building `lots` with data.
*/
function fetchFacilitiesList() {
  //Build SOAP Envelope
  const data = getSOAP_envelope(
    '<GetFacilityList xmlns="http://www.t2systems.com/">' +
    getSOAP_partial() +
    "</GetFacilityList>"
  );

  const xml = fetchSOAP(data, "GetFacilityListResult");

  //Parse XML
  const document = XmlService.parse(xml);
  const facilities = document.getRootElement().getChildren();

  //Iterate over Facilities to build `lots`
  for (var i = 0; i < facilities.length; i++) {
    var uid = facilities[i].getAttribute("UID").getValue();
    var Description = facilities[i].getAttribute("Description").getValue();

    lots[uid] = { Description: Description };

    //Build facility data for each UID
    fetchFacility(uid);
  }

  //After all data is gathered, print to sheets
  printToSheets();
}

/**
 * Fetches data for particular facility and stores data in `lots`
 * @param {string} uid UID of facility to query
 */
function fetchFacility(uid) {
  //Builds SOAP Envelope for OccupancyData fetch
  var data = getSOAP_envelope(
    '<GetOccupancyData xmlns="http://www.t2systems.com/">' +
    getSOAP_partial() +
    "<facilityUid>" +
    uid +
    "</facilityUid>" +
    "</GetOccupancyData>"
  );

  var xml = fetchSOAP(data, "GetOccupancyDataResult");

  //Parse XML
  var document = XmlService.parse(xml);
  var facilities = document
    .getRootElement()
    .getChild("Facility")
    .getChild("Occupancy");

  //Populates data
  lots[uid].OccupancyType = facilities.getChild("OccupancyType").getText();
  lots[uid].Capacity = facilities.getChild("Capacity").getText();
  lots[uid].Occupied = facilities.getChild("Occupied").getText();
  lots[uid].Available = facilities.getChild("Available").getText();
  lots[uid].Timestamp = facilities.getChild("Timestamp").getText();
}

/**
 * Prints data to Google Spreadsheet
 */
function printToSheets() {
  const range = sheet.getRange("A2:A" + sheet.getLastRow());
  const numRows = range.getNumRows();

  //Loops through each Lot
  for (var key in lots) {
    var arr = [key];
    var lot = lots[key];
    var exists = false; //Cell that contains key, if exists

    //Loops through each row to find if entry exists for this lot
    for (var i = 0; i < numRows; i++) {
      var cell = sheet.getRange("A" + (2 + i)).getDisplayValue();

      //If match is found, save the cell
      if (cell === key) {
        var cellRange = sheet.getRange("A" + (2 + i) + ":G" + (2 + i));
        exists = cellRange;
        break;
      }
    }

    //Add each property of the lot to array
    for (var prop in lot) {
      arr.push(lot[prop]);
    }

    //Push data array to approprate row
    if (exists) {
      exists.setValues(Array(arr));
    } else {
      sheet.appendRow(arr);
    }
  }
}
