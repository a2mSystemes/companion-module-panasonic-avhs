const dgram = require('dgram')
const { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper, UDPHelper, combineRgb } = require('@companion-module/base')
const Presets = require('./presets')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

const {networkInterfaces} = require('os')


// https://github.com/bitfocus/companion/files/2163236/AV-HS410-HS410_IF-Protocol-Ver1.3EVol_1.pdf
// https://eww.pass.panasonic.co.jp/pro-av/support/dload/hs410_aux202/AV-HS410-AUXP_IP-Protocol-Ver1.3EVol_2.pdf
// https://eww.pass.panasonic.co.jp/pro-av/support/content/guide/DEF/HS50_IP/AW-HS50InterfaceSpecifications-V1.00E.pdf
// https://eww.pass.panasonic.co.jp/pro-av/support/content/download/DEF/soft/lps/AV-UHS500_InterfaceGuide(DVQP2369YA)_E.pdf

var STX = String.fromCharCode(0x02)
var ETX = String.fromCharCode(0x03)

// ##########################
// #### Define Dropdowns ####
// ##########################

var UHS500_BUS = [
	{ id: '01', label: 'ME1PGM' },
	{ id: '02', label: 'ME1PVW' },
	{ id: '03', label: 'ME1KEY1-F' },
	{ id: '04', label: 'ME1KEY1-S' },
	{ id: '05', label: 'ME1KEY2-F' },
	{ id: '06', label: 'ME1KEY2-S' },
	{ id: '07', label: 'ME1KEY3-F' },
	{ id: '08', label: 'ME1KEY3-S' },
	{ id: '97', label: 'DSK1-F' },
	{ id: '98', label: 'DSK1-S' },
	{ id: '99', label: 'DSK2-F' },
	{ id: '100', label: 'DSK2-S' },
	{ id: '113', label: 'AUX 1' },
	{ id: '114', label: 'AUX 2' },
	{ id: '115', label: 'AUX 3' },
	{ id: '116', label: 'AUX 4' },
	{ id: '141', label: 'DISP' },
	{ id: '150', label: 'VMEM-V' },
	{ id: '151', label: 'VMEM-K' },
	{ id: '153', label: 'MV1-1' },
	{ id: '168', label: 'MV1-16' },
	{ id: '169', label: 'MV2-1' },
	{ id: '184', label: 'MV2-16' },
]

var HS410_BUS = [
	{ id: '02', label: 'PGM' },
	{ id: '03', label: 'PVW' },
	{ id: '00', label: 'Bus A' },
	{ id: '01', label: 'Bus B' },
	{ id: '04', label: 'Key Fill' },
	{ id: '05', label: 'Key Source' },
	{ id: '06', label: 'DSK Fill' },
	{ id: '07', label: 'DSK Source' },
	{ id: '10', label: 'PinP 1' },
	{ id: '11', label: 'PinP 2' },
	{ id: '12', label: 'Aux 1' },
	{ id: '13', label: 'Aux 2' },
	{ id: '14', label: 'Aux 3' },
	{ id: '15', label: 'Aux 4' },
]

var HS50_BUS = [
	{ id: '02', label: 'PGM' },
	{ id: '03', label: 'PVW' },
	{ id: '00', label: 'Bus A' },
	{ id: '01', label: 'Bus B' },
	{ id: '04', label: 'Key Fill' },
	{ id: '05', label: 'Key Source' },
	{ id: '10', label: 'PinP' },
	{ id: '12', label: 'Aux' },
]

var UHS500_INPUTS = [
	{ id: '01', label: 'IN1' },
	{ id: '02', label: 'IN2' },
	{ id: '03', label: 'SDI IN3' },
	{ id: '04', label: 'SDI IN4' },
	{ id: '05', label: 'SDI IN5' },
	{ id: '06', label: 'SDI IN6' },
	{ id: '07', label: 'SDI IN7' },
	{ id: '08', label: 'SDI IN8' },
	{ id: '09', label: 'OPA IN1' },
	{ id: '10', label: 'OPA IN2' },
	{ id: '11', label: 'OPA IN3' },
	{ id: '12', label: 'OPA IN4' },
	{ id: '13', label: 'OPB IN1' },
	{ id: '14', label: 'OPB IN2' },
	{ id: '15', label: 'OPB IN3' },
	{ id: '16', label: 'OPB IN4' },
	{ id: '145', label: 'CBGD 1' },
	{ id: '146', label: 'CBGD 2' },
	{ id: '147', label: 'CBAR' },
	{ id: '148', label: 'BLACK' },
	{ id: '149', label: 'STILL1-V' },
	{ id: '150', label: 'STILL1-K' },
	{ id: '151', label: 'STILL2-V' },
	{ id: '152', label: 'STILL2-K' },
	{ id: '157', label: 'CLIP1-V' },
	{ id: '158', label: 'CLIP1-K' },
	{ id: '159', label: 'CLIP2-V' },
	{ id: '160', label: 'CLIP2-K' },
	{ id: '165', label: 'MV 1' },
	{ id: '166', label: 'MV 2' },
	{ id: '171', label: 'KEY OUT' },
	{ id: '172', label: 'CLN' },
	{ id: '201', label: 'PGM' },
	{ id: '203', label: 'PVW' },
	{ id: '209', label: 'ME PGM' },
	{ id: '227', label: 'AUX 1' },
	{ id: '228', label: 'AUX 2' },
	{ id: '229', label: 'AUX 3' },
	{ id: '230', label: 'AUX 4' },
	{ id: '251', label: 'CLOCK' },
]

var HS410_INPUTS = [
	{ id: '00', label: 'XPT 1' },
	{ id: '01', label: 'XPT 2' },
	{ id: '02', label: 'XPT 3' },
	{ id: '03', label: 'XPT 4' },
	{ id: '04', label: 'XPT 5' },
	{ id: '05', label: 'XPT 6' },
	{ id: '06', label: 'XPT 7' },
	{ id: '07', label: 'XPT 8' },
	{ id: '08', label: 'XPT 9' },
	{ id: '09', label: 'XPT 10' },
	{ id: '10', label: 'XPT 11' },
	{ id: '11', label: 'XPT 12' },
	{ id: '12', label: 'XPT 13' },
	{ id: '13', label: 'XPT 14' },
	{ id: '14', label: 'XPT 15' },
	{ id: '15', label: 'XPT 16' },
	{ id: '16', label: 'XPT 17' },
	{ id: '17', label: 'XPT 18' },
	{ id: '18', label: 'XPT 19' },
	{ id: '19', label: 'XPT 20' },
	{ id: '20', label: 'XPT 21' },
	{ id: '21', label: 'XPT 22' },
	{ id: '22', label: 'XPT 23' },
	{ id: '23', label: 'XPT 24' },
	{ id: '50', label: 'Input 1' },
	{ id: '51', label: 'Input 2' },
	{ id: '52', label: 'Input 3' },
	{ id: '53', label: 'Input 4' },
	{ id: '54', label: 'Input 5' },
	{ id: '55', label: 'Input 6' },
	{ id: '56', label: 'Input 7' },
	{ id: '57', label: 'Input 8' },
	{ id: '58', label: 'Input 9' },
	{ id: '59', label: 'Input 10' },
	{ id: '60', label: 'Input 11' },
	{ id: '61', label: 'Input 12' },
	{ id: '62', label: 'Input 13' },
	{ id: '70', label: 'Color bars' },
	{ id: '71', label: 'Color background 1' },
	{ id: '96', label: 'Color background 2' },
	{ id: '72', label: 'Black' },
	{ id: '73', label: 'Still1V' },
	{ id: '74', label: 'Still2V' },
	{ id: '75', label: 'Clip1V' },
	{ id: '76', label: 'Clip2V' },
	{ id: '77', label: 'PGM' },
	{ id: '78', label: 'PVW' },
	{ id: '79', label: 'KeyOut' },
	{ id: '80', label: 'CLN' },
	{ id: '81', label: 'Multi view' },
	{ id: '91', label: 'M-PVW' },
	{ id: '92', label: 'Still1K' },
	{ id: '93', label: 'Still2K' },
	{ id: '94', label: 'Clip1K' },
	{ id: '95', label: 'Clip2K' },
	{ id: '99', label: 'No selection' },
]

var HS50_INPUTS = [
	{ id: '00', label: 'XPT 1' },
	{ id: '01', label: 'XPT 2' },
	{ id: '02', label: 'XPT 3' },
	{ id: '03', label: 'XPT 4' },
	{ id: '04', label: 'XPT 5' },
	{ id: '05', label: 'XPT 6' },
	{ id: '06', label: 'XPT 7' },
	{ id: '07', label: 'XPT 8' },
	{ id: '08', label: 'XPT 9' },
	{ id: '09', label: 'XPT 10' },
	{ id: '50', label: 'Input 1' },
	{ id: '51', label: 'Input 2' },
	{ id: '52', label: 'Input 3' },
	{ id: '53', label: 'Input 4' },
	{ id: '54', label: 'Input 5' },
	{ id: '70', label: 'Color bars' },
	{ id: '71', label: 'Color background' },
	{ id: '72', label: 'Black' },
	{ id: '73', label: 'Frame memory 1' },
	{ id: '74', label: 'Frame memory 2' },
	{ id: '77', label: 'PGM' },
	{ id: '78', label: 'PVW' },
	{ id: '79', label: 'KeyOut' },
	{ id: '80', label: 'CLN' },
	{ id: '81', label: 'Multi view' },
]

var UHS500_TARGETS = [
	{ id: '00', label: 'BKGD' },
	{ id: '01', label: 'KEY 1' },
	{ id: '04', label: 'KEY 2' },
	{ id: '05', label: 'KEY 3' },
	{ id: '06', label: 'FTB' },
	{ id: '07', label: 'DSK 1' },
	{ id: '08', label: 'DSK 2' },
]

var HS410_TARGETS = [
	{ id: '00', label: 'BKGD' },
	{ id: '01', label: 'KEY' },
	{ id: '04', label: 'PinP 1' },
	{ id: '05', label: 'PinP 2' },
	{ id: '06', label: 'FTB' },
	{ id: '02', label: 'DSK' },
]

var HS50_TARGETS = [
	{ id: '00', label: 'BKGD' },
	{ id: '01', label: 'KEY' },
	{ id: '04', label: 'PinP' },
	{ id: '06', label: 'FTB' },
]

var UHS500_CUTTARGETS = [
	{ id: '00', label: 'BKGD' },
	{ id: '01', label: 'KEY 1' },
	{ id: '04', label: 'KEY 2' },
	{ id: '05', label: 'KEY 3' },
	{ id: '06', label: 'FTB' },
	{ id: '07', label: 'DSK 1' },
	{ id: '08', label: 'DSK 2' },
]

var HS410_CUTTARGETS = [
	{ id: '00', label: 'BKGD' },
	{ id: '01', label: 'KEY' },
	// { id: '04', label: 'PinP 1' },
	// { id: '05', label: 'PinP 2' },
	// { id: '06', label: 'FTB' },
	// { id: '02', label: 'DSK' },
]

var HS50_CUTTARGETS = HS410_CUTTARGETS.slice(0, 2)

// #####################################
// #### Main Instance and Functions ####
// #####################################

class AVHSInstance extends InstanceBase {
	constructor(internal){
		super(internal)
		this.log('debug', 'AVHSInstance startup')
		const self = this
	// Because we use dynamic variables ex: this[model + '_INPUTS']
	this.UHS500_INPUTS = UHS500_INPUTS
	this.UHS500_BUS = UHS500_BUS
	this.UHS500_TARGETS = UHS500_TARGETS
	this.UHS500_CUTTARGETS = UHS500_CUTTARGETS
	this.HS410_INPUTS = HS410_INPUTS
	this.HS410_BUS = HS410_BUS
	this.HS410_TARGETS = HS410_TARGETS
	this.HS410_CUTTARGETS = HS410_CUTTARGETS
	this.HS50_INPUTS = HS50_INPUTS
	this.HS50_BUS = HS50_BUS
	this.HS50_TARGETS = HS50_TARGETS
	this.HS50_CUTTARGETS = HS50_CUTTARGETS

	this.interfaces = [] // Store all network interface ip's
	this.getConfigFields
	this.data = {
		tally: {
			pgm: '',
			pvw: '',
			busA: '',
			busB: '',
			keyF: '',
			keyS: '',
			dskF: '',
			dskS: '',
			pinP1: '',
			pinP2: '',
			aux1: '',
			aux2: '',
			aux3: '',
			aux4: '',
		},
	}
	}

// Init Module
async init(config){
	let self = this
	this.config = config
	this.multicastChoices = []
	this.multicastIfaceDefault = ""
	await this.parseVariablesInString('$(internal:all_ip)').then((IPs) => {
		self.log('debug', `all_ip : ${IPs}`)
		let temp = IPs.split('\\n');
		temp.pop()
		self.log('debug', `array : ${JSON.stringify(temp)}`)
		for (let ip of temp){
			let choice = { id: ip, label: ip}
			self.multicastChoices.push(choice)
		}
		self.log('debug', `multicastchoices : ${JSON.stringify(self.multicastChoices)}`)
	})
	this.init_tcp()
	this.updateActions() // export actions
	this.updateVariableDefinitions() // export variable definitions
	this.updateFeedbacks()
	this.setPresets()
	
	this.log('debug', 'Setting UP')
}

updateActions(){
	UpdateActions(this)
}

updateFeedbacks(){
	UpdateFeedbacks(this)
}

updateVariableDefinitions(){
	UpdateVariableDefinitions(this)
}

setPresets(){
	Presets(this)
}

// When module gets connected
async connect() {
}
	
// When module gets deleted
async destroy() {

	if (this.udptimer) {
		clearInterval(this.udptimer)
		delete this.udptimer
	}

	if (this.socket !== undefined) {
		this.socket.destroy()
	}

	if (this.udp !== undefined) {
		this.udp.destroy()
	}

	if (this.multi !== undefined) {
		// self.multi.disconnect()
	}

	this.log('debug', 'destroy' + this.id)
}

// Update config
async configUpdated(config) {
	this.config = config

	this.init_tcp()
	this.setPresets()
}

// Return config fields for web config
getConfigFields(){
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'To control AV-HS410, you now need to install two plug-ins <b>AUXP_IP and HS410_IF</b>, not just HS410_IF<br/>' +
				'Default ports used in this module are 62000 for AV-UHS500, 60040 (60020 for multicast)  for AV-HS410 and 60040 for AV-HS50.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 6,
			default: '',
			regex: Regex.IP,
		},
		{
			type: 'dropdown',
			id: 'model',
			label: 'Device Model',
			choices: [
				{ id: 'UHS500', label: 'AV-UHS500' },
				{ id: 'HS410', label: 'AV-HS410' },
				{ id: 'HS50', label: 'AW-HS50' },
			],
			default: 'HS410',
			width: 6,
		},
		{
			type: 'static-text',
			id: 'info2',
			width: 12,
			label: 'Variables and AV-HS410 Support',
			value:
				'Make sure you have <b>Multicast enabled</b> on your network. If multicast is disabled, then variables will not work with the <b>AV-HS410</b>.  <br/>' +
				'(variables are only supported on the AV-HS410)',
		},
		{
			type: 'checkbox',
			id: 'multicast',
			width: 1,
			label: 'Enable',
			default: false,
		},
		{
			type: 'static-text',
			id: 'multicastInfo',
			width: 11,
			label: 'Enable Multicast Support (Tally Info)',
			value:
				'IF you are using a AV-HS410, Enable this and set the network interface for multicast tally supoport, giving you variables and feedbacks for tally',
		},
			{
				type: 'dropdown',
				id: 'multicastIface',
				label: 'Multicast Interface',
				choices: this.multicastChoices,
				width: 6,
			},
	]

	
	
}

// Setup TCP and UDP
init_tcp() {
	// this.getNetworkInterfaces()
	var receivebuffer = ''
	const self = this

	if (this.socket !== undefined) {
		this.socket.destroy()
		delete this.socket
	}

	if (this.udp !== undefined) {
		this.udp.destroy()
		delete this.udp
	}

	if (this.udptimer) {
		clearInterval(this.udptimer)
		delete this.udptimer
	}

	if (this.config.host) {
		if (this.config.model == 'HS410') {
			if (this.config.multicast == true) {
				this.log('debug', 'multicast enable')
				this.socket = new TCPHelper(this.config.host, 60020)
				this.udp = new UDPHelper(this.config.host, 60020)
			} else {
				this.log('debug', 'multicast disable')
				this.socket = new TCPHelper(this.config.host, 60040)
				this.udp = new UDPHelper(this.config.host, 60040)
			}
		} else if (this.config.model == 'UHS500') {
			this.socket = new TCPHelper(this.config.host, 62000)
			this.udp = new UDPHelper(this.config.host, 62000)
		} else {
			// if HS50 is selected
			this.socket = new TCPHelper(this.config.host, 60040)
			this.udp = new UDPHelper(this.config.host, 60040)
		}
		this.socket.on('status_change', function (status, message) {
			if(self.config.multicast && self.config.multicastIface === undefined){
				self.log('debug', 'error you must specify an interface' )
				self.updateStatus(InstanceStatus.BadConfig)
			}else{
				self.log('debug', 'Tally OK' )
				self.updateStatus(InstanceStatus.Ok)
			}
			self.log('debug', 'message: ' + JSON.stringify(message) + '\nstatus: ' + JSON.stringify(status))
			
		})

		this.socket.on('error', function (err) {
			self.updateStatus(InstanceStatus.BadConfig, err.message)
			self.log('error', 'Network error: ' + err.message)
		})

		this.udp.on('error', function (err) {
			self.log('debug', 'udp network error' + err)
		})

		// Extract packet from STX/ETX from device
		this.socket.on('data', function (chunk) {
			var i = 0,
				packet = '',
				offset = 0
			receivebuffer += chunk

			while ((i = receivebuffer.indexOf(ETX, offset)) !== -1) {
				packet = receivebuffer.substr(offset, i - offset)
				offset = i + 1

				if (packet.substr(0, 1) == STX) {
					self.socket.emit('receivepacket', packet.substr(1).toString())
					self.log('debug', 'recived: ' + packet.toString())

				}
			}
			receivebuffer = receivebuffer.substr(offset)

		})

		this.socket.on('receivepacket', function (data) {
			// Ready for feedbacks
		})

		if (this.config.model == 'UHS500') {
			this.udptimer = setInterval(function () {
				// self.sendCommand('SPAT:0:00')
			}, 10000) // 10 sec keepalive command
		}

		if (this.config.model == 'HS410') {
			
			this.udptimer = setInterval(function () {
				self.sendCommand('SPAT:0:00')
			}, 500) // 500 ms keepalive command

			if (this.config.multicast == true) { // only when multicast is enabled in the configthis
				try {
					this.listenMulticast()
					this.log('info', 'Multicast Tally is enabled')
				} catch (e) {
					this.log('debug', 'Error listening for Multicast Tally'+ e )
				}
			} else { // If not, delete old multicast sockets
				if (this.multi !== undefined) {
					this.multi.destroy() // Somehow this is needed even though it's not defined, if you remove it, then Companion will crash when updating the instance, but if you leave it it works and you will only get an error thrown, LOL 🤷
					delete this.multi
				}			
			}
		}
	}
}
    // Send a TCP command
sendCommand (command) {

		if(this.socket === undefined){
			this.log('debug', 'socket is not defined')
		}
		else if ( this.socket._socket.readyState !== 1) {
			this.socket.send(STX + command + ETX)
			this.log('debug', `sending command ${STX + command + ETX}`)
		} else {
			this.log('debug', 'Socket not connected :(')
			this.updateStatus(InstanceStatus.UnknownError)
		}
	}
	
	// Send a UDP command
	sendUDPCommand(command) {
	
		if (this.udp !== undefined) {
			try {
				this.udp.send(STX + command + ETX)
			} catch (e) {
				// ignore
			}
		}
	}

// Setup Multicast for Tally
async listenMulticast() {
	var receivebuffer = ''
	let multicastAddress = '224.0.0.200'
	let multicastPort = 60020

	if (this.multi !== undefined) {
		// this.multi.destroy() // Somehow this is needed even though it's not defined, if you remove it, then Companion will crash when updating the instance, but if you leave it it works and you will only get an error thrown, LOL 🤷
		delete this.multi
	}
	const self = this
	return new Promise(function (resolve, reject) {
		self.multi = dgram.createSocket({ type: 'udp4', reuseAddr: true })
		// self.getNetworkInterfaces()
		self.multi.on('listening', () => {
			self.multi.setBroadcast(true)
			self.multi.setMulticastTTL(128)
		})
		
		self.multi.on('message', (message, remote) => {
			var i = 0,
				packet = '',
				offset = 0
			receivebuffer += message
			while ((i = receivebuffer.indexOf(ETX, offset)) !== -1) {
				packet = receivebuffer.substr(offset, i - offset)
				offset = i + 1

				if (packet.substr(0, 1) == STX) {
					self.multi.emit('receivepacket', packet.substr(1).toString())
				}
			}
			receivebuffer = receivebuffer.substr(offset)
		})

		self.multi.on('error', function (err) {
			if (err.code === 'EINVAL') {
				self.log('debug', 'Multicast error: ' + err)
				// self.log('error', "TCP error: " + String(err));
				self.log('error', "Multicast error: Please only use one module for AV-HS410's at a time")
			} else if (err.code === 'EADDRINUSE') {
				self.log('debug', 'Multicast error: ' + err)
				// self.log('error', "TCP error: " + String(err));
				self.log('error', "Multicast error: Please only use one module for AV-HS410's at a time")
			} else if (err.code === ' ECONNREFUSED') {
				self.log('debug', 'Multicast error: ' + err)
				// self.log('error', "TCP error: " + String(err));
				self.log('error', "Multicast error: Please only use one module for AV-HS410's at a time")
			} else {
				self.log('debug', 'multicast: on error: ' + err.stack)
			}
			reject(err)
		})

		self.multi.on('receivepacket', function (str_raw) {
			// Ready for feedbacks on multicast data
			let str = str_raw.trim() // remove new line, carage return and so on.
			str = str.split(':') // Split Commands and data
			// Store Data
			self.storeData(str)
			self.checkVariables()
			self.checkFeedbacks()
		})
		self.multi.bind(multicastPort, () => {
			 	self.multi.addMembership(multicastAddress, self.config.multicastIface)


		})
		resolve()
	})
}

// Store recieved data
storeData(str) {
	var tally = this.data.tally
	// Store Values from Events
	switch (str[0]) {
		case 'ABST':
			switch (str[1]) {
				case '00':
					tally.busA = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // Bus A
				case '01':
					tally.busB = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // Bus B
				case '02':
					tally.pgm = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // PGM
				case '03':
					tally.pvw = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // PVW
				case '04':
					tally.keyF = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // Key Fill
				case '05':
					tally.keyS = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // Key Source
				case '06':
					tally.dskF = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // DSK Fill
				case '07':
					tally.dskS = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // DSK Source
				case '10':
					tally.pinP1 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // PinP 1
				case '11':
					tally.pinP2 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // PinP 2
				case '12':
					tally.aux1 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // AUX 1
				case '13':
					tally.aux2 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // AUX 2
				case '14':
					tally.aux3 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // AUX 3
				case '15':
					tally.aux4 = HS410_INPUTS.find(({ id }) => id === str[2]).label
					break // AUX 4
				default:
					break
			}
			break
		case 'ATST':
			break // Store some data when ATST command is recieved
		case 'SPAT':
			break // Store some data when SPAT command is recieved

		default:
			break
	}
}




// #########################
// #### Check Variables ####
// #########################
checkVariables() {
	// this.log('debug', this.config.model)
	if (this.config.model == 'HS410' && this.config.multicast == true) {
		// Only tested and supported on AV-HS410
		this.setVariableValues({
		'tally_pgm': this.data.tally.pgm,
		'tally_pvw' :  this.data.tally.pvw,
		'bus_a' :  this.data.tally.busA,
		'bus_b' :  this.data.tally.busB,
		'key_fill' :  this.data.tally.keyF,
		'key_source' :  this.data.tally.keyS,
		'dsk_fill' :  this.data.tally.dskF,
		'dsk_source' :  this.data.tally.dskS,
		'pinp_1' :  this.data.tally.pinP1,
		'pinp_2' :  this.data.tally.pinP2,
		'aux_1' :  this.data.tally.aux1,
		'aux_2' :  this.data.tally.aux2,
		'aux_3' :  this.data.tally.aux3,
		'aux_4' :  this.data.tally.aux4
		})
		
	} else if (this.config.model == 'HS410' && this.config.multicast == false) {
		this.setVariableValues({
		'tally_pgm' : 'Not Enabled/Suported',
		'tally_pvw' :  'Not Enabled/Suported',
		'bus_a' :  'Not Enabled/Suported',
		'bus_b' :  'Not Enabled/Suported',
		'key_fill' :  'Not Enabled/Suported',
		'key_source' :  'Not Enabled/Suported',
		'dsk_fill' :  'Not Enabled/Suported',
		'dsk_source' :  'Not Enabled/Suported',
		'pinp_1' :  'Not Enabled/Suported',
		'pinp_2' :  'Not Enabled/Suported',
		'aux_1' :  'Not Enabled/Suported',
		'aux_2' :  'Not Enabled/Suported',
		'aux_3' :  'Not Enabled/Suported',
		'aux_4' :  'Not Enabled/Suported'
		})

		this.data = {
			tally: {
				pgm: '',
				pvw: '',
				busA: '',
				busB: '',
				keyF: '',
				keyS: '',
				dskF: '',
				dskS: '',
				pinP1: '',
				pinP2: '',
				aux1: '',
				aux2: '',
				aux3: '',
				aux4: '',
			},
		}
	}

}

}
runEntrypoint(AVHSInstance, UpgradeScripts)
