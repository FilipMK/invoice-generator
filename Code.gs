var CLIENT_ID = 'Q0g84atnoxBasF6VPkSC8ljo7bZMtW0BlmLeobrxnotQ3b8C1s';
var CLIENT_SECRET = '3FUh6zTPWdvgmO9053R4LlRsB3qAL0Azk6F04xOB';
var URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company/193514731405939/invoice?minorversion=4'

//these data will be eventually fetched from spreadsheet:
var productService = 'Developer';
var description = '';
var amount = 490.00;
var unitPrice = 70;
var quantity = 7;

var invoiceDate = '2018-02-28';
var dueDate = '2018-03-31'

var line1 = '245 Fifth Avenue,\n7th Floor';
var city = 'New York';
var countrySubDivisionCode = 'NY';
var postalCode = '10016';

var message = 'Please remit payment via electronic ACH transfer:';

/**
 * Authorizes and makes a request to the Medium API.
 */
function authorizeAndPushInvoice() {
  var service = getService_();
  if (service.hasAccess()) {
    pushInvoice(service);
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    showAnchor('Authorize',authorizationUrl);
  }
}

function pushInvoice(service) {
  var response = UrlFetchApp.fetch(URL, {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken(),
      Accept: 'application/json'
    },
    method: 'post',
    muteHttpExceptions : true,
    contentType: 'application/json',
    payload : JSON.stringify(getInvoiceData())
  });
  var result = JSON.parse(response.getContentText());
  Logger.log(JSON.stringify(result, null, 2));
}

function getInvoiceData() {
  return {
      'TxnDate': invoiceDate,
      'DueDate': dueDate,
      'Line': [
        {
          'Amount': amount,
          'DetailType': 'SalesItemLineDetail',
          'Description': 'NG-100 Marek Krzynowek: Feb 2018',
          'SalesItemLineDetail': {
            'ItemRef': {
              'value': '1',
              'name': productService
            },
            'UnitPrice': unitPrice,
            'Qty': quantity
          }
        }
      ],
      'CustomerRef': {
        'value': '1'
      },
      'BillAddr': {
        'Id': '13',     //set the correct number
        'Line1': 'Ala Makota',
        'Line2': 'Google Inc.',
        'Line3': line1,
        'City': city,
        'CountrySubDivisionCode': countrySubDivisionCode,
        'PostalCode': postalCode,
        'Lat': 'INVALID',
        'Long': 'INVALID'
      },
      'BillEmail': {
        'Address': 'Familiystore@intuit.com'
      },
      'SalesTermRef': {
        'value': '1'
      },
      'CustomerMemo': {
        'value': message
       }
    };
}

function showAnchor(name,url) {
  var html = '<html><body><a href="'+url+'" target="blank" onclick="google.script.host.close()">'+name+'</a></body></html>';
  var ui = HtmlService.createHtmlOutput(html)
  SpreadsheetApp.getUi().showModelessDialog(ui,"You need to authorize to QuickBooks");
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService_();
  service.reset();
}

/**
 * Configures the service.
 * Three required parameters are not specified because
 * the library creates the authorization URL with them
 * automatically: `redirect_url`, `response_type`, and
 * `state`.
 */
function getService_() {
  return OAuth2.createService('QuickBooks')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://appcenter.intuit.com/connect/oauth2')
      .setTokenUrl('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback_')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set scope (required)
      .setScope('com.intuit.quickbooks.accounting');
}

/**
 * Handles the OAuth callback.
 */
function authCallback_(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! Now you can push your invoices');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(getService_().getRedirectUri());
}