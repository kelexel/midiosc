
var fs = require('fs');
var modules = ['launchpad', 'apc'];
var refDevCnt = 0;

var Ui = new Class({
	Implements: [Options, Events],
	options: {
		container: false
	},
	_container: false,
	_form: false,
	_formVisible: false,
	_midiPorts: {input: false, output: false},
	_bound: {},
	_devices: {},
	initialize: function(options) {
		this.setOptions(options);
		this._container = document.id(this.options.container);
		this._form = new Element('form', {'id': 'addDevice', 'method': 'post'}).inject(this._container);
		this._setMidiPorts()._setEvents();
		document.id('loading').destroy();
		if (this.minimize) this.minimize();
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
	_drawForm: function() {
		this._form.set('html', '');
		refDevCnt++;
		var alias = 'm40h'+String("000" + refDevCnt).slice(-3);
		new Element('h2', {'html': 'Add a new device'}).inject(this._form);
		this._drawOptionInput('deviceSerial', 'Serial Number', alias)
			._drawOptionInput('deviceName', 'Zeroconf Name', 'monome 64 ('+alias+')')
			._drawOptionInput('devicePrefix', 'Prefix', '/monome')
			._drawOptionSelect('midi-ins', 'MIDI Input', this._enumerateMidiPorts(this._midiPorts.input), false)
			._drawOptionSelect('midi-outs', 'MIDI Output', this._enumerateMidiPorts(this._midiPorts.output), false)
			._drawOptionSelect('modules', 'Module', modules, false)
			new Element('button', {'type': 'button', 'class': 'add', 'html': 'Create'}).inject(this._form);
			new Element('button', {'type': 'button', 'class': 'cancel', 'html': 'Cancel'}).inject(this._form);
			// new Element('br').inject(this._form);
			// new Element('input', {'type': 'file', 'class': 'load', 'html': 'Load config', 'name': 'configLoad',  'accept': 'application/json'}).inject(this._form);
			// new Element('button', {'type': 'button', 'class': 'save', 'html': 'Save config'}).inject(this._form);
		this._formVisible = true;
		return this;
	},
	_drawOptionInput: function(id, labelTxt, value) {
		var d = new Element('div', {'class': 'option'}).inject(this._form);
		new Element('label', {'for': id, 'html': labelTxt}).inject(d);
		new Element('input', {'type': 'text', 'id': id, 'value': value}).inject(d);
		return this;
	},
	_drawOptionSelect: function(id, labelTxt, choices, value) {
		var d = new Element('div', {'class': 'option'}).inject(this._form);
		new Element('label', {'for': id, 'html': labelTxt}).inject(d);
		var s = new Element('select', {'id': id, 'value': value}).inject(d);
		Object.each(choices, function(v, k){
			new Element('option', {'value': k, 'html': v}).inject(s);
		})
		s.set('value', value);
		return this;
	},
	_drawDevice: function(id) {
		var emulator = this._devices[id].device;
		var li = new Element('li', {'class': 'emulator'}).inject(document.id('running-emulators'));
		new Element('p', {'class': 'title', 'html': emulator._attributes.name}).inject(li);

		var p = new Element('p', {'class': 'row'}).inject(li);
		new Element('span', {'class': 'title', 'html': 'Midi In: <em>'+emulator._attributes.midiIn+'</em>'}).inject(p);
		new Element('span', {'class': 'title', 'html': 'Midi Out: <em>'+emulator._attributes.midiOut+'</em>'}).inject(p);

		var p = new Element('p', {'class': 'row'}).inject(li);
		new Element('span', {'class': 'title', 'html': 'Prefix: <em>'+emulator._attributes.prefix+'</em>'}).inject(p);

		var p = new Element('p', {'class': 'activity'}).inject(li);
		new Element('span', {'class': 'title', 'html': 'OSC'}).inject(p);
		var s = new Element('span', {'class': 'direction', 'html': 'In'}).inject(p);
		this._devices[id].listeners.osc.in = new Element('span', {'class': 'state'}).inject(s);
		var s = new Element('span', {'class': 'direction', 'html': 'Out'}).inject(p);
		this._devices[id].listeners.osc.out = new Element('span', {'class': 'state'}).inject(s)

		var p = new Element('p', {'class': 'activity'}).inject(li);
		new Element('span', {'class': 'title', 'html': 'Midi'}).inject(p);
		var s = new Element('span', {'class': 'direction', 'html': 'In'}).inject(p);
		this._devices[id].listeners.midi.in = new Element('span', {'class': 'state'}).inject(s);
		var s = new Element('span', {'class': 'direction', 'html': 'Out'}).inject(p);
		this._devices[id].listeners.midi.out = new Element('span', {'class': 'state'}).inject(s)

		var p = new Element('p', {'class': 'row'}).inject(li);
		new Element('button', {'type': 'button', 'class': 'remove', 'rel': id, 'html': 'Remove'}).inject(p)

		if (this._formVisible) this._eventFormHide();
	},
	_eventAddDevice: function(e, el, opts) {
		if (!opts) {
			var midiInIdx = document.id('midi-ins').get('value').toInt();
			var midiOutIdx = document.id('midi-outs').get('value').toInt();
			var module = modules[document.id('modules').get('value')];
			if (!midiInIdx) midiInIdx = 0;
			if (!midiOutIdx) midiOutIdx = 0;
			if (!module) module = modules[0];

			opts = {
				serialoscId: document.id('deviceSerial').get('value'),
				name: document.id('deviceName').get('value'),
				prefix: document.id('devicePrefix').get('value'),
				midiIn: this._midiPorts.input.getPortName(midiInIdx),
				midiOut: this._midiPorts.output.getPortName(midiOutIdx),
				module: module
			};
		}
		var emulator = new (require('./lib/modules/'+opts.module+'.js'))(opts);
		emulator.start();
		this._devices[emulator._attributes.id] = {'device': emulator, 'listeners': {'osc': {'in': false, 'out': false}, 'midi': {'in': false, 'out': false}}};
		this._debug('Emulator '+opts.name+' created'); 
		this._drawDevice(emulator._attributes.id);
	},
	_eventRemoveDevice: function(e, el) {
		e.stop();
		var id = el.get('rel');
		this._devices[id].device.stop();
		delete this._devices[id];
		el.getParent('li').destroy();
	},
	_eventFormShow: function(e, el) {
		if (e) e.stop();
		e.stop();
		this._drawForm();
	},
	_eventFormHide: function(e, el) {
		if (e) e.stop();
		this._form.set('html', '');
	},
	_eventLoadConfig: function(e, el) {
		// e.stop();
		el = e.target;
		if (!el.get('value')) return;
		fs.readFile(el.get('value'), function (err, data) {
			if (err) throw err;
			devices = JSON.parse(data);
			Object.each(devices, function(attrs, dev) {
				this._eventAddDevice(false, false, attrs);
			}, this);
			return;
		}.bind(this));
	},
	_eventSaveConfig: function(e, el) {
		e.stop();
		var conf = {};
		Object.each(this._devices, function(dev, name){
			conf[name] = dev.device.getConfig();
		});
		fs.mkdir('./config', function() {
			fs.writeFile('./config/midiosc_config.json', JSON.stringify(conf), "UTF-8", function(err, res) {
				// window.location.href = './config/midiosc_config.json';
				window.open('./config/midiosc_config.json', '_blank')
			})
		})
	},
	_setEvents: function() {
		this._bound._eventAddDevice = this._eventAddDevice.bind(this);
		document.id('emu').addEvent('click:relay(button.add)', this._bound._eventAddDevice);

		this._bound._eventFormShow = this._eventFormShow.bind(this);
		document.id('addNewDevice').addEvent('click', this._bound._eventFormShow);

		this._bound._eventFormHide = this._eventFormHide.bind(this);
		document.id('emu').addEvent('click:relay(button.cancel)', this._bound._eventFormHide);

		this._bound._eventLoadConfig = this._eventLoadConfig.bind(this);
		// document.id('emu').addEvent('change:relay(input.load)', this._bound._eventLoadConfig);
		document.id('loadConfig').addEvent('change', this._bound._eventLoadConfig);
		
		this._bound._eventSaveConfig = this._eventSaveConfig.bind(this);
		// document.id('emu').addEvent('click:relay(button.save)', this._bound._eventSaveConfig);
		document.id('saveConfig').addEvent('click', this._bound._eventSaveConfig);
		
		this._bound._eventRemoveDevice = this._eventRemoveDevice.bind(this);
		document.id('running-emulators').addEvent('click:relay(button.remove)', this._bound._eventRemoveDevice);
		return this;
	},
	_debug: function(str) {
		if (!console || !console.log) return;
		console.log(str);
	}
});

var minimize = {
	minimize: function() {
		// Load library
		var gui = require('nw.gui');
		
		// Reference to window and tray
		var win = gui.Window.get();
		var tray;

		// Get the minimize event
		win.on('minimize', function() {
			// Hide window
			this.hide();

			// Show tray
			tray = new gui.Tray({ icon: 'icon.png' });

			// Show window and remove tray when clicked
			tray.on('click', function() {
				win.show();
				this.remove();
				tray = null;
			});
		});
	}
}
Ui.implement(minimize);