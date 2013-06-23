var modules = {
   launchpad: {
     _serialoscMapFunc: function(noteNum) {
       var x = noteNum % 8;
       var y = Math.floor(noteNum / 8);
       console.log('press event: converted note ' + noteNum + ' to ' + x + ', ' + y)
       return [x, y];
     },
     // this should map an x/y coordinate to a midi note number
     _midiMapFunc: function(data) {
       var noteNum = data.x + (data.y * 8);
       console.log('led event: converted ' + data.x + ', ' + data.y + ' to note ' + noteNum);
       return noteNum;
     },
     // the velocity to use when turning a led on
     _velocityOn: function(data) {
       return 127;
     },
     // the velocity to use when turning a led off
     _velocityOff: function(data) {
       return 0;
     }
   }
};


var Ui = new Class({
	Implements: [Options, Events],
	options: {
		container: false
	},
	_container: false,
	_midiPorts: {input: false, output: false},
	_bound: {},
	_devices: {},
	initialize: function(options) {
		this.setOptions(options);
		this._container = this.options.container;
		this._setMidiPorts()._draw()._setEvents();
		document.id('loading').destroy();
	},

	_setMidiPorts: function() {
		var midi = require('midi');
		this._midiPorts.input = new midi.input();
		this._midiPorts.output = new midi.output();
		return this;
	},
	_enumerateMidiPorts: function(ports) {
		var obj = {};
		for (var i = 0; i < ports.getPortCount(); i++) {
			obj[i] = ports.getPortName(i);
		}
		return obj;
		
	},
	_draw: function() {
		this._drawOptionInput('deviceSerial', 'Serial Number', 'm40h0001')
			._drawOptionInput('deviceName', 'Zeroconf Name', 'monome 64 (m40h0001)')
			._drawOptionInput('devicePrefix', 'Prefix', '/monome')
			._drawOptionSelect('midi-ins', 'MIDI Input', this._enumerateMidiPorts(this._midiPorts.input), false)
			._drawOptionSelect('midi-outs', 'MIDI Output', this._enumerateMidiPorts(this._midiPorts.output), false)
			._drawOptionSelect('modules', 'Module', Object.keys(modules), false)
			new Element('button', {'id': 'add-btn', 'html': 'Add device'}).inject(this._container);
		return this;
	},
	_drawOptionInput: function(id, labelTxt, value) {
		var d = new Element('div', {'class': 'option'}).inject(this._container);
		new Element('label', {'for': id, 'html': labelTxt}).inject(d);
		new Element('input', {'type': 'text', 'id': id, 'value': value}).inject(d);
		return this;
	},
	_drawOptionSelect: function(id, labelTxt, choices, value) {
		var d = new Element('div', {'class': 'option'}).inject(this._container);
		new Element('label', {'for': id, 'html': labelTxt}).inject(d);
		var s = new Element('select', {'id': id, 'value': value}).inject(d);
		Object.each(choices, function(v, k){
			new Element('option', {'value': k, 'html': v}).inject(s);
		})
		s.set('value', value);
		return this;
	},
	_eventAddDevice: function(e) {
		var midiInIdx = document.id('midi-ins').get('value').toInt();
		var midiOutIdx = document.id('midi-outs').get('value').toInt();
		var module = document.id('modules').get('value');
		if (!midiInIdx) midiInIdx = 0;
		if (!midiOutIdx) midiOutIdx = 0;
		if (!module) module = 0;
		// alert('midiInIdx: '+midiInIdx+', midiOutIdx: '+midiOutIdx+ ', module: '+module);

		var opts = {
			serialoscId: document.id('deviceSerial').get('value'),
			name: document.id('deviceName').get('value'),
			prefix: document.id('devicePrefix').get('value'),
			midiIn: this._midiPorts.input.getPortName(midiInIdx),
			midiOut: this._midiPorts.output.getPortName(midiOutIdx)
		};
		var midigrid = require('midigrid');
		var emulator = new midigrid(opts);
// //		emulator = $.extend(emulator, module);
		emulator.start();
		this._devices[emulator._attributes.id] = emulator;
		var removeBtn = new Element('button', {'type': 'button', 'class': 'remove', 'rel': emulator._attributes.id, 'html': 'Stop '+opts.name}).inject(document.id('running-emulators'));
	},
	_eventRemoveDevice: function(e, el) {
		e.stop();
		var id = el.get('rel');
		this._devices[id].stop();
		el.destroy();
	},
	_setEvents: function() {
		this._bound._eventAddDevice = this._eventAddDevice.bind(this);
		document.id('add-btn').addEvent('click', this._bound._eventAddDevice);
		this._bound._eventRemoveDevice = this._eventRemoveDevice.bind(this);
		document.id('running-emulators').addEvent('click:relay(button.remove)', this._bound._eventRemoveDevice);
		return this;
	}
});
alert('ui.js loaded');