var options = {
    method: "GET",
    apiURL: "https://api.twitter.com/1.1/statuses/user_timeline.json",
    count: 10,
    consumerKey: "",
    consumerSecret: "",
    accessToken: "",
    tokenSecret: ""
};
function getTwitter() {
    var accessor = {
        consumerSecret: options.consumerSecret,
        tokenSecret: options.tokenSecret
    };
    var message = {
        method: options.method,
        action: options.apiURL,
        parameters: {
            count: options.count,
            oauth_version: "1.0",
            oauth_signature_method: "HMAC-SHA1",
            oauth_consumer_key: options.consumerKey,
            oauth_token: options.accessToken,
            //screen_name: options.screen_name,
            callback: "cbname"
        }
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = OAuth.addToURL(message.action, message.parameters);
    $.ajax({
        type: message.method,
        url: url,
        dataType: "jsonp",
        jsonp: false,
        cache: true
    });
}
function cbname(data) {
    console.log(JSON.stringify(data));
}