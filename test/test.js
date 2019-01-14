var inspector = require('../lib/field-inspector');

var ti = inspector.newInstance({
    token: {},
    game_id: {
        digit: true
    },
    user_id: {
        dight: true,
        default: 0
    },
    type: {
        values: [1, 2, 3]
    },
    description: {
        trim: true,
        empty: true,
        length_max: 128
    },
    tolower: {
        tolower: true
    },
    toupper: {
        toupper: true
    }
});

var value = {
    token: 'token',
    game_id: 1110,
    type: 1,
    description: ' abc ',
    tolower: 'Is Lower',
    toupper: 'Is Upper'
};

console.log('before', JSON.stringify(value));
ti.perform(value);
console.log('after', JSON.stringify(value));
