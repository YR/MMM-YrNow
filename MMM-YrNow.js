Module.register('MMM-YrNow', {
	defaults: {
        
	},

	start: function() {
		this.list = null;
		this.loaded = false;
		this.getNowcast();
		this.scheduleUpdate(1000);
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

	getDom: function() {		
		var wrapper = document.createElement('div');
		if (!this.loaded) {
			wrapper.innerHTML = this.translate('loading');
			wrapper.className = 'dimmed light small';
			return wrapper;
	    }
        wrapper.className = 'light medium bright';

        //Add fake data
        this.list.points[5].precipitation.intensity = 0.5;

        var rainStart = this.list.points.filter((item) => item.precipitation.intensity > 0)[0];
        var rainStop = this.list.points.filter((item) => item.precipitation.intensity === 0)[0];
        
        var nowCast = this.translate('norain');

        if(rainStart != null)
        {
            var rainStartsIn = Math.abs(new Date() - new Date(rainStart.time)) / (1000 * 60);
            nowCast = printf(this.translate("precipitation_in"), rainStartsIn.toFixed(0));
        }

        if(rainStop != null)
        {
            var rainStopsIn = Math.abs(new Date() - new Date(rainStop.time)) / (1000 * 60);
            nowCast = printf(this.translate("precipitation_ends"), rainStopsIn.toFixed(0));
        }
        wrapper.innerHTML = nowCast;
    	return wrapper;
	},

	getNowcast: function() {
		var self = this;
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			if (this.readyState == 4 && (this.status == 200 || this.status == 304)) {
				self.processJSON(JSON.parse(this.responseText));
			}
		};
        var yrApiUrl = printf('https://www.yr.no/api/v0/locations/id/%s/forecast/now' ,this.config.locationId);
		req.open('GET', yrApiUrl, true);			
		req.send();
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