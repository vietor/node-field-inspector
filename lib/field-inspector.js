var _ = require('lodash');

var PARAM_OK = "ok";
var PARAM_EMPTY = "empty";
var PARAM_LENGTH = "length";
var PARAM_TYPE = "type";
var PARAM_VALUE = "value";
var PARAM_MATCH = "match";
var PARAM_REGEXP = "regexp";

function WordTester() {
    var regexp = /\W/;

    this.test = function(value) {
        regexp.lastIndex = 0;
        return !regexp.test(value);
    };
}

function DigitTester() {
    var regexp = /^\-?[\d\.]+$/;

    this.test = function(value) {
        regexp.lastIndex = 0;
        return regexp.test(value) && !isNaN(parseInt(value));
    };
}

function TypeTester(name) {
    this.test = function(value) {
        return (typeof value) == name;
    };
}

function RegExTester(pattern) {
    var regexp = new RegExp(pattern);

    this.test = function(value) {
        regexp.lastIndex = 0;
        return regexp.test(value);
    };
}

function RangeTester(min, max) {
    this.test = function(value) {
        return value >= min && value <= max;
    };
}

function RangeMinTester(min) {
    this.test = function(value) {
        return value >= min;
    };
}

function RangeMaxTester(max) {
    this.test = function(value) {
        return value <= max;
    };
}

function LengthTester(min, max) {
    this.test = function(value) {
        var length = value.length;
        return length >= min && length <= max;
    };
}

function LengthMinTester(min) {
    this.test = function(value) {
        return value.length >= min;
    };
}

function LengthMaxTester(max) {
    this.test = function(value) {
        return value.length <= max;
    };
}

function ValuesTester(values) {
    this.test = function(value) {
        return !_.isNil(_.find(values, function(val) {
            return value == val;
        }));
    };
}

function isEmptyValue(value) {
    return !value && value !== 0;
}

function FieldInspector(restrictions) {
    var compiled_restrictions = [];

    _.each(restrictions, function(origin) {
        var has_min, has_max, restriction = {
            name: origin.name,
            default: origin.default,
            empty: origin.empty || false,
            match: origin.match,
            candidate: origin.candidate,
            trim: origin.trim || false
        };
        if (origin.word)
            restriction.word = new WordTester().test;
        if (origin.digit)
            restriction.digit = new DigitTester().test;
        if (origin.type)
            restriction.type = new TypeTester(origin.type).test;
        if (origin.regexp)
            restriction.regexp = new RegExTester(origin.regexp).test;
        if (origin.range) {
            if (!_.isArray(origin.range) || origin.range.length != 2)
                throw new Error("Wrong restriction: range (" + origin.name + ")");
            restriction.value_range = new RangeTester(origin.range[0], origin.range[1]).test;
        } else {
            has_min = !_.isNil(origin.range_min);
            has_max = !_.isNil(origin.range_max);
            if (has_min && has_max)
                restriction.value_range = new RangeTester(origin.range_min, origin.range_max).test;
            else if (has_min)
                restriction.value_range = new RangeMinTester(origin.range_min).test;
            else if (has_max)
                restriction.value_range = new RangeMaxTester(origin.range_max).test;
        }
        if (origin.length) {
            if (!_.isArray(origin.length) || origin.length.length != 2)
                throw new Error("Wrong restriction: length (" + origin.name + ")");
            restriction.length_range = new LengthTester(origin.length[0], origin.length[1]).test;
        } else {
            has_min = !_.isNil(origin.length_min);
            has_max = !_.isNil(origin.length_max);
            if (has_min && has_max)
                restriction.length_range = new LengthTester(origin.length_min, origin.length_max).test;
            else if (has_min)
                restriction.length_range = new LengthMinTester(origin.length_min).test;
            else if (has_max)
                restriction.length_range = new LengthMaxTester(origin.length_max).test;
        }
        if (origin.values) {
            if (!_.isArray(origin.values) || origin.values.length < 1)
                throw new Error("Wrong restriction: values (" + origin.name + ")");
            restriction.values = new ValuesTester(origin.values).test;
        }

        compiled_restrictions.push(restriction);
    });

    this.restrictions = compiled_restrictions;
    this.restriction_disable = compiled_restrictions.length < 1;
}

FieldInspector.prototype._perform = function(target, restriction) {
    var name = restriction.name,
        value = target[name];
    if (restriction.type && !_.isNil(value) && !restriction.type(value))
        return PARAM_TYPE;
    if (restriction.trim && _.isString(value)) {
        value = value.trim();
        target[name] = value;
    }
    if (isEmptyValue(value)) {
        if (!_.isNil(restriction.default))
            target[name] = restriction.default;
        else if (!(restriction.optional || restriction.empty)) {
            if (!restriction.candidate)
                return PARAM_EMPTY;
            else if (isEmptyValue(target[restriction.candidate]))
                return PARAM_EMPTY;
        }
    } else {
        if (restriction.digit && !restriction.digit(value))
            return PARAM_TYPE;
        if (restriction.word && !restriction.word(value))
            return PARAM_TYPE;
        if (restriction.regexp && !restriction.regexp(value))
            return PARAM_REGEXP;
        if (restriction.values && !restriction.values(value))
            return PARAM_VALUE;
        if (restriction.value_range && !restriction.value_range(value))
            return PARAM_VALUE;
        if (restriction.length_range && !restriction.length_range(value))
            return PARAM_LENGTH;
        if (restriction.match) {
            if (value != target[restriction.match])
                return PARAM_MATCH;
        }
    }
    return PARAM_OK;
};

FieldInspector.prototype.perform = function(target) {
    if (this.restriction_disable)
        return null;
    else {
        var self = this,
            retval = null;
        _.each(self.restrictions, function(restriction) {
            var type = self._perform(target, restriction);
            if (type != PARAM_OK) {
                retval = {
                    name: restriction.name,
                    type: type
                };
            }
            return !!type;
        });
        return retval;
    }
};

exports.newInstance = function(restrictions) {
    var render = !_.isArray(restrictions) ? function(value, key) {
        return _.extend({
            name: key
        }, value);
    } : function(row) {
        return (typeof row) != 'string' ? row : {
            name: row
        };
    };
    return new FieldInspector(_.map(restrictions, render));
};
