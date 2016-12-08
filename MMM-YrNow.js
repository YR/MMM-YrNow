Module.register('MMM-YrNow', {
	defaults: {
        
	},

    getTranslations: function() {
        return {
            no: "translations/no.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js'
        ];
    },

	start: function() {
		this.list = null;
		this.loaded = false;
        this.getNowcast();
		this.scheduleUpdate(10000);
	},

    socketNotificationReceived: function(notification, payload) {
		if(notification === 'YR_NOWCAST_DATA'){
			if(payload.points != null) {
				this.processJSON(payload);
			}
		}
	},

    getNowcast: function() {
        var yrApiUrl = printf('https://www.yr.no/api/v0/locations/id/%s/forecast/now' ,this.config.locationId);
		this.sendSocketNotification('GET_YR_NOWCAST', yrApiUrl);
	},

	getDom: function() {		
		var wrapper = document.createElement('div');
		if (!this.loaded) {
			wrapper.innerHTML = this.translate('loading');
			wrapper.className = 'dimmed light small';
			return wrapper;
	    }
        wrapper.className = 'light medium bright';

        //Add fake data
        //this.list.points[5].precipitation.intensity = 0.5;

        var precipitationStart = this.list.points.filter((item) => item.precipitation.intensity > 0)[0];
        var precipitationStop = this.list.points.filter((item) => item.precipitation.intensity === 0)[0];
        var precipitationIntencityNow = this.list.points[0].precipitation.intensity;
        
        var nowCast = this.translate('no_precipitation');

        if(precipitationStart != null) {
            var precipitationStartsIn = Math.abs(new Date() - new Date(precipitationStart.time)) / (1000 * 60);
            nowCast = printf(this.translate("precipitation_in"), precipitationStartsIn.toFixed(0));
        }

        if(precipitationStop != null) {
            var precipitationStopsIn = Math.abs(new Date() - new Date(precipitationStop.time)) / (1000 * 60);
            nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
        }
        if(precipitationIntencityNow > 0) {
            var precipitationSymbol = '';
            if(precipitationIntencityNow <= 0.1)
                precipitationSymbol = '46.png';
            else if(precipitationIntencityNow <= 0.4)
                precipitationSymbol = '09.png';
            else
                precipitationSymbol = '10.png';
            wrapper.innerHTML = printf("<img src='%s' />", precipitationSymbol);
        }
        wrapper.innerHTML += printf('<p>%s</p>', nowCast);
    	return wrapper;
	},

	processJSON: function(obj) {
		this.list = obj;
		this.loaded = true;		
		this.updateDom(1000);
	},

	scheduleUpdate: function(delay) {
		var nextLoad = 60000;
		if (typeof delay !== 'undefined' && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.getNowcast();
		}, nextLoad);
	}
});