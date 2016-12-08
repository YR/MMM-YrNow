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
        this.list.points[0].precipitation.intensity = 0.3;

        var precipitationStart = this.list.points.filter((item) => item.precipitation.intensity > 0)[0];
        var precipitationStop = this.list.points.filter((item) => item.precipitation.intensity === 0)[0];
        var nowCast = this.translate('no_precip_next_90');
        var precipSymbol = '';
        if(precipitationStart != null) {
            var precipitationStartsIn = Math.abs(new Date() - new Date(precipitationStart.time)) / (1000 * 60);
            var precipitationStopsIn = Math.abs(new Date() - new Date(precipitationStop.time)) / (1000 * 60);
            if(this.list.points[0].precipitation.intensity === 0)
                nowCast = printf(this.translate("no_precip_now_but"), precipitationStartsIn.toFixed(0));
            else {
                nowCast = printf(this.translate("precip_now_but"), precipitationStartsIn.toFixed(0));
                precipSymbol = this.getSymbol(this.list.points[0].precipitation.intensity);
            }
        }
        wrapper.innerHTML = printf('<p>%s<br/>%s</p>', precipSymbol, nowCast);
    	return wrapper;
	},

    getSymbol: function(intensity) {
        var precipitationSymbol = '';
        if(intensity <= 0.1)
            precipitationSymbol = "<img src='" + this.file("/images/46.png") + "' />";
        else if(intensity <= 0.4)
            precipitationSymbol = "<img src='" + this.file("/images/09.png") + "' />";
        else
            precipitationSymbol = "<img src='" + this.file("/images/10.png") + "' />";
        return precipitationSymbol
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