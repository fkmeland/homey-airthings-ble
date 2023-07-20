'use strict';

const Homey = require('homey');

class WavePlusDriver extends Homey.Driver {

	onInit() {
		this.log('WavePlusDriver has been inited');
	}

	// This method is called when a user is adding a device
	// and the 'list_devices' view is called
	async onPairListDevices() {
		try {
			const devices = await this.homey.app.discoverWavePlusDevices(this);
			this.log(devices);
			return devices;
		}
		catch (error) {
			this.log(error);
			return Promise.reject(new Error('Cannot find devices:' + error));
		}
	}

}

module.exports = WavePlusDriver;