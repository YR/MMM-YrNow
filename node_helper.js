var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
    start: function() {
        console.log('Starting node helper for: ' + this.name);
        this.subscriptions = [];
    },


    socketNotificationReceived: function(notification, payload) {
        if(notification === 'GET_YR_FORECAST') {
            this.subscriptions[payload.forecastUrl] = payload.config;
            this.getForecast(payload.forecastUrl);
        }
    },

    getForecast: function(forecastUrl) {
        var self = this;
        var locationData = {};
        var nowcastUrl = `${forecastUrl}/now`;
        var infoUrl = forecastUrl.replace(/\/forecast/, '');
        if (self.subscriptions[forecastUrl].invalidated){
            return false;
        }

        if (!self.subscriptions[forecastUrl].placeName){
            request({ url: infoUrl, method: 'GET'}, function(error, response, message) {
                if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                        let data = JSON.parse(message);
                        self.subscriptions[forecastUrl].placeName =data.name;
                }
            });
        };

        request({url: nowcastUrl, method: 'GET', stash: `${forecastUrl}`}, function(error, response, message) {
           if ( response.statusCode == 404){
                self.sendSocketNotification('YR_INVALID_NOWCAST', forecastUrl);
                self.subscriptions[forecastUrl].invalidated = true;
                return false;
            }
            if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                locationData.nowcast = JSON.parse(message);
                locationData.forecastUrl = this.stash;
                if (self.subscriptions[forecastUrl].placeName){
                    locationData.placeName = self.subscriptions[forecastUrl].placeName
                }
                self.setNextUpdate(this.stash, response.headers);

                request({url: this.stash, method: 'GET'}, function(error, response, message) {
                    if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                        locationData.forecast = JSON.parse(message);
                        self.sendSocketNotification('YR_FORECAST_DATA', locationData);
                    }
                });
            }
            setTimeout( function(){ self.getForecast(forecastUrl)} , self.subscriptions[forecastUrl].updateInterval);
        });
    },

    setNextUpdate: function(forecastUrl, headers) {
        var cacheControlHeader = headers['cache-control'];
        var maxAge = cacheControlHeader.slice(cacheControlHeader.indexOf('=') + 1);
        this.subscriptions[forecastUrl].updateInterval = maxAge * 1000;
    }
});