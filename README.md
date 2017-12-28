# node-field-inspector

Tiny field inspector for NodeJS

## Install
`npm install field-inspector --save`

## Usage

```javascript
var inspector = require('field-inspector');

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
    }
});

var value = {
    token: 'token',
    game_id: 1110,
    type: 1,
    description: ' abc '
};

console.log('before', JSON.stringify(value));
var rst = ti.perform(value);
console.log('after', rst, JSON.stringify(value));
```

### Output

``` bash
before {"token":"token","game_id":1110,"type":1,"description":" abc "}
after null {"token":"token","game_id":1110,"type":1,"description":"abc","user_id":0}
```

## API

### newInstance(model)

Create a **field-inspector** instance.

> the model has two struction support  
> 1) K/V object, **V** has more rules.  
> 2) Array(object), object require a field 'name' for **K**, other fields was the rules.

|*Key*|*Type*|*Default*|*Description*|
|---|---|---|---|
|empty|boolean|false|accept empty value|,
|default|stringOrNumber|undefined|the default value when empty|
|candidate|string|undefined|accept empty when **has** another prameter|
|match|string|undefined|accept value when **equal** another prameter|
|trim|boolean|false|trim the value string|
|digit|boolean|false|accept digit number value|
|length|Array(number)[min,max]|undefined|accept vlaue **length** **IN** range|
|length_min|number|1|accept value minimal **length**|
|length_max|number|undefined|accept value maximal **length**|
|word|boolean|false|accept value match **Word**|
|regexp|string|false|accept value match **regexp**|
|values|Array(stringOrNumber)|undefined|validate value **IN** Array|
|range|Array(number)[min,max]|undefined|accept vlaue **IN** range|
|range_min|number|undefined|accept minimal value|
|range_max|number|undefined|accept maximal value|

### perform(object)

**field-inspector** proform the rules, it modify the **parameter object**.  
it return a **null** whe no error or a **error object* when detected a error.

#### Error object

|*Key*|*Type*|*Description*|
|---|---|---|
|name|string|field name|
|type|string|the error type|

> values for error type: empty ,length, type, value, match, regexp.

``` javascript
{ name: 'text', type: 'regexp' }
```



