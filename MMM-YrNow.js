Module.register('MMM-YrNow', {
	defaults: {
        yrApiUrl: "https://www.yr.no/api/v0/locations/id/%s/forecast"
	},

    getTranslations: function() {
        return {
            no: "translations/no.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js',
            'readTextFile.js'
        ];
    },

    getStyles: function() {
        return [
            'styles.css'
        ];
    },

	start: function() {
		this.list = null;
		this.loaded = false;
        var forecastUrl = printf(printf('%s', this.config.yrApiUrl),this.config.locationId);
        this.getForecast(forecastUrl);
        var self = this;
        setInterval(function() {
            self.updateDom(1000);
        }, 60000);
	},

    socketNotificationReceived: function(notification, payload) {
		if(notification === 'YR_FORECAST_DATA') {
			if(payload.nowcast.points != null) {
                var nextUpdate = payload.nowcast.update;
                var millisToUpdate = Math.abs((Date.parse(nextUpdate) - new Date()));
                if (!this.loaded) {
                    this.scheduleUpdate(millisToUpdate);
				    this.processNowcast(payload.nowcast);
                    if(this.config.showWeatherForecast)
                        this.processForecast(payload.forecast);
                }
    			this.loaded = true;
			}
		}
	},

    getForecast: function(url) {
        this.sendSocketNotification('GET_YR_FORECAST', url);
    },

    getNextPrecipStart: function() {
        return this.list.points.filter((item) => 
            item.precipitation.intensity > 0 && Date.parse(item.time) >= new Date().valueOf())[0];
    },

    getNextPrecipStop: function() {
        return this.list.points.filter((item) => 
            item.precipitation.intensity === 0 && Date.parse(item.time) >= new Date().valueOf())[0];
    },

    getMinutesTill: function(nextItemTime) {
        return Math.abs(Date.parse(nextItemTime) - new Date().valueOf()) / (1000 * 60);
    },

	getDom: function() {
		var wrapper = document.createElement('div');

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('loading');
			wrapper.className = 'dimmed light small';
			return wrapper;
	    }
        wrapper.className = 'light large bright';
        var nowCast = this.translate('no_precip_next_90');
        var precipitationStart = this.getNextPrecipStart();
        var precipitationStop = this.getNextPrecipStop();

        if(precipitationStart != null) {
            //Precip some time during the next 90 minutes
            var precipitationStartsIn = this.getMinutesTill(precipitationStart.time);
                
            //Precip now
            if(precipitationStartsIn < 7) {
                this.createAnimation(wrapper);
                wrapper.appendChild(this.getUmbrella());
                
                if(precipitationStop) {
                    precipitationStopsIn = this.getMinutesTill(precipitationStop.time);
                    nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
                }
                else
                    nowCast = this.translate("precip_next_90");
            }
            else {
                //Precip in n minutes
                wrapper.appendChild(this.getUmbrella());
                nowCast = printf(this.translate("precip_in"), precipitationStartsIn.toFixed(0));
            }
        }

        if(wrapper.childElementCount === 0 && this.config.showWeatherForecast)
            wrapper.appendChild(this.getWeatherSymbol());

        var precipText = document.createElement('p');
        precipText.className = 'precipText';
        precipText.innerHTML = nowCast; 
        wrapper.appendChild(precipText);
    	return wrapper;
	},

    createAnimation: function(testElement) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.file('images/rain.svg'), false);
        xhr.send('');
        testElement.appendChild(xhr.responseXML.documentElement);
    },

    getUmbrella: function() {
        var umbrella = document.createElement('img');
        umbrella.className = 'nowcast';
        umbrella.src = this.file('images/umbrella.svg');
        return umbrella;
    },

    getWeatherSymbol: function() {
        var forecast = document.createElement('div');
        forecast.className = 'forecast';
        var temp = document.createElement('span');
        temp.innerHTML = printf('%s°', Math.round(this.temperature));
        temp.className = 'temperature';
        var symbol = document.createElement('img');
        symbol.src = this.file(printf('images/%s.svg', this.weatherSymbol));
        forecast.appendChild(symbol);
        forecast.appendChild(temp);
        return forecast;
    },

	processNowcast: function(obj) {
        if(obj.points) {
            this.list = obj;
            this.loaded = true;	
            this.updateDom(1000);
        }
	},

    calculateWeatherSymbolId: function(data) {
        if (!data) return '';
        let id = data.n < 10 ? printf('0%s', data.n) : data.n;
        switch (data.var) {
            case 'Sun':
            id += 'd';
            break;
            case 'PolarNight':
            id += 'm';
            break;
            case 'Moon':
            id += 'n';
            break;
        }
        return id;
    },

    processForecast: function(obj) {
        if(obj.shortIntervals) {
            this.weatherSymbol = this.calculateWeatherSymbolId(obj.shortIntervals[0].symbol);
            this.temperature = obj.shortIntervals[0].temperature.value;
            this.loaded = true;
            this.updateDom(1000);
        }
    },

	scheduleUpdate: function(delay) {
		var nextLoad = 450000;
		if (typeof delay !== 'undefined' && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.getForecast();
		}, nextLoad);
	}
});