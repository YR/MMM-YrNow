var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
	start: function() {
		console.log('Starting node helper for: ' + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'GET_YR_NOWCAST') {
			this.getNowcast(payload);
		}
	},

	getNowcast: function(nowCastUrl) {
		var self = this;

        request({url: nowCastUrl, method: 'GET'}, function(error, response, message) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(message);
                self.sendSocketNotification('YR_NOWCAST_DATA', result);
            }
        });
	}
});