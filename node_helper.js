var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
	start: function() {
		console.log('Starting node helper for: ' + this.name);
        this.config = null;
        this.forecastUrl = '';
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
        if(notification === 'GET_YR_FORECAST') {
            self.config = payload.config;
            self.forecastUrl = payload.forecastUrl;
            this.getForecast();
        }
	},

	getForecast: function() {
		var self = this;
        var locationData = {};
        var nowcastUrl = this.forecastUrl + '/now';

        request({url: nowcastUrl, method: 'GET'}, function(error, response, message) {
            if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                locationData.nowcast = JSON.parse(message);
                var nextUpdate = locationData.nowcast.update;
                var millisToUpdate = Date.parse(nextUpdate) - new Date();
                self.setUpdate(millisToUpdate);
                request({url: self.forecastUrl, method: 'GET'}, function(error, response, message) {
                    if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                        locationData.forecast = JSON.parse(message);
                        self.sendSocketNotification('YR_FORECAST_DATA', locationData);
                    }
                });
            }
        });
        setTimeout(function() { self.getForecast(); }, this.config.updateInterval);
	},

    setUpdate: function(delay) {
		if (typeof delay !== 'undefined' && delay >= 0) {
			this.config.updateInterval = delay;
		}
	}
});