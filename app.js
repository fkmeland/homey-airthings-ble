'use strict';

const Homey = require('homey');
const bufferpack = require('./lib/bufferpack');

/*
	Notes etc


	Node.js modules readme:
	https://apps.developer.athom.com/tutorial-App%20Store.html

	modules in use so far:
	- https://github.com/ryanrolds/bufferpack



*/

class AirthingsApp extends Homey.App {

	async onInit() {
		this.log('AirthingsApp is running...!');

	}

	getWaveValues(macAddress, pollTimeout) {
		return new Promise(async (resolve, reject) => {

			this.log(macAddress)
			this.log(pollTimeout)

			let timeout = pollTimeout * 1000;

			try {
				this.log('Searching for: !', macAddress);
				const advertisement = await this.homey.ble.find(macAddress, timeout);
				this.log('Found: !', macAddress);
				await this.sleep(1000);

				const peripheral = await advertisement.connect();
				const rssi = peripheral.rssi;
				await this.sleep(1000);
				this.log('Connected !', macAddress);
				const services = await peripheral.discoverAllServicesAndCharacteristics();
				this.log('Services Discovered !', macAddress);
				const dataService = await services.find(service => service.uuid === "b42e1f6eade711e489d3123b93f75cba");
				const characteristics = await dataService.discoverCharacteristics();

				//Radon Short Term Average
				const staDataChar = await characteristics.find(characteristic => characteristic.uuid === "b42e01aaade711e489d3123b93f75cba");
				const staData = staDataChar && await staDataChar.read();

				//Radon Long Term Average
				const ltaDataChar = await characteristics.find(characteristic => characteristic.uuid === "b42e0a4cade711e489d3123b93f75cba");
				const ltaData = ltaDataChar && await ltaDataChar.read();

				//Temperature
				const tempDataChar = await characteristics.find(characteristic => characteristic.uuid === "00002a0800001000800000805f9b34fb");
				const tempData = tempDataChar && await tempDataChar.read();

				//Humidity
				const humDataChar = await characteristics.find(characteristic => characteristic.uuid === "00002a6f00001000800000805f9b34fb");
				const humData = humDataChar && await humDataChar.read();

				//ALS + Light // 00002a0800001000800000805f9b34fb
				const alsDataChar = await characteristics.find(characteristic => characteristic.uuid == "b42e1096ade711e489d3123b93f75cba")
				const alsData = alsDataChar && await alsDataChar.read();

				await peripheral.disconnect();

				const format = "<h";
				const sensorSTA = staData ? bufferpack.unpack(format, staData)[0] : 0;
				const sensorLTA = ltaData ? bufferpack.unpack(format, ltaData)[0] : 0;
				const sensorTemperature = tempData ? bufferpack.unpack(format, tempData)[0] : 0;
				const sensorHumidity = humData ? bufferpack.unpack(format, humData)[0] : 0;
				const formatTwo = "<B";
				const sensorLight = alsData ? bufferpack.unpack(formatTwo, alsData)[0] & 0xf0 : 0;


				// This is the matching format for the binary data for unpacking.
				//const format = "<xbxbHHHHHHxxxx";
				//const unpacked = bufferpack.unpack(format, sensorData);

				// Sensordata unpacked looks like this:
				// (humidity, light, sh_rad, lo_rad, temp, pressure, co2, voc)
				// Example:
				// [ 81, 0, 10, 0, 2387, 48689, 366, 116 ]
				// Some of the values requires minor math to get correct values

				let sensorValues = {
					humidity: sensorHumidity / 100,
					light: sensorLight,
					shortTermRadon: sensorSTA,
					longTermRadon: sensorLTA,
					temperature: sensorTemperature / 100,
					rssi: rssi
				}

				resolve(sensorValues)

			} catch (error) {
				reject(error)
			}

		})
	}
	getWavePlusValues(macAddress, pollTimeout) {
		return new Promise(async (resolve, reject) => {

			this.log(macAddress)
			this.log(pollTimeout)

			let timeout = pollTimeout * 1000;

			try {
				const advertisement = await this.homey.ble.find(macAddress, timeout);
				const peripheral = await advertisement.connect();
				const rssi = peripheral.rssi;
				this.log('Connected !', macAddress);
				const services = await peripheral.discoverAllServicesAndCharacteristics();
				this.log('Services Discovered !', macAddress);
				const dataService = await services.find(service => service.uuid === "b42e1c08ade711e489d3123b93f75cba");
				const characteristics = await dataService.discoverCharacteristics();
				const data = await characteristics.find(characteristic => characteristic.uuid === "b42e2a68ade711e489d3123b93f75cba");
				const sensorData = await data.read();
				await peripheral.disconnect();

				// This is the matching format for the binary data for unpacking.
				const format = "<xBBxHHHHHHxxxx";
				const unpacked = bufferpack.unpack(format, sensorData);

				// Sensordata unpacked looks like this:
				// (humidity, light, sh_rad, lo_rad, temp, pressure, co2, voc)
				// Example:
				// [ 81, 0, 10, 0, 2387, 48689, 366, 116 ]
				// Some of the values requires minor math to get correct values

				let sensorValues = {
					humidity: unpacked[0] / 2,
					light: unpacked[1],
					shortTermRadon: unpacked[2],
					longTermRadon: unpacked[3],
					temperature: unpacked[4] / 100,
					pressure: unpacked[5] / 50,
					co2: unpacked[6],
					voc: unpacked[7],
					rssi: rssi
				}

				resolve(sensorValues)

			} catch (error) {
				reject(error)
			}

		})
	}
	getWaveMiniValues(macAddress, pollTimeout) {
		return new Promise(async (resolve, reject) => {

			this.log(macAddress)
			this.log(pollTimeout)

			let timeout = pollTimeout * 1000;

			try {
				const advertisement = await this.homey.ble.find(macAddress, timeout);
				const peripheral = await advertisement.connect();
				const rssi = peripheral.rssi;
				this.log('Connected To Mini !', macAddress);
				const services = await peripheral.discoverAllServicesAndCharacteristics();
				this.log('Services Discovered Mini !', macAddress);
				const dataService = await services.find(service => service.uuid === "b42e3882ade711e489d3123b93f75cba");
				const characteristics = await dataService.discoverCharacteristics();
				const data = await characteristics.find(characteristic => characteristic.uuid === "b42e3b98ade711e489d3123b93f75cba");
				const sensorData = await data.read();
				await peripheral.disconnect();
				this.log('Disconnected from Mini, parsing data');
				// This is the matching format for the binary data for unpacking.
				const format = "<HHHHHHxxxx";
				const unpacked = bufferpack.unpack(format, sensorData);

				// Sensordata unpacked looks like this:
				// (humidity, light, sh_rad, lo_rad, temp, pressure, co2, voc)
				// Example:
				// [ 81, 0, 10, 0, 2387, 48689, 366, 116 ]
				// Some of the values requires minor math to get correct values

				let sensorValues = {
					humidity: unpacked[3] / 100,
					light: unpacked[0],
					temperature: (unpacked[1] / 100) - 273.15, //In Kelvin on Mini
					pressure: unpacked[2] / 50,
					voc: unpacked[4],
					rssi: rssi
				}
				resolve(sensorValues)

			} catch (error) {
				reject(error)
			}

		})
	}
	sleep(ms) {
		return new Promise(resolve => {
			setTimeout(resolve, ms)
		})
	}
	discoverWaveDevices(driver) {
		return new Promise(async (resolve, reject) => {

			this.log("Searching for Airthings Wave devices...")
			const timeout = 29000;

			try {
				let devices = [];
				// Wave : b42e1f6eade711e489d3123b93f75cba
				const foundDevices = await this.homey.ble.discover(['b42e1f6eade711e489d3123b93f75cba'], timeout);

				foundDevices.forEach(device => {
					const format = "<xxIxx";
					devices.push({
						name: "Airthings Wave (" + bufferpack.unpack(format, device.manufacturerData)[0] + ")",
						data: {
							id: device.id,
							uuid: device.uuid,
							address: device.address
						}
					})
				});

				resolve(devices)
			} catch (error) {
				reject(error)
			}

		});
	}
	discoverWavePlusDevices(driver) {
		return new Promise(async (resolve, reject) => {

			this.log("Searching for Airthings Wave Plus devices...")
			const timeout = 29000;

			try {
				let devices = [];
				// Wave + : b42e1c08ade711e489d3123b93f75cba
				const foundDevices = await this.homey.ble.discover(['b42e1c08ade711e489d3123b93f75cba'], timeout);

				this.log(foundDevices);

				foundDevices.forEach(device => {
					const format = "<xxIxx";
					devices.push({
						name: "Airthings Wave + (" + bufferpack.unpack(format, device.manufacturerData)[0] + ")",
						data: {
							id: device.id,
							uuid: device.uuid,
							address: device.address
						}
					})
				});

				resolve(devices)
			} catch (error) {
				reject(error)
			}

		});
	}
	discoverWaveMiniDevices(driver) {
		return new Promise(async (resolve, reject) => {

			this.log("Searching for Airthings Wave Mini devices...")
			const timeout = 29000;

			try {
				let devices = [];
				// Wave + : b42e3882ade711e489d3123b93f75cba
				const foundDevices = await this.homey.ble.discover(['b42e3882ade711e489d3123b93f75cba'], timeout);

				foundDevices.forEach(device => {
					const format = "<xxIxx";
					devices.push({
						name: "Airthings Wave Mini (" + bufferpack.unpack(format, device.manufacturerData)[0] + ")",
						data: {
							id: device.id,
							uuid: device.uuid,
							address: device.address
						}
					})
				});

				resolve(devices)
			} catch (error) {
				reject(error)
			}

		});
	}
}

module.exports = AirthingsApp;