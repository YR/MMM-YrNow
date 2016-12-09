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
        var self = this;
        setInterval(function() {
            self.updateDom(1000);
        }, 60000);
	},

    socketNotificationReceived: function(notification, payload) {
		if(notification === 'YR_NOWCAST_DATA'){
			if(payload.points != null) {
                var nextUpdate = payload.update;
                var millisToUpdate = Math.abs((Date.parse(nextUpdate) - new Date()));
                this.scheduleUpdate(millisToUpdate);
				this.processJSON(payload);
			}
		}
	},

    getNowcast: function() {
        this.config.locationId='1-324168';
        var yrApiUrl = printf('https://www.yr.no/api/v0/locations/id/%s/forecast/now' ,this.config.locationId);
		this.sendSocketNotification('GET_YR_NOWCAST', yrApiUrl);
	},

    getNextPrecipStart: function() {
        return this.list.points.filter((item) => 
            item.precipitation.intensity > 0 && 
            Date.parse(item.time) > new Date())[0];
    },

    getNextPrecipStop: function() {
        return this.list.points.filter((item) => 
            item.precipitation.intensity === 0 &&
            Date.parse(item.time) > new Date())[0];
    },

    getMinutesTill: function(nextItemTime) {
        return Math.abs(new Date() - new Date(nextItemTime)) / (1000 * 60);
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
//         for(var i = 0; i < 12; i++)
//         {
//           this.list.points[i].precipitation.intensity = 0.7;  
//         }
// this.list.points[0].precipitation.intensity = 0;
//         this.list.points[1].precipitation.intensity = 0;
//         this.list.points[1].time = '2016-12-09T14:22:30+01:00';

        var precipitationStart = this.getNextPrecipStart();
        var precipitationStop = this.getNextPrecipStop();
        var nowCast = this.translate('no_precip_next_90');
        var precipSymbol = '';
        if(precipitationStart != null) {
            if(this.list.points[0].precipitation.intensity === 0) {
                var precipitationStartsIn = this.getMinutesTill(precipitationStart.time);
                if(precipitationStartsIn < 1) {
                    precipitationStop = this.getNextPrecipStop();
                    precipitationStopsIn = this.getMinutesTill(precipitationStop);
                    nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
                }
                else
                    nowCast = printf(this.translate("precip_in"), precipitationStartsIn.toFixed(0));
            }
            else if(!precipitationStop) {
                nowCast = this.translate("precip_next_90");
                precipSymbol = this.getSymbol(this.list.points[0].precipitation.intensity);
            }
            else {
                var precipitationStopsIn = this.getMinutesTill(precipitationStop.time);
                if(precipitationStopsIn < 0) {
                    precipitationStart = this.getNextPrecipStart();
                    precipitationStartsIn = this.getMinutesTill(precipitationStart);
                    nowCast = printf(this.translate("precip_in"), precipitationStartsIn.toFixed(0));
                }
                    
                nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
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
		var nextLoad = 450000;
		if (typeof delay !== 'undefined' && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.getNowcast();
		}, nextLoad);
	}
});