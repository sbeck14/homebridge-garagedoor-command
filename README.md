# homebridge-garagedoor-relay
Extremely simple [Homebridge](https://github.com/nfarina/homebridge) plugin for controlling a garage door. Designed to be used with a raspberry pi connected to a relay and running [garage-control](https://github.com/sbeck14/garage-control).

Built upon [homebridge-garagedoor-command](apexad/homebridge-garagedoor-command)

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-garagedoor-relay`
3. Update your configuration file. See the sample below.

## Configuration

Configuration sample:

```json
"accessories": [
  {
    "accessory": "GarageRelay",
    "name": "Garage Door",
    "open": "http://192.168.1.50:3000/open",
    "close": "http://192.168.1.50:3000/close",
    "state": "http://192.168.1.50:3000/state",
    "status_update_delay": 15,
    "poll_state_delay": 20
  }
]
```
## Explanation:

Field                   | Description
------------------------|------------
**accessory**           | Must always be "GarageRelay". (required)
**name**                | Name of the Garage Door
**open**                | URL to open garage door. Examples: `http://192.168.1.50:3000/open` (required)
**close**               | URL to close garage door. Examples: `http://192.168.1.50:3000/close` (required)
**state**               | URL to check state of garage door  Examples: `http://192.168.1.50:3000/state` (required)
**status_update_delay** | Time to have door in opening or closing state (defaults to 15 seconds)
**poll_state_delay**    | Time between polling for the garage door's state (leave blank to disable state polling)

The open, close, and state URLs must return the following verbs: OPEN, CLOSED, OPENING, CLOSING.
