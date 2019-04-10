var Service;
var Characteristic;
const axios = require('axios');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-garagedoor-relay', 'GarageRelay', GarageCmdAccessory);
};

function GarageCmdAccessory(log, config) {
  this.log = log;
  this.name = config.name;
  this.openCommand = config.open;
  this.closeCommand = config.close;
  this.stateCommand = config.state;
  this.statusUpdateDelay = config.status_update_delay || 15;
  this.pollStateDelay = config.poll_state_delay || 0;
}

GarageCmdAccessory.prototype.setState = function(isClosed, callback, context) {
  if (context === 'pollState') {
    // The state has been updated by the pollState command - don't run the open/close command
    callback(null);
    return;
  }

  var accessory = this;
  var state = isClosed ? 'close' : 'open';
  var prop = state + 'Command';
  var command = accessory[prop];
  accessory.log('Commnand to run: ' + command);

  axios.get(command).then(({ data: status }) => {
    accessory.log(`Set ${accessory.name} to ${state}`);
    if (status === 'OPENING') {
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
      setTimeout(
        function() {
          accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
        },
        accessory.statusUpdateDelay * 1000
      );
    } else if (status === 'CLOSING') {
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
      setTimeout(
        function() {
          accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
        },
        accessory.statusUpdateDelay * 1000
      );
    }
    callback(null);
  }).catch(err => {
    accessory.log('Error: ' + err);
    callback(err || new Error('Error setting ' + accessory.name + ' to ' + state));
  });
};

GarageCmdAccessory.prototype.getState = function(callback) {
  var accessory = this;
  var command = accessory.stateCommand;

  axios.get(command).then(({ data: status }) => {
    accessory.log(`State of ${accessory.name} is ${status}`);
    callback(null, Characteristic.CurrentDoorState[status]);
    if (accessory.pollStateDelay > 0) {
      accessory.pollState();
    }
  }).catch(err => {
    accessory.log('Error: ' + err);
    callback(err || new Error('Error getting state of ' + accessory.name));
  })
};

GarageCmdAccessory.prototype.pollState = function() {
  var accessory = this;

  // Clear any existing timer
  if (accessory.stateTimer) {
    clearTimeout(accessory.stateTimer);
    accessory.stateTimer = null;
  }

  accessory.stateTimer = setTimeout(
    function() {
      accessory.getState(function(err, currentDeviceState) {
        if (err) {
          accessory.log(err);
          return;
        }

        if (currentDeviceState === Characteristic.CurrentDoorState.OPEN || currentDeviceState === Characteristic.CurrentDoorState.CLOSED) {
          // Set the target state to match the actual state
          // If this isn't done the Home app will show the door in the wrong transitioning state (opening/closing)
          accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
            .setValue(currentDeviceState, null, 'pollState');
        }
        accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, currentDeviceState);
      })
    },
    accessory.pollStateDelay * 1000
  );
}

GarageCmdAccessory.prototype.getServices = function() {
  this.informationService = new Service.AccessoryInformation();
  this.garageDoorService = new Service.GarageDoorOpener(this.name);

  this.informationService
  .setCharacteristic(Characteristic.Manufacturer, 'Garage Command')
  .setCharacteristic(Characteristic.Model, 'Homebridge Plugin')
  .setCharacteristic(Characteristic.SerialNumber, '001');

  this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
  .on('set', this.setState.bind(this));

  if (this.stateCommand) {
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', this.getState.bind(this));
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
    .on('get', this.getState.bind(this));
  }

  return [this.informationService, this.garageDoorService];
};
