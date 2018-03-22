function showAnchor(name,url) {
  var html = '<html><body><a href="'+url+'" target="blank" onclick="google.script.host.close()">'+name+'</a></body></html>';
  var ui = HtmlService.createHtmlOutput(html)
  SpreadsheetApp.getUi().showModelessDialog(ui,"You need to authorize to QuickBooks");
}


var CLIENT_ID = 'Q0g84atnoxBasF6VPkSC8ljo7bZMtW0BlmLeobrxnotQ3b8C1s';
var CLIENT_SECRET = '3FUh6zTPWdvgmO9053R4LlRsB3qAL0Azk6F04xOB';

/**
 * Authorizes and makes a request to the Medium API.
 */
function pushInvoice() {
  var service = getService_();
  if (service.hasAccess()) {
    var url = 'https://sandbox-quickbooks.api.intuit.com/v3/company/193514731405939/invoice?minorversion=4'
    
    var data = {
      'Line': [{
        'Amount': 999.00,
        'DetailType': 'SalesItemLineDetail',
        'SalesItemLineDetail': {
          'ItemRef': {
            'value': '1',
            'name': 'Services'
          }
        }
      }
               ],
      'CustomerRef': {
        'value': '1'
      }
    };
        
    
    
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken(),
        Accept: 'application/json'
        
      },
      method: 'post',
      muteHttpExceptions : true,
      //RequestBody: JSON.stringify(data),
      contentType: 'application/json',
      payload : JSON.stringify(data)
      
    });
    //Logger.log(response);
    var result = JSON.parse(response.getContentText());
    //Logger.log(result);
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    showAnchor('Authorize',authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService_();
  service.reset();
}

function getToken() {
  var service = getService_();
  Logger.log(service.getAccessToken());
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