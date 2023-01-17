# MagicMirror² Module: YrNow

<img src="/images/screenshot.png" align="right"/>This is the official Yr Nowcast module for [MagicMirror²](https://github.com/MichMich/MagicMirror), which displays data from [Yr](https://www.yr.no/nb/).
Nowcast data is only available for some Norwegian locations covered by the Norwegian weather radars. See [Explanation (in Norwegian)](https://yrkundesenter.zendesk.com/hc/no/articles/209295525-N%C3%A5varsel-Pr%C3%B8v-v%C3%A5rt-nye-nedb%C3%B8rvarsel-)!
 Sometimes the Nowcast will tell you "no precipitation next 90 minutes", while the weather symbol contains rain or snow. This is expected, since the weather symbol is based on a weather model and Nowcast is based on radar observations.

The temperature value is fetched from the current hour in the weather forecast for your location.

## How to install

Remote into your Magic Mirror box using a terminal software and go to the modules folder:

    cd ~/MagicMirror/modules

Clone the repository:

	git clone https://github.com/YR/MMM-YrNow

Prerequisites (make sure to also have request installed):

	npm install request

Add the module to the modules array in the config/config.js file by adding the following section. You can change this configuration later when you see this works:

	{
		module: 'MMM-YrNow',
		position: 'top_right',
		config: {
			locationId: '1-73738',
            showWeatherForecast: true
		}
	},

## Configuration options

<table style="width:100%">
	<tr>
		<th>Option</th>
		<th>Comment</th>
		<th>Default</th>
	</tr>
	<tr>
		<td>locationId</td>
		<td>The unique Id found in the Url of any location on <a href="https://www.yr.no/nb/liste/dag/1-73738/Norge/Oslo/Oslo/Blindern">Yr</a> I.e. Blindern (Oslo)</td>
		<td>1-73738</td>
	</tr>
    <tr>
        <td>showWeatherForecast</td>
        <td>If there's no precipitation in the nowcast, the weather forecast for the next period is shown.</td>
        <td>true</td>
    </tr>
</table>
