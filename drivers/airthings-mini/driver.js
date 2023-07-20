'use strict';

const Homey = require('homey');

class WaveMiniDriver extends Homey.Driver {

	onInit() {
		this.log('WaveMiniDriver has been inited');
	}

	// This method is called when a user is adding a device
	// and the 'list_devices' view is called
	async onPairListDevices() {

		try {
			const devices = await this.homey.app.discoverWaveMiniDevices(this);
			this.log(devices);
			return devices;
		}
		catch (error) {
			this.log(error);
			return Promise.reject(new Error('Cannot find devices:' + error));
		}
	}
}

module.exports = WaveMiniDriver;