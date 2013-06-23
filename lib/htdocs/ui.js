
var modules = ['launchpad'];

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
			._drawOptionSelect('modules', 'Module', modules, false)
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
		var module = modules[document.id('modules').get('value')];
		if (!midiInIdx) midiInIdx = 0;
		if (!midiOutIdx) midiOutIdx = 0;
		if (!module) module = modules[0];

		var opts = {
			serialoscId: document.id('deviceSerial').get('value'),
			name: document.id('deviceName').get('value'),
			prefix: document.id('devicePrefix').get('value'),
			midiIn: this._midiPorts.input.getPortName(midiInIdx),
			midiOut: this._midiPorts.output.getPortName(midiOutIdx)
		};
		var emulator = new (require('./lib/modules/'+module+'.js'))(opts);
		emulator.start();
		this._devices[emulator._attributes.id] = emulator;
		this._debug('Emulator '+opts.name+' created');
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
	},
	_debug: function(str) {
		if (!console || !console.log) return;
		console.log(str);
	}
});