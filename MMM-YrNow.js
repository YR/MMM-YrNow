Module.register('MMM-YrNow', {
	defaults: {
        yrApiUrl: "https://www.yr.no/api/v0/locations/%s/forecast",
        updateInterval: 10000
	},

    getTranslations: function() {
        return {
            en: "translations/en.json",
            no: "translations/no.json",
            se: "translations/se.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js',
            'readTextFile.js'
        ];
    },

    getStyles: function() {
		return ['mmm-yrnow.css'];
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
                this.processNowcast(payload.nowcast);
                if(this.config.showWeatherForecast)
                    this.processForecast(payload.forecast);
            }
            this.updateDom(1000);
		}
	},

    getForecast: function(url) {
        this.sendSocketNotification('GET_YR_FORECAST', {
            forecastUrl: url,
            config: this.config
        });
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
        var animationWrapper = document.createElement('div');
        animationWrapper.className = 'animation';

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('loading');
			wrapper.className = 'dimmed light small';
			return wrapper;
	    }
        var nowCast = this.translate('no_precip_next_90');
        var precipitationStart = this.getNextPrecipStart();
        var precipitationStop = this.getNextPrecipStop();
        var forecast = document.createElement('div');
        forecast.className = 'forecast';

        if(precipitationStart != null) {
            //Precip some time during the next 90 minutes
            var precipitationStartsIn = this.getMinutesTill(precipitationStart.time);
            forecast.appendChild(animationWrapper);
                
            //Precip now
            if(precipitationStartsIn < 7) {
                this.createAnimation(animationWrapper);
                forecast.appendChild(this.getUmbrella());            
                if(precipitationStop) {
                    precipitationStopsIn = this.getMinutesTill(precipitationStop.time);
                    nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
                }
                else
                    nowCast = this.translate("precip_next_90");
            }
            else {
                //Precip in n minutes
                forecast.appendChild(this.getUmbrella());
                nowCast = printf(this.translate("precip_in"), precipitationStartsIn.toFixed(0));
            }
        }

        if(nowCast == this.translate('no_precip_next_90') && this.config.showWeatherForecast) {
            forecast.appendChild(this.getWeatherSymbol());
        }
        wrapper.appendChild(forecast);
        wrapper.appendChild(this.getTemperature());
        wrapper.appendChild(this.createNowcastText(nowCast));
    	return wrapper;
	},

    createNowcastText: function(nowCast) {
        var nowCastText = document.createElement('p');   
        nowCastText.className = 'medium precipText';
        nowCastText.innerHTML = nowCast;
        return nowCastText
    }, 

    createAnimation: function(testElement) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                testElement.appendChild(xhr.responseXML.documentElement);
            }
        };
        xhr.open('GET', this.file('images/rain.svg'), true);
        xhr.send('');
    },

    getUmbrella: function() {
        var umbrella = document.createElement('img');
        umbrella.className = 'umbrella';
        umbrella.src = this.file('images/umbrella.svg');
        return umbrella;
    },

    getWeatherSymbol: function() {
        var symbol = document.createElement('img');
        symbol.className = 'weatherSymbol';
        symbol.src = this.file(printf('images/%s.svg', this.weatherSymbol));
        return symbol;
    },

    getTemperature: function() {
        var temp = document.createElement('div');
        temp.className = 'temperature light large bright';
        temp.innerHTML = printf('%s°', Math.round(this.temperature));
        return temp;
    },

	processNowcast: function(obj) {
        if(obj.points) {
            this.list = obj;
            this.loaded = true;	
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
        }
    }
});
