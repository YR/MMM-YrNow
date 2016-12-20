var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
	start: function() {
		console.log('Starting node helper for: ' + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		if(notification === 'GET_YR_FORECAST') {
            this.getForecast(payload)
        }
	},

	getForecast: function(forecastUrl) {
		var self = this;
        var locationData = {};
        var nowcastUrl = forecastUrl + '/now';
        
        request({url: nowcastUrl, method: 'GET'}, function(error, response, message) {
            if (!error && response.statusCode == 200) {
                locationData.nowcast = JSON.parse(message);
                request({url: forecastUrl, method: 'GET'}, function(error, response, message) {
                    if (!error && response.statusCode == 200) {
                        locationData.forecast = JSON.parse(message);
                        self.sendSocketNotification('YR_FORECAST_DATA', locationData);
                    }
                });
            }
        });
	}
});