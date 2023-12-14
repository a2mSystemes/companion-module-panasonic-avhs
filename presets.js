const { combineRgb } = require('@companion-module/base')

const pgmStyle = {
	text: '',
	size: 'auto',
	color: '0xff0000',
	bgcolor: '0x000000',
}
const pgmStyleFeedback = {
	bgcolor: '0xff0000',
	color: '0xffffff',
}
const pvwStyle = {
	text: '',
	size: 'auto',
	bgcolor: '0x000000',
	color: '0x2CF23C',
}
const pvwStylefeedback = {
	color: '0x000000',
	bgcolor: '0x2cf23c',
}
const delStyle = {
	text: '',
	size: 'auto',
	bgcolor: '0x000000',
	color: '0xFBD207',
}
const delStylefeedback = {
	color: '0x000000',
	bgcolor: '0xFBD207',
}

module.exports = (self) => {
	

	const model = self.config.model
	let inputs = self[model + '_INPUTS']
	let buses = self[model + '_BUS']
	let targets = self[model + '_TARGETS']
	let cutTargets = self[model + '_CUTTARGETS']

	let presets = []
	for (let bus of buses) {
		let category = `${bus.label} bus`
		let style = delStyle
		let styleFeedback = delStylefeedback
		switch (bus.label) {
			case 'PGM':
				style = pgmStyle
				styleFeedback = pgmStyleFeedback
				break
			case 'Bus A':
				style = pgmStyle
				styleFeedback = pgmStyleFeedback
				break
			case 'PVW':
				style = pvwStyle
				styleFeedback = pvwStylefeedback
				break
			case 'Bus B':
				style = pvwStyle
				styleFeedback = pvwStylefeedback
				break
			default:
				break
		}
		for (let input of inputs) {
			if (input.id !== '99') {
				let name = `${bus.label} -> ${input.label}`
				let preset = {
					category: category,
					type: 'button',
					name: name,
					style: {
						text: bus.label + '\n' + input.label,
						bgcolor: style.bgcolor,
						size: style.size,
						color: style.color,
					},
					steps: [
						{
							down: [
								{
									actionId: 'xpt',
									options: {
										bus: `${bus.id}`,
										input: `${input.id}`,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'XptTally',
							style: styleFeedback,
							options: {
								bus: `${bus.id}`,
								input: `${input.id}`,
							},
						},
					],
				}
				presets.push(preset)
			}
		}
}
	for (let target of targets) {
		let name = target.label + '\nAUTO'
		let preset = {
			category: 'AUTO TRANS',
			type: 'button',
			name: name,
			style: {
				text: name,
				bgcolor: 0xff0000,
				size: 'auto',
				color: 0xffffff,
			},
			steps: [
				{
					down: [
						{
							actionId: 'auto',
							options: {
								target: target.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
		self.log('debug', `${JSON.stringify(preset)}`)

		presets.push(preset)
	}
	for (let cutTarget of cutTargets){
		let name = cutTarget.label + '\nCUT'
		let preset = {
			category: 'CUT TRANS',
			type: 'button',
			name: name,
			style: {
				text: name,
				bgcolor: 0xff0000,
				size: 'auto',
				color: 0xffffff,
			},
			steps: [
				{
					down: [
						{
							actionId: 'cut',
							options: {
								target: cutTarget.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets.push(preset)
	}

	self.setPresetDefinitions(presets)
}
