const Regex = require('@companion-module/base')

module.exports = function(self){
const model = self.config.model
// self.log('debug', model + '_BUS')
self.setActionDefinitions({
    xpt: {
        name: 'Bus crosspoint control',
        options: [
            {
                label: 'BUS',
                type: 'dropdown',
                id: 'bus',
                choices: self[model + '_BUS'],
                default: self[model + '_BUS'][0].id,
            },
            {
                label: 'Input',
                type: 'dropdown',
                id: 'input',
                choices: self[model + '_INPUTS'],
                default: self[model + '_INPUTS'][0].id,
            },
        ],
        callback: async(event) => {
            self.sendCommand('SBUS:' + event.options.bus + ':' + event.options.input)
        }
    },
    auto: {
        name: 'Send AUTO transition',
        options: [
            {
                label: 'Target',
                type: 'dropdown',
                id: 'target',
                choices: self[model + '_TARGETS'],
                default: self[model + '_TARGETS'][0].id,
            },
        ],        
        callback: async(event) => {
			self.sendCommand('SAUT:' + event.options.target + ':0')
        }
    },
    cut: {
        name: 'Send CUT transition',
        options: [
            {
                label: 'Target',
                type: 'dropdown',
                id: 'target',
                choices: self[model + '_CUTTARGETS'],
                default: self[model + '_CUTTARGETS'][0].id,
            },
        ],        
        callback: async(event) => {
            self.sendCommand('SCUT:' +  event.options.target)
        }
    },
    
})

}