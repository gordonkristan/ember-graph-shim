(function() {

/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create({
	/**
	 * @property VERSION
	 * @category top-level
	 * @type String
	 * @static
	 * @final
	 */
	VERSION: ''
});

if (Ember.libraries) {
	Ember.libraries.register('Ember Graph', EG.VERSION);
}


})();

(function() {

if (Em) {
	Em.onLoad('Ember.Application', function(Application) {
		Application.initializer({
			name: 'injectStore',
			before: 'store',

			initialize: function(container, App) {
				App.inject('controller', 'store', 'store:main');
				App.inject('route', 'store', 'store:main');
				App.inject('adapter', 'store', 'store:main');
				App.inject('serializer', 'store', 'store:main');
			}
		});

		Application.initializer({
			name: 'store',

			initialize: function(container, App) {
				App.register('store:main', App.Store || EG.Store, { singleton: true });

				App.register('adapter:rest', EG.RESTAdapter, { singleton: true });

				App.register('serializer:json', EG.JSONSerializer, { singleton: true });

				App.register('type:string', EG.StringType, { singleton: true });
				App.register('type:number', EG.NumberType, { singleton: true });
				App.register('type:boolean', EG.BooleanType, { singleton: true });
				App.register('type:date', EG.DateType, { singleton: true });
				App.register('type:object', EG.ObjectType, { singleton: true });
				App.register('type:array', EG.ArrayType, { singleton: true });

				var store = container.lookup('store:main');
				App.set('store', store);
			}
		});
	});
}

})();

(function() {

// This function taken from Ember
var isNativeFunction = function(fn) {
	return fn && Function.prototype.toString.call(fn).indexOf('[native code]') >= 0;
};

EG.ArrayPolyfills = {
	some: isNativeFunction(Array.prototype.some) ? Array.prototype.some : function(predicate, thisArg) {
		if (this === void 0 || this === null) {
			throw new TypeError('Array.prototype.some called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}

		var list = Object(this);
		var length = list.length >>> 0;

		for (var i = 0; i < length; ++i) {
			if (i in list && predicate.call(thisArg, list[i], i, list)) {
				return true;
			}
		}

		return false;
	},

	reduce: isNativeFunction(Array.prototype.reduce) ? Array.prototype.reduce : function(predicate, initialValue) {
		if (this === void 0 || this === null) {
			throw new TypeError('Array.prototype.reduce called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}

		var list = Object(this);
		var length = list.length >>> 0;
		var value = initialValue;

		if (length <= 0 && arguments.length < 2) {
			throw new TypeError('Reduce of empty array with no initial value');
		}

		for (var i = 0; i < length; ++i) {
			if (i in list) {
				value = callback(value, list[i], i, list);
			}
		}

		return value;
	},

	mapBy: function(property) {
		return Em.ArrayPolyfills.map.call(this, function(item) {
			return Em.get(item, property);
		});
	}
};

if (Em.SHIM_ES5) {
	Array.prototype.some = Array.prototype.some || EG.ArrayPolyfills.some;

	Array.prototype.reduce = Array.prototype.reduce || EG.ArrayPolyfills.reduce;
}

})();

(function() {

var reduce = EG.ArrayPolyfills.reduce;

/**
 * Denotes that method must be implemented in a subclass.
 * If it's not overridden, calling it will throw an error.
 *
 * ```js
 * var Shape = Ember.Object.extend({
 *     getNumberOfSides: EG.abstractMethod('getNumberOfSides')
 * });
 * ```
 *
 * @method abstractMethod
 * @param {String} methodName
 * @return {Function}
 * @category top-level
 * @for EG
 */
EG.abstractMethod = function(methodName) {
	return function() {
		throw new Error('You failed to implement the abstract `' + methodName + '` method.');
	};
};

/**
 * Denotes that a property must be overridden in a subclass.
 * If it's not overridden, using it will throw an error.
 *
 * ```js
 * var Shape = Ember.Object.extend({
 *     name: EG.abstractProperty('name')
 * });
 * ```
 *
 * @method abstractProperty
 * @param {String} propertyName
 * @return {ComputedProperty}
 * @category top-level
 * @for EG
 */
EG.abstractProperty = function(propertyName) {
	return Em.computed(function() {
		throw new Error('You failed to override the abstract `' + propertyName + '` property.');
	}).property();
};

/**
 * Generates a version 4 (random) UUID.
 *
 * @method generateUUID
 * @return {String}
 * @category top-level
 * @for EG
 */
EG.generateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0; // jshint ignore:line
		var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
		return v.toString(16);
	});
};

/**
 * Compares the contents of two arrays for equality. Uses
 * Ember.Set to make the comparison, so the objects must
 * be equal with `===`.
 *
 * @method arrayContentsEqual
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 * @category top-level
 * @for EG
 */
EG.arrayContentsEqual = function(a, b) {
	return (a.length === b.length && (new Em.Set(a)).isEqual(b));
};

/**
 * Takes a list of record objects (with `type` and `id`)
 * and groups them into arrays based on their type.
 *
 * @method groupRecords
 * @param {Object[]} records
 * @return {Array[]}
 * @category top-level
 * @for EG
 */
EG.groupRecords = function(records) {
	var groups = reduce.call(records, function(groups, record) {
		if (groups[record.type]) {
			groups[record.type].push(record);
		} else {
			groups[record.type] = [record];
		}

		return groups;
	}, {});

	return reduce.call(Em.keys(groups), function(array, key) {
		if (groups[key].length > 0) {
			array.push(groups[key]);
		}

		return array;
	}, []);
};

/**
 * Calls `callback` once for each value of the given object.
 * The callback receives `key` and `value` parameters.
 *
 * @param {Object} obj
 * @param {Function} callback
 * @param {Any} [thisArg=undefined]
 */
EG.values = function(obj, callback, thisArg) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			callback.call(thisArg, key, obj[key]);
		}
	}
};

})();

(function() {

Em.Set.reopen({

	/**
	 * Returns a copy of this set without the passed items.
	 *
	 * @param {Array} items
	 * @returns {Set}
	 */
	withoutAll: function(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});

})();

(function() {

EG.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) >= 0;
	},

	capitalize: function(string) {
		return string[0].toLocaleUpperCase() + string.substring(1);
	},

	decapitalize: function(string) {
		return string[0].toLocaleLowerCase() + string.substring(1);
	}
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return EG.String.startsWith(this, prefix);
	};

	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return EG.String.endsWith(this, suffix);
	};

	String.prototype.capitalize = String.prototype.capitalize || function() {
		return EG.String.capitalize(this);
	};

	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return EG.String.decapitalize(this);
	};
}

})();

(function() {

/*
 I took the rules in this code from inflection.js, whose license can be found below.
 */

/*!
 Copyright (c) 2010 Ryan Schuft (ryan.schuft@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

var uncountableWords = [
	'equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'moose', 'deer', 'news'
];

var pluralRules = [
	[/(m)an$/gi,                 '$1en'],
	[/(pe)rson$/gi,              '$1ople'],
	[/(child)$/gi,               '$1ren'],
	[/^(ox)$/gi,                 '$1en'],
	[/(ax|test)is$/gi,           '$1es'],
	[/(octop|vir)us$/gi,         '$1i'],
	[/(alias|status)$/gi,        '$1es'],
	[/(bu)s$/gi,                 '$1ses'],
	[/(buffal|tomat|potat)o$/gi, '$1oes'],
	[/([ti])um$/gi,              '$1a'],
	[/sis$/gi,                   'ses'],
	[/(?:([^f])fe|([lr])f)$/gi,  '$1$2ves'],
	[/(hive)$/gi,                '$1s'],
	[/([^aeiouy]|qu)y$/gi,       '$1ies'],
	[/(x|ch|ss|sh)$/gi,          '$1es'],
	[/(matr|vert|ind)ix|ex$/gi,  '$1ices'],
	[/([m|l])ouse$/gi,           '$1ice'],
	[/(quiz)$/gi,                '$1zes'],
	[/s$/gi,                     's'],
	[/$/gi,                      's']
];

var singularRules = [
	[/(m)en$/gi,                                                        '$1an'],
	[/(pe)ople$/gi,                                                     '$1rson'],
	[/(child)ren$/gi,                                                   '$1'],
	[/([ti])a$/gi,                                                      '$1um'],
	[/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi, '$1$2sis'],
	[/(hive)s$/gi,                                                      '$1'],
	[/(tive)s$/gi,                                                      '$1'],
	[/(curve)s$/gi,                                                     '$1'],
	[/([lr])ves$/gi,                                                    '$1f'],
	[/([^fo])ves$/gi,                                                   '$1fe'],
	[/([^aeiouy]|qu)ies$/gi,                                            '$1y'],
	[/(s)eries$/gi,                                                     '$1eries'],
	[/(m)ovies$/gi,                                                     '$1ovie'],
	[/(x|ch|ss|sh)es$/gi,                                               '$1'],
	[/([m|l])ice$/gi,                                                   '$1ouse'],
	[/(bus)es$/gi,                                                      '$1'],
	[/(o)es$/gi,                                                        '$1'],
	[/(shoe)s$/gi,                                                      '$1'],
	[/(cris|ax|test)es$/gi,                                             '$1is'],
	[/(octop|vir)i$/gi,                                                 '$1us'],
	[/(alias|status)es$/gi,                                             '$1'],
	[/^(ox)en/gi,                                                       '$1'],
	[/(vert|ind)ices$/gi,                                               '$1ex'],
	[/(matr)ices$/gi,                                                   '$1ix'],
	[/(quiz)zes$/gi,                                                    '$1'],
	[/s$/gi,                                                            '']
];

var apply = function(str, rules) {
	if (uncountableWords.indexOf(str) >= 0) {
		return str;
	}

	for (var i = 0; i < rules.length; i = i + 1) {
		if (str.match(rules[i][0])) {
			return str.replace(rules[i][0], rules[i][1]);
		}
	}

	return str;
};

EG.String.pluralize = function(str) {
	return apply(str, pluralRules);
};

EG.String.singularize = function(str) {
	return apply(str, singularRules);
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.pluralize = String.prototype.pluralize || function() {
		return EG.String.pluralize(this);
	};

	String.prototype.singularize = String.prototype.singularize || function() {
		return EG.String.singularize(this);
	};
}

})();

(function() {

var CLIENT_STATE = 'client';
var SERVER_STATE = 'server';
var DELETED_STATE = 'deleted';

EG.Relationship = Em.Object.extend({

	_state: CLIENT_STATE,
	state: Em.computed(function(key, value) {
		if (arguments.length > 1) {
			switch (value) {
				case CLIENT_STATE:
				case SERVER_STATE:
				case DELETED_STATE:
					this.set('_state', value);
					break;
				default:
					Em.assert('Invalid relationship state: ' + value);
					break;
			}
		}

		return this.get('_state');
	}).property('_state'),

	id: null,

	type1: null,

	id1: null,

	relationship1: null,

	type2: null,

	id2: null,

	relationship2: null,

	init: function(type1, id1, name1, type2, id2, name2, state) { // jshint ignore:line
		Em.assert('Invalid type or ID', type1 && id1 && type2 && id2);
		Em.assert('First relationship must have a name', name1);
		Em.assert('Second relationship must have a name or be null', name2 === null || Em.typeOf(name2) === 'string');
		Em.assert('Invalid state', state === CLIENT_STATE || state === SERVER_STATE || state === DELETED_STATE);

		this.setProperties({
			id: EG.generateUUID(),
			type1: type1,
			id1: id1,
			relationship1: name1,
			type2: type2,
			id2: id2,
			relationship2: name2,
			state: state
		});
	},

	isConnectedTo: function(record) {
		if (this.get('type1') === record.typeKey && this.get('id1') === record.get('id')) {
			return true;
		}

		if (this.get('type2') === record.typeKey && this.get('id2') === record.get('id')) {
			return true;
		}

		return false;
	},

	matchesOneSide: function(type, id, name) {
		if (this.get('type1') === type && this.get('id1') === id && this.get('relationship1') === name) {
			return true;
		}

		if (this.get('type2') === type && this.get('id2') === id && this.get('relationship2') === name) {
			return true;
		}

		return false;
	},

	otherType: function(record) {
		// If they have the same type, it won't matter which branch is taken
		if (this.get('type1') === record.typeKey) {
			return this.get('type2');
		} else {
			return this.get('type1');
		}
	},

	otherId: function(record) {
		// If they have the same IDs, it won't matter which branch is taken
		if (this.get('id1') === record.get('id')) {
			return this.get('id2');
		} else {
			return this.get('id1');
		}
	},

	otherName: function(record) {
		if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
			return this.get('relationship2');
		} else {
			return this.get('relationship1');
		}
	},

	thisName: function(record) {
		if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
			return this.get('relationship1');
		} else {
			return this.get('relationship2');
		}
	},

	changeId: function(typeKey, oldId, newId) {
		if (this.get('type1') === typeKey && this.get('id1') === oldId) {
			this.set('id1', newId);
		} else if (this.get('type2') === typeKey && this.get('id2') === oldId) {
			this.set('id2', newId);
		}
	},

	erase: function() {
		this.setProperties({
			id: null,
			type1: null,
			id1: null,
			relationship1: null,
			type2: null,
			id2: null,
			relationship2: null,
			_state: null
		});
	}
});

EG.Relationship.reopenClass({
	// TODO: NEW_STATE, SAVED_STATE, DELETED_STATE
	CLIENT_STATE: CLIENT_STATE,
	SERVER_STATE: SERVER_STATE,
	DELETED_STATE: DELETED_STATE
});

})();

(function() {

var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

var STATE_MAP = {};
STATE_MAP[CLIENT_STATE] = 'client';
STATE_MAP[SERVER_STATE] = 'server';
STATE_MAP[DELETED_STATE] = 'deleted';

var RelationshipMap = Em.Object.extend({

	length: 0,

	addRelationship: function(name, relationship) {
		if (this.hasOwnProperty(name)) {
			this.set(name + '.' + relationship.get('id'), relationship);
			this.notifyPropertyChange(name);
		} else {
			var o = new Em.Object();
			o.set(relationship.get('id'), relationship);
			this.set(name, o);
		}

		this.incrementProperty('length');
	},

	removeRelationship: function(id) {
		forEach.call(Em.keys(this), function(key) {
			if (key === 'length') {
				return;
			}

			var o = this.get(key);
			if (typeof o === 'object' && o.hasOwnProperty(id)) {
				delete o[id];
				this.notifyPropertyChange(key);
				this.decrementProperty('length');
			}
		}, this);
	},

	getRelationships: function(name) {
		var relationships = this.get(name) || {};

		return map.call(Em.keys(relationships), function(key) {
			return relationships[key];
		});
	},

	getAllRelationships: function() {
		var relationships = [];
		var keys = new Em.Set(Em.keys(this)).without('length');

		forEach.call(keys, function(key) {
			relationships = relationships.concat(this.getRelationships(key));
		}, this);

		return relationships;
	},

	clearRelationships: function(name) {
		this.set(name, new Em.Object());
		this.recalculateLength();
	},

	recalculateLength: function() {
		var length = 0;

		forEach.call(Em.keys(this), function(key) {
			if (key !== 'length') {
				length += Em.keys(this[key]).length;
			}
		}, this);

		this.set('length', length);
	}

});

EG.RelationshipStore = Em.Object.extend({

	server: null,

	client: null,

	deleted: null,

	initializeMaps: Em.on('init', function() {
		this.setProperties({
			server: new RelationshipMap(),
			client: new RelationshipMap(),
			deleted: new RelationshipMap()
		});
	}),

	addRelationship: function(name, relationship) {
		if (name === null) {
			return;
		}

		return this.get(STATE_MAP[relationship.get('state')]).addRelationship(name, relationship);
	},

	removeRelationship: function(id) {
		if (Em.typeOf(id) !== 'string') {
			id = Em.get(id, 'id');
		}

		this.get('server').removeRelationship(id);
		this.get('client').removeRelationship(id);
		this.get('deleted').removeRelationship(id);
	},

	clearRelationships: function(name) {
		this.get('server').clearRelationships(name);
		this.get('client').clearRelationships(name);
		this.get('deleted').clearRelationships(name);
	},

	getServerRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('deleted').getRelationships(name));
	},

	getCurrentRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('client').getRelationships(name));
	},

	getRelationshipsByState: function(state) {
		return this.get(STATE_MAP[state]).getAllRelationships();
	},

	getRelationshipsByName: function(name) {
		var server = this.get('server').getRelationships(name);
		var client = this.get('client').getRelationships(name);
		var deleted = this.get('deleted').getRelationships(name);

		return server.concat(client).concat(deleted);
	}
});

})();

(function() {

var methodMissing = function(method) {
	return new Error('Your serializer failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for a serializer. A serializer is used to convert
 * objects back and forth between the JSON that the server uses,
 * and the records that are used on the client side.
 *
 * @class Serializer
 */
EG.Serializer = Em.Object.extend({

	/**
	 * The store that the records will be loaded into. This
	 * property is injected by the container on startup.
	 * This can be used for fetching models and their metadata.
	 *
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * Converts a record to a JSON payload that can be sent to
	 * the server. The options object is a general object where any options
	 * necessary can be passed in from the adapter. The built-in Ember-Graph
	 * adapters pass in just one option: `requestType`. This lets the
	 * serializer know what kind of request will made using the payload
	 * returned from this call. The value of `requestType` will be one of
	 * either `createRecord` or `updateRecord`. If you write a custom
	 * adapter or serializer, you're free to pass in any other options
	 * you may need.
	 *
	 * @method serialize
	 * @param {Model} record The record to serialize
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {JSON} JSON payload to send to server
	 * @abstract
	 */
	serialize: EG.abstractMethod('serialize'),

	/**
	 * Takes a payload from the server and converts it into a normalized
	 * JSON payload that the store can use. Details about the format
	 * can be found in the {{link-to-method 'Store' 'extractPayload'}}
	 * documentation.
	 *
	 * In addition to the format described by the store, the adapter
	 * may require some additional information. This information should
	 * be included in the `meta` object. The attributes required by the
	 * built-in Ember-Graph adapters are:
	 *
	 * - `queryIds`: This is an array of IDs that represents the records
	 *     returned as the result of a query. This helps the adapter in the
	 *     case that addition records of the same type were side-loaded.
	 * - `newId`: This tells the adapter which record was just created. Again,
	 *     this helps the adapter differentiate the newly created record in
	 *     case other records of the same type were side-loaded.
	 *
	 * To determine whether those meta attributes are required or not, the
	 * `requestType` option can be used. The built-in Ember-Graph adapters
	 * will pass one of the following values: `findRecord`, `findMany`,
	 * `findAll`, `findQuery`, `createRecord`, `updateRecord`, `deleteRecord`.
	 * If the value is `findQuery`, then the `queryIds` meta attribute is
	 * required. If the value is `createRecord`, then the `newId` meta
	 * attribute is required.
	 *
	 * TODO: Implement...
	 *
	 * There's also an optional attribute that can be given for any call:
	 *
	 * - `deletedRecords`: This attribute is given to the store to let it
	 *     know that records were deleted from the server and that the store
	 *     should unload them. This allows you to remove records from the
	 *     store as easily as you can add them. The format of this attribute
	 *     can be seen in the example below:
	 *
	 * ```json
	 * {
	 *     "deletedRecords": [
	 *         { typeKey: "user", id: "3" },
	 *         { typeKey: "post", id: "10" },
	 *         { typeKey: "post", id: "11" },
	 *         { typeKey: "tag", id: "674" }
	 *     ]
	 * }
	 * ```
	 *
	 * In addition to `requestType`, the following options are available:
	 *
	 * - `recordType`: The type of record that the request was performed on
	 * - `id`:  The ID of the record referred to by a `findRecord`,
	 *     `updateRecord` or `deleteRecord` request
	 * - `ids`: The IDs of the records requested by a `findMany` request
	 * - `query`: The query submitted to the `findQuery` request
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {Object} Normalized JSON payload
	 * @abstract
	 */
	deserialize: EG.abstractMethod('deserialize')
});


})();

(function() {

var map = Ember.ArrayPolyfills.map;
var mapBy = EG.ArrayPolyfills.mapBy;
var filter = Ember.ArrayPolyfills.filter;
var forEach = Ember.ArrayPolyfills.forEach;

/**
 * This serializer was designed to be compatible with the
 * {{link-to 'JSON API' 'http://jsonapi.org'}}
 * (the ID format, not the URL format).
 *
 * @class JSONSerializer
 * @extends Serializer
 * @constructor
 */
EG.JSONSerializer = EG.Serializer.extend({

	/**
	 * This property can be overridden if you're using polymorphic relationships
	 * in your models. Instead of strings for IDs, the serializer will use objects
	 * for IDs. Each object will contain a `type` and `id` property.
	 *
	 * @property polymorphicRelationships
	 * @type Boolean
	 * @default false
	 * @private
	 */
	polymorphicRelationships: false,

	serialize: function(record, options) {
		switch (options.requestType) {
			case 'updateRecord':
				return this.serializeDelta(record);
			case 'createRecord':
				var json = {};
				json[EG.String.pluralize(record.typeKey)] = [this.serializeRecord(record)];
				return json;
			default:
				throw new Em.Error('Invalid request type for JSON serializer.');
		}
	},

	/**
	 * Converts a single record to its JSON representation.
	 *
	 * @method serializeRecord
	 * @param {Model} record
	 * @return {JSON} The JSON representation of the record
	 */
	serializeRecord: function(record) {
		var json = {
			links: {}
		};

		record.constructor.eachAttribute(function(name, meta) {
			var serialized = this.serializeAttribute(record, name);
			if (serialized) {
				json[serialized.name] = serialized.value;
			}
		}, this);

		record.constructor.eachRelationship(function(name, meta) {
			var serialized = this.serializeRelationship(record, name);
			if (serialized) {
				json.links[serialized.name] = serialized.value;
			}
		}, this);

		return json;
	},

	/**
	 * Serializes a single attribute for a record. This function
	 * determines how the value is serialized and what the
	 * serialized name will be. To remove the attribute
	 * from serialization, return `null` from this function. To
	 * keep the attribute, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "serialized_name",
	 *     value: "serialized_value"
	 * }
	 * ```
	 *
	 * By default, this function will keep the name of the
	 * attribute and serialize the value using the corresponding
	 * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
	 *
	 * @method serializeAttribute
	 * @param {Model} record
	 * @param {String} name The name of the attribute to serialize
	 * @return {Object}
	 * @protected
	 */
	serializeAttribute: function(record, name) {
		var meta = record.constructor.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(meta.type);

		return { name: name, value: type.serialize(record.get(name)) };
	},

	/**
	 * Serializes a single relationship for a record. This function
	 * determines how the value is serialized and what the
	 * serialized name will be. To remove the relationship
	 * from serialization, return `null` from this function. To
	 * keep the relationship, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "serialized_name",
	 *     value: "serialized_value"
	 * }
	 * ```
	 *
	 * By default, this function will keep the name of the
	 * relationship. For hasOne relationships, it will
	 * use either a single string ID or `null`. For hasMany
	 * relationships, it will use an array of string IDs.
	 *
	 * @method serializeRelationship
	 * @param {Model} record
	 * @param {String} name The name of the relationship to serialize
	 * @return {Object}
	 * @protected
	 */
	serializeRelationship: function(record, name) {
		var meta = record.constructor.metaForRelationship(name);
		var value = record.get('_' + name);

		if (meta.kind === EG.Model.HAS_ONE_KEY) {
			if (value === null || EG.Model.isTemporaryId(value.id)) {
				value = null;
			}

			return {
				name: name,
				value: (this.get('polymorphicRelationships') ? value : value.id)
			};
		} else {
			value = filter.call(value, function(v) {
				return !EG.Model.isTemporaryId(v.id);
			});

			return {
				name: name,
				value: (this.get('polymorphicRelationships') ? value : mapBy.call(value, 'id'))
			};
		}
	},

	/**
	 * Serializes a record's changes to a list of change operations
	 * that can be used in a JSON API `PATCH` request. The format
	 * follows the specification except for one minor detail. At the
	 * time of writing this, the `path` in a change operation must
	 * be fully qualified, but there is a change upcoming to fix
	 * that. This uses the soon-to-be format. So instead of this:
	 *
	 * ```json
	 * PATCH /photos/1
	 *
	 * [
	 *     { "op": "remove", "path": "/photos/1/links/comments/5" }
	 * ]
	 * ```
	 *
	 * It uses this:
	 *
	 * ```json
	 * PATCH /photos/1
	 *
	 * [
	 *     { "op": "remove", "path": "/links/comments/5" }
	 * ]
	 * ```
	 *
	 * Everything else remains the same. It will use the `replace`
	 * operation for attributes and hasOne relationships, and the
	 * `add` and `remove` operations for hasMany relationships.
	 *
	 * @method serializeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 */
	serializeDelta: function(record) {
		var operations = this.serializeAttributeDelta(record);
		return operations.concat(this.serializeRelationshipDelta(record));
	},

	/**
	 * Serializes a record's attributes changes to operation objects.
	 *
	 * @method serializeAttributeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 * @protected
	 */
	serializeAttributeDelta: function(record) {
		var changes = record.changedAttributes();
		var store = this.get('store');

		return map.call(Em.keys(changes), function(attributeName) {
			var meta = record.constructor.metaForAttribute(attributeName);
			var type = store.attributeTypeFor(meta.type);
			var value = type.serialize(changes[attributeName][1]);

			return { op: 'replace', path: '/' + attributeName, value: value };
		});
	},

	/**
	 * Serializes a record's relationship changes to operation objects.
	 *
	 * @method serializeAttributeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 * @protected
	 */
	serializeRelationshipDelta: function(record) {
		var operations = [];
		var changes = record.changedRelationships();
		var polymorphicRelationships = this.get('polymorphicRelationships');

		forEach.call(Em.keys(changes), function(relationshipName) {
			var values = changes[relationshipName];
			var meta = record.constructor.metaForRelationship(relationshipName);

			if (meta.kind === EG.Model.HAS_ONE_KEY) {
				operations.push({
					op: 'replace',
					path: '/links/' + relationshipName,
					value: (polymorphicRelationships ? values[1] : (values[1] === null ? null : values[1].id))
				});
			} else if (meta.kind === EG.Model.HAS_MANY_KEY) {
				var originalSet = new Em.Set(map.call(values[0], function(value) {
					return value.type + ':' + value.id;
				}));

				var currentSet = new Em.Set(map.call(values[1], function(value) {
					return value.type + ':' + value.id;
				}));

				forEach.call(values[1], function(value) {
					if (!originalSet.contains(value.type + ':' + value.id) && !EG.Model.isTemporaryId(value.id)) {
						operations.push({
							op: 'add',
							path: '/links/' + relationshipName,
							value: (polymorphicRelationships ? value : value.id)
						});
					}
				});

				forEach.call(values[0], function(value) {
					if (!currentSet.contains(value.type + ':' + value.id)  && !EG.Model.isTemporaryId(value.id)) {
						operations.push({
							op: 'remove',
							path: '/links/' + relationshipName + '/' + value.id,
							value: (polymorphicRelationships ? value : value.id)
						});
					}
				});
			}
		});

		return operations;
	},

	deserialize: function(payload, options) {
		var store = this.get('store');
		var normalized = this.transformPayload(payload || {}, options || {});

		forEach.call(Em.keys(normalized), function(typeKey) {
			if (typeKey === 'meta') {
				return;
			}

			var model = store.modelForType(typeKey);

			normalized[typeKey] = map.call(normalized[typeKey], function(json) {
				return this.deserializeRecord(model, json);
			}, this);
		}, this);

		return normalized;
	},

	/**
	 * Converts a payload partially to normalized JSON.
	 * The layout is the same, but the individual records
	 * themselves have yet to be deserialized.
	 *
	 * @method transformPayload
	 * @param {JSON} payload
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	transformPayload: function(payload, options) {
		if (!payload || Em.keys(payload).length === 0) {
			return {};
		}

		var normalized = {
			meta: {
				serverMeta: payload.meta || {}
			}
		};

		delete payload.meta;

		if (options.requestType === 'findQuery') {
			normalized.meta.queryIds = map.call(payload[EG.String.pluralize(options.recordType)], function(record) {
				return record.id + '';
			});
		} else if (options.requestType === 'createRecord') {
			normalized.meta.newId = payload[EG.String.pluralize(options.recordType)][0].id + '';
		}

		forEach.call(Em.keys(payload), function(key) {
			if (key !== 'linked' && key !== 'meta') {
				normalized[EG.String.singularize(key)] = payload[key];
				delete payload[key];
			}
		});

		forEach.call(Em.keys(payload.linked || {}), function(key) {
			normalized[EG.String.singularize(key)] = payload.linked[key];
		});

		return normalized;
	},

	/**
	 * Converts a single record from its JSON representation
	 * to the Javascript representation that the store expects.
	 *
	 * @method deserializeRecord
	 * @param {Model} model
	 * @param {JSON} json
	 * @return {Object} Deserialized record
	 * @protected
	 */
	deserializeRecord: function(model, json) {
		if (Em.typeOf(json.id) !== 'string' && Em.typeOf(json.id) !== 'number') {
			throw new Em.Error('Your JSON has an invalid ID: ' + JSON.stringify(json));
		}

		var record = {
			id: json.id + ''
		};

		model.eachAttribute(function(name, meta) {
			var deserialized = this.deserializeAttribute(model, json, name);
			if (deserialized) {
				record[deserialized.name] = deserialized.value;
			}
		}, this);

		json.links = json.links || {};

		model.eachRelationship(function(name, meta) {
			var deserialized = this.deserializeRelationship(model, json, name);
			if (deserialized) {
				record[deserialized.name] = deserialized.value;
			}
		}, this);

		return record;
	},

	/**
	 * Deserializes a single attribute for a record. This function
	 * determines how the value is deserialized and what the
	 * deserialized name will be. To remove the attribute
	 * from deserialization, return `null` from this function. To
	 * keep the attribute, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "deserialized_name",
	 *     value: "deserialized_value"
	 * }
	 * ```
	 *
	 * By default, this function keeps the original name and
	 * serializes the value using the corresponding
	 * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
	 * If the value is missing, it attempts to use the default
	 * value. If it's missing and required, it has to throw an
	 * error.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 * @protected
	 */
	deserializeAttribute: function(model, json, name) {
		var meta = model.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(meta.type);
		var value = json[name];

		if (value === undefined) {
			if (meta.isRequired) {
				var error = { id: json.id, typeKey: model.typeKey, name: name };
				throw new Em.Error('Attribute was missing: ' + JSON.stringify(error));
			}

			return {
				name: name,
				value: (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue)
			};
		} else {
			return { name: name, value: type.deserialize(value) };
		}
	},

	/**
	 * Deserializes a single relationship for a record. This function
	 * determines how the value is deserialized and what the
	 * deserialized name will be. To remove the relationship
	 * from deserialization, return `null` from this function. To
	 * keep the relationship, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "deserialized_name",
	 *     value: "deserialized_value"
	 * }
	 * ```
	 *
	 * By default, this function keeps the original name. HasOne
	 * relationships are expected to be either `null`, or a number
	 * or string. Numbers are converted to strings for the store.
	 * HasMany relationships are expected to be an array of
	 * numbers or strings. If any relationship is missing or invalid,
	 * the default value will be used. If it's missing or invalid
	 * and required, an error will be thrown.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 * @protected
	 */
	deserializeRelationship: function(model, json, name) {
		var meta = model.metaForRelationship(name);
		var value = json.links[name];

		if (value === undefined) {
			if (meta.isRequired) {
				throw new Em.Error('Missing `' + name + '` relationship: ' + JSON.stringify(json));
			}

			return { name: name, value: meta.defautlValue };
		} else {
			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				return this.deserializeHasManyRelationship(model, name, value);
			} else {
				return this.deserializeHasOneRelationship(model, name, value);
			}
		}
	},

	/**
	 * After {{link-to-method 'JSONSerializer' 'deserializeRelationship}} has checked
	 * for missing values, it delegates to this function to deserialize a single
	 * hasOne relationship. Their return types are the same.
	 *
	 * @deserializeHasOneRelationship
	 * @param {Class} model
	 * @param {String} name
	 * @param {Object|String|Number} value
	 * @returns {Object}
	 * @protected
	 */
	deserializeHasOneRelationship: function(model, name, value) {
		if (value === null) {
			return { name: name, value: null };
		}

		var polymorphic = this.get('polymorphicRelationships');

		return {
			name: name,
			value: {
				type: (polymorphic ? value.type : model.metaForRelationship(name).relatedType),
				id: (polymorphic ? value.id : value) + ''
			}
		};
	},

	/**
	 * After {{link-to-method 'JSONSerializer' 'deserializeRelationship}} has checked
	 * for missing values, it delegates to this function to deserialize a single
	 * hasMany relationship. Their return types are the same.
	 *
	 * @deserializeHasManyRelationship
	 * @param {Class} model
	 * @param {String} name
	 * @param {Object[]|String[]|Number[]} values
	 * @returns {Object}
	 * @protected
	 */
	deserializeHasManyRelationship: function(model, name, values) {
		var relatedType = model.metaForRelationship(name).relatedType;
		var polymorphic = this.get('polymorphicRelationships');

		var mapped =  map.call(values, function(value) {
			return {
				type: (polymorphic ? value.type : relatedType),
				id: (polymorphic ? value.id : value) + ''
			};
		});

		return { name: name, value: mapped };
	}
});

})();

(function() {

/**
 * An interface for an adapter. And adapter is used to communicate with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * The adapter should return normalized JSON from its operations. Details
 * about normalized JSON can be found in the {{link-to-method 'Store' 'extractPayload'}}
 * documentation.
 *
 * @class Adapter
 * @constructor
 * @category abstract
 */
EG.Adapter = Em.Object.extend({

	/**
	 * The store that this adapter belongs to.
	 * This might be needed to get models and their metadata.
	 *
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * The serializer to use if an application serializer is not found.
	 *
	 * @property defaultSerializer
	 * @type String
	 * @default 'json'
	 */
	defaultSerializer: 'json',

	/**
	 * The serializer used to convert records and payload to the correct formats.
	 * The adapter will attempt to use the application serializer, and if one
	 * isn't found, it will used the serializer specified by
	 * {{link-to-property 'Adapter' 'defaultSerializer'}}.
	 *
	 * @property serializer
	 * @type Serializer
	 */
	serializer: Em.computed(function() {
		var container = this.get('container');
		var serializer = container.lookup('serializer:application') ||
			container.lookup('serializer:' + this.get('defaultSerializer'));

		Em.assert('A valid serializer could not be found.', EG.Serializer.detectInstance(serializer));

		return serializer;
	}).property().readOnly(),

	/**
	 * Persists a record to the server. The returned JSON
	 * must include the `newId` meta attribute as described
	 * {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	createRecord: EG.abstractMethod('createRecord'),

	/**
	 * Fetch a record from the server.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findRecord: EG.abstractMethod('findRecord'),

	/**
	 * The same as find, only it should load several records.
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findMany: EG.abstractMethod('findMany'),

	/**
	 * The same as find, only it should load all records of the given type.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findAll: EG.abstractMethod('findAll'),

	/**
	 * Queries the server for records of the given type. The resolved
	 * JSON should include the `queryIds` meta attribute as
	 * described {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query The query object passed into the store's `find` method
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findQuery: EG.abstractMethod('findQuery'),

	/**
	 * Saves the record's changes to the server.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	updateRecord: EG.abstractMethod('updateRecord'),

	/**
	 * Deletes the record.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	deleteRecord: EG.abstractMethod('deleteRecord'),

	/**
	 * Serializes the given record. By default, it defers to the serializer.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @param {Object} options
	 * @return {Object} Serialized record
	 * @protected
	 */
	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	/**
	 * Deserializes the given payload. By default, it defers to the serializer.
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}
});


})();

(function() {

var Promise = Em.RSVP.Promise;
var forEach = Em.ArrayPolyfills.forEach;

/**
 * An adapter that communicates with REST back-ends. The requests made all follow the
 * {{link-to 'JSON API' 'http://jsonapi.org/format/'}} standard. Because the standard
 * is constantly evolving, you should check the documentation for the individual
 * methods to ensure that they're doing what you expect.
 *
 * @class RESTAdapter
 * @extends Adapter
 * @constructor
 */
EG.RESTAdapter = EG.Adapter.extend({

	/**
	 * Sends a `POST` request to `/{pluralized_type}` with the serialized record as the body.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		var _this = this;
		var url = this.buildUrl(record.typeKey);
		var json = this.serialize(record, { requestType: 'createRecord' });

		return this.ajax(url, 'POST', json).then(function(payload) {
			return _this.deserialize(payload, { requestType: 'createRecord', recordType: record.typeKey });
		});
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id}`.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} A promise that resolves to the requested record
	 */
	findRecord: function(typeKey, id) {
		var _this = this;
		var url = this.buildUrl(typeKey, id);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findRecord', recordType: typeKey, id: id });
		});
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id},{id},{id}`
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findMany: function(typeKey, ids) {
		var _this = this;
		var url = this.buildUrl(typeKey, ids.join(','));

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
		});
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}`.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findAll: function(typeKey) {
		var _this = this;
		var url = this.buildUrl(typeKey);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findAll', recordType: typeKey });
		});
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}?option=value`.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query An object with query parameters to serialize into the URL
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findQuery: function(typeKey, query) {
		var _this = this;
		var options = {};

		forEach.call(Em.keys(query), function(key) {
			options[key] = '' + query[key];
		});

		var url = this.buildUrl(typeKey, null, options);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findQuery', recordType: typeKey, query: query });
		});
	},

	/**
	 * Sends a `PATCH` request to `/{pluralized_type}/{id}` with the record's
	 * changes serialized to JSON change operations. The change operations
	 * use the path format described by the standard. See the example below:
	 *
	 * ```json
	 * [
	 *     { op: "replace", path: "/title", value: "Getting Started With Ember-Graph" },
	 *     { op: "replace", path: "/links/author", value: "24" },
	 *     { op: "add", path: "/links/tags/-", value: "73" },
	 *     { op: "remove", path: "/links/109" }
	 * ]
	 * ```
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		var _this = this;
		var url = this.buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { requestType: 'updateRecord' });

		if (json.length <= 0) {
			return Promise.resolve();
		}

		return this.ajax(url, 'PATCH', json).then(function(payload) {
			return _this.deserialize(payload, { requestType: 'updateRecord', recordType: record.typeKey });
		});
	},

	/**
	 * Sends a `DELETE` request to `/{pluralized_type}/{id}`.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves on success and rejects on failure
	 */
	deleteRecord: function(record) {
		var _this = this;
		var url = this.buildUrl(record.typeKey, record.get('id'));

		return this.ajax(url, 'DELETE').then(function(payload) {
			var options = { requestType: 'deleteRecord', recordType: record.typeKey };
			return _this.deserialize(payload, options);
		});
	},

	/**
	 * This function will build the URL that the request will be posted to.
	 * The options must be strings, but they don't have to be escaped,
	 * this function will do that.
	 *
	 * @method buildUrl
	 * @param {String} typeKey
	 * @param {String} [id]
	 * @param {Object} [options]
	 * @return {String}
	 * @protected
	 */
	buildUrl: function(typeKey, id, options) {
		var url = this.get('prefix') + '/' + EG.String.pluralize(typeKey);

		if (id) {
			url += '/' + id;
		}

		if (options) {
			forEach.call(Em.keys(options), function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	/**
	 * This property is used by the adapter when forming the URL for requests.
	 * The adapter normally makes requests to the current location. So the URL
	 * looks like `/users/6`. If you want to add a different host, or a prefix,
	 * override this property.
	 *
	 * Warning: Do **not** include a trailing slash. The adapter won't check for
	 * mistakes, so just don't do it.
	 *
	 * @property prefix
	 * @type String
	 * @default ''
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @method ajax
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body]
	 * @return {Promise}
	 * @protected
	 */
	ajax: function(url, verb, body) {
		var headers = this.headers(url, verb, body);

		return new Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (Em.typeOf(body) === 'string' ? body : JSON.stringify(body))),
				headers: headers,
				processData: false,
				type: verb,
				url: url,

				error: function(jqXHR, textStatus, error) {
					Em.run(null, reject, error);
				},

				success: function(data, status, jqXHR) {
					Em.run(null, resolve, data);
				}
			});
		});
	},

	/**
	 * This is a small hook to allow including extra headers in the AJAX request.
	 *
	 * @method headers
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body]
	 * @return {Object} Headers to give to jQuery `ajax` function
	 * @protected
	 */
	headers: function(url, verb, body) {
		return {};
	}
});

})();

(function() {

// TODO: Need tests
EG.RecordCache = Em.Object.extend({

	cacheTimeout: Infinity,

	records: {},

	init: function(cacheTimeout) {
		this.setProperties({
			cacheTimeout: cacheTimeout,
			records: {}
		});
	},

	getRecord: function(typeKey, id) {
		var key = typeKey + ':' + id;
		var records = this.get('records');

		if (records[key] && records[key].timestamp >= (new Date()).getTime() - this.get('cacheTimeout')) {
			return records[key].record;
		}

		return null;
	},

	getRecords: function(typeKey) {
		var records = this.get('records');
		var found = [];
		var cutoff = (new Date()).getTime() - this.get('cacheTimeout');

		for (var key in records) {
			if (records.hasOwnProperty(key) && key.indexOf(typeKey) === 0) {
				if (records[key].timestamp >= cutoff) {
					found.push(records[key].record);
				}
			}
		}

		return found;
	},

	storeRecord: function(record) {
		var records = this.get('records');

		records[record.typeKey + ':' + record.get('id')] = {
			record: record,
			timestamp: (new Date()).getTime()
		};
	},

	deleteRecord: function(typeKey, id) {
		var records = this.get('records');
		delete records[typeKey + ':' + id];
	}

});

})();

(function() {

/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @class Store
 * @constructor
 */
EG.Store = Em.Object.extend({

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server. Leave at Infinity for
	 * now, as finite timeouts will likely cause a lot of bugs.
	 *
	 * @property cacheTimeout
	 * @type Number
	 * @default Infinity
	 */
	cacheTimeout: Infinity,

	/**
	 * A boolean for whether or not to reload dirty records. If this is
	 * true, data from the server will be merged with the data on the
	 * client according to the other options defined on this class.
	 * If it's false, calling reload on a dirty record will throw an
	 * error, and any side loaded data from the server will be discarded.
	 *
	 * Note: If this is turned off, no relationship can be reloaded if
	 * either of the records is dirty. So if the server says that
	 * record 1 is connected to record 2, and you reload record 1, which
	 * is clean, Ember-Graph will abort the reload if record 2 is dirty.
	 * This is a particularly annoying corner case that can be mostly
	 * avoided in two ways: either enable reloadDirty, or ensure that
	 * records are changed and then saved or rollback back in the same
	 * 'action'. (Don't let users perform different modifications at
	 * the same time.)
	 *
	 * @property reloadDirty
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	reloadDirty: true,

	/**
	 * If reloadDirty is true, this determines which side the store will
	 * settle conflicts for. If true, new client side relationships always
	 * take precedence over server side relationships loaded when the
	 * record is dirty. If false, server side relationships will overwrite
	 * any temporary client side relationships on reload.
	 *
	 * Note: This only affects relationships. Attributes aren't as tricky,
	 * so the server data can be loaded without affecting the client data.
	 * To have the server overwrite client data, use the option below.
	 *
	 * @property sideWithClientOnConflict
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	sideWithClientOnConflict: true,

	/**
	 * If reloadDirty is true, this will overwrite client attributes on
	 * reload. Because of the more simplistic nature of attributes, it is
	 * recommended to keep this false. The server data will still be loaded
	 * into the record and can be activated at any time by rolling back
	 * attribute changes on the record.
	 *
	 * @property overwriteClientAttributes
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	overwriteClientAttributes: false,

	/**
	 * Stores the models used so far. This not ony caches them so we don't
	 * have to hit the container, but it also let's use know that the
	 * typeKey has been property injected into them.
	 *
	 * @property modelCache
	 * @type {Object}
	 * @final
	 * @private
	 */
	modelCache: {},

	/**
	 * Contains the records cached in the store. The keys are type names,
	 * and the values are nested objects keyed at the ID of the record.
	 *
	 * @property recordCache
	 * @type {RecordCache}
	 * @final
	 * @private
	 */
	recordCache: {},

	/**
	 * Stores adapters as they're looked up in the container.
	 *
	 * @property adapterCache
	 * @type Object
	 * @final
	 * @private
	 */
	adapterCache: {},

	initializeCaches: Em.on('init', function() {
		this.setProperties({
			modelCache: {},
			recordCache: new EG.RecordCache(this.get('cacheTimeout')),
			adapterCache: {}
		});
	}),

	/**
	 * Looks up the model for the specified typeKey. The `typeKey` property
	 * isn't available on the class or its instances until the type is
	 * looked up with this method for the first time.
	 *
	 * @method modelForType
	 * @param {String} typeKey
	 * @return {Class}
	 */
	modelForType: function(typeKey) {
		var modelCache = this.get('modelCache');

		if (!modelCache[typeKey]) {
			var factory = this.get('container').lookupFactory('model:' + typeKey);
			factory.reopen({ typeKey: typeKey });
			factory.reopenClass({ typeKey: typeKey });
			modelCache[typeKey] = factory;
		}

		return modelCache[typeKey];
	},

	/**
	 * Creates a record of the specified type.
	 *
	 * @method createRecord
	 * @param {String} typeKey
	 * @param {Object} json
	 * @return {Model}
	 */
	createRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey).create(this);
		this.get('recordCache').storeRecord(record);
		record.initializeRecord(json || {});
		return record;
	},

	/**
	 * Returns all records of the given type that are in the cache.
	 *
	 * @method cachedRecordsFor
	 * @param {String} typeKey
	 * @return {Model[]}
	 */
	cachedRecordsFor: function(typeKey) {
		return this.get('recordCache').getRecords(typeKey);
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns `null`.
	 *
	 * @method getRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Model}
	 */
	getRecord: function(typeKey, id) {
		return this.get('recordCache').getRecord(typeKey, id);
	},

	/**
	 * Fetches a record (or records), either from the cache or from the server.
	 * The type of `options` determines the behavior of this method:
	 *
	 * - `string` fetches a single record by ID
	 * - `string[]` fetches several records by the IDs
	 * - `object` fetches records according to the given query object
	 * - `undefined` fetches all records of the given type
	 *
	 * Any other value, including `null`, will result in an error being thrown.
     *
	 * @method find
	 * @param {String} typeKey
	 * @param {String|String[]|Object} [options]
	 * @return {PromiseObject|PromiseArray}
	 */
	find: function(typeKey, options) {
		switch (Em.typeOf(options)) {
			case 'string':
				return this._findSingle(typeKey, options);
			case 'array':
				return this._findMany(typeKey, options);
			case 'object':
				return this._findQuery(typeKey, options);
			case 'undefined':
				if (arguments.length === 1) {
					return this._findAll(typeKey);
				}
				/* falls through */
			default:
				throw new Em.Error('A bad `find` call was made to the store.');
		}
	},

	/**
	 * Gets a single record from the adapter as a PromiseObject.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {PromiseObject}
	 * @private
	 */
	_findSingle: function(typeKey, id) {
		var record = this.getRecord(typeKey, id);
		var promise;

		if (record) {
			promise = Em.RSVP.Promise.resolve(record);
		} else {
			promise = this.adapterFor(typeKey).findRecord(typeKey, id).then(function(payload) {
				this.extractPayload(payload);
				return this.getRecord(typeKey, id);
			}.bind(this));
		}

		return EG.ModelPromiseObject.create({
			id: id,
			typeKey: typeKey,
			promise: promise
		});
	},

	/**
	 * Gets many records from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {PromiseArray}
	 * @private
	 */
	_findMany: function(typeKey, ids) {
		ids = ids || [];
		var set = new Em.Set(ids);

		ids.forEach(function(id) {
			if (this.getRecord(typeKey, id) !== null) {
				set.removeObject(id);
			}
		}, this);

		var promise;

		if (set.length === 0) {
			promise = Em.RSVP.Promise.resolve(ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this));
		} else {
			promise = this.adapterFor(typeKey).findMany(typeKey, set.toArray()).then(function(payload) {
				this.extractPayload(payload);

				return ids.map(function(id) {
					return this.getRecord(typeKey, id);
				}, this).toArray();
			}.bind(this));
		}

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @return {PromiseArray}
	 * @private
	 */
	_findAll: function(typeKey) {
		var promise = this.adapterFor(typeKey).findAll(typeKey).then(function(payload) {
			this.extractPayload(payload);
			return this.cachedRecordsFor(typeKey);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets records for a query from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {Object} options
	 * @return {PromiseArray}
	 * @private
	 */
	_findQuery: function(typeKey, options) {
		var promise = this.adapterFor(typeKey).findQuery(typeKey, options).then(function(payload) {
			var ids = payload.meta.ids;
			this.extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Persists a record (new or old) to the server.
	 *
	 * @method saveRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the saved record
	 */
	saveRecord: function(record) {
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		if (isNew) {
			return this.adapterFor(record.typeKey).createRecord(record).then(function(payload) {
				record.set('id', payload.meta.newId);

				var recordCache = this.get('recordCache');
				recordCache.deleteRecord(type, tempId);
				recordCache.storeRecord(record);
				this.updateRelationshipsWithNewId(type, tempId, record.get('id'));

				this.extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.adapterFor(record.typeKey).updateRecord(record).then(function(payload) {
				this.extractPayload(payload);
				return record;
			}.bind(this));
		}
	},

	/**
	 * Deletes a record from the server.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise}
	 */
	deleteRecord: function(record) {
		if (record.get('isCreating')) {
			return Em.RSVP.reject('Can\'t delete a record before it\'s created.');
		}

		var type = record.typeKey;
		var id = record.get('id');

		if (record.get('isNew')) {
			this.deleteRelationshipsForRecord(type, id);
			this.get('recordCache').deleteRecord(type, id);
			record.set('store', null);
			return Em.RSVP.resolve();
		}

		return this.adapterFor(record.typeKey).deleteRecord(record).then(function(payload) {
			this.deleteRelationshipsForRecord(type, id);
			this.extractPayload(payload);
			this.get('recordCache').deleteRecord(type, id);
			record.set('store', null);
		}.bind(this));
	},

	/**
	 * Reloads a record from the server.
	 *
	 * @method reloadRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the reloaded record
	 */
	reloadRecord: function(record) {
		if (record.get('isDirty') && !this.get('reloadDirty')) {
			throw new Em.Error('Can\'t reload a record while it\'s dirty and `reloadDirty` is turned off.');
		}

		return this.adapterFor(record.typeKey).findRecord(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			return record;
		}.bind(this));
	},

	/**
	 * Takes a normalized payload from the server and load the
	 * record into the store. This format is called normalized JSON
	 * and allows you to easily load multiple records in at once.
	 * Normalized JSON is a single object that contains keys that are
	 * model type names, and whose values are arrays of JSON records.
	 * In addition, there is a single `meta` key that contains some
	 * extra information that the store may need. For example, say
	 * that the following models were defined:
	 *
	 * ```js
	 * App.Post = EG.Model.extend({
	 *     title: EG.attr({ type: 'string' }),
	 *     tags: EG.hasMany({ relatedType: 'tag', inverse: null })
	 * });
	 *
	 * App.Tag = EG.Model.extend({
	 *     name: EG.attr({ type: 'string' })
	 * });
	 * ```
	 *
	 * A normalized JSON payload for these models might look like this:
	 *
	 * ```json
	 * {
	 *     "post": [
	 *         { id: "1", title: "Introduction To Ember-Graph", tags: [] },
	 *         { id: "2", title: "Defining Models", tags: ["1", "3"] },
	 *         { id: "3", title: "Connecting to a REST API", tags: ["2"] }
	 *     ],
	 *     "tag": [
	 *         { id: "1", name: "relationship" },
	 *         { id: "2", name: "adapter" },
	 *         { id: "3", name: "store" }
	 *     ],
	 *     "meta": {}
	 * }
	 * ```
	 *
	 * Notice that the names of the types are in singular form. Also, the
	 * records contain all attributes and relationships in the top level.
	 * In addition, all IDs (either of records or in relationships) must
	 * be strings, not numbers.
	 *
	 * This format allows records to be easily loaded into the store even
	 * if they weren't specifically requested (side-loading). The store
	 * doesn't care how or where the records come from, as long as they can
	 * be converted to this form.
	 *
	 * @method extractPayload
	 * @param {Object} payload
	 */
	extractPayload: function(payload) {
		payload = payload || {};
		// We don't do anything with `meta` yet
		delete payload.meta;

		Em.changeProperties(function() {
			var reloadDirty = this.get('reloadDirty');

			Em.keys(payload).forEach(function(typeKey) {
				var model = this.modelForType(typeKey);

				payload[typeKey].forEach(function(json) {
					var record = this.getRecord(typeKey, json.id);

					if (record) {
						if (!record.get('isDirty') || reloadDirty) {
							record.loadDataFromServer(json);
						}
					} else {
						record = model.create(this);
						record.set('id', json.id);

						this.get('recordCache').storeRecord(record);
						this.connectQueuedRelationships(record);
						record.loadDataFromServer(json);
					}
				}, this);
			}, this);
		}, this);
	},

	/**
	 * Returns an `AttributeType` instance for the given named type.
	 *
	 * @method attributeTypeFor
	 * @param {String} typeName
	 * @return {AttributeType}
	 */
	attributeTypeFor: function(typeName) {
		return this.get('container').lookup('type:' + typeName);
	},

	/**
	 * Gets the adapter for the specified type. First, it looks for a type-specific
	 * adapter. If one isn't found, it looks for the application adapter. If that
	 * isn't found, it uses the default {{link-to-class 'RESTAdapter'}}.
	 *
	 * Note that this method will cache the results, so your adapter configuration
	 * must be finalized before the app starts up.
	 *
	 * @method adapterFor
	 * @param {String} typeKey
	 * @return {Adapter}
	 * @protected
	 */
	adapterFor: function(typeKey) {
		var adapterCache = this.get('adapterCache');

		if (!adapterCache[typeKey]) {
			var container = this.get('container');

			adapterCache[typeKey] = container.lookup('adapter:' + typeKey) ||
				container.lookup('adapter:application') ||
				container.lookup('adapter:rest');
		}

		return adapterCache[typeKey];
	}
});


})();

(function() {

var filter = Em.ArrayPolyfills.filter;
var forEach = Em.ArrayPolyfills.forEach;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

EG.Store.reopen({

	allRelationships: new Em.Object(),

	queuedRelationships: new Em.Object(),

	initializeRelationships: Em.on('init', function() {
		this.setProperties({
			allRelationships: new Em.Object(),
			queuedRelationships: new Em.Object()
		});
	}),

	createRelationship: function(type1, id1, name1, type2, id2, name2, state) { // jshint ignore:line
		var relationship = new EG.Relationship(type1, id1, name1, type2, id2, name2, state);

		var queuedRelationships = this.get('queuedRelationships');
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1) {
			this.connectRelationshipTo(record1, relationship);
		}

		if (record2) {
			this.connectRelationshipTo(record2, relationship);
		}

		if (!record1 || !record2) {
			queuedRelationships[relationship.get('id')] = relationship;
			this.notifyPropertyChange('queuedRelationships');
		}

		this.get('allRelationships')[relationship.get('id')] = relationship;
	},

	deleteRelationship: function(relationship) {
		var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		var queuedRelationships = this.get('queuedRelationships');
		delete queuedRelationships[relationship.get('id')];
		this.notifyPropertyChange('queuedRelationships');

		delete this.get('allRelationships')[relationship.get('id')];
		delete this.get('queuedRelationships')[relationship.get('id')];

		relationship.erase();
	},

	changeRelationshipState: function(relationship, newState) {
		if (relationship.get('state') === newState) {
			return;
		}

		var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		relationship.set('state', newState);

		this.connectRelationshipTo(record1, relationship);
		this.connectRelationshipTo(record2, relationship);
	},

	connectQueuedRelationships: function(record) {
		var queuedRelationships = this.get('queuedRelationships');
		var filtered = filter.call(Em.keys(queuedRelationships), function(id) {
			return queuedRelationships[id].isConnectedTo(record);
		});

		if (filtered.length <= 0) {
			return;
		}

		forEach.call(filtered, function(id) {
			var relationship = queuedRelationships[id];
			this.connectRelationshipTo(record, relationship);
			delete queuedRelationships[id];
		}, this);

		this.notifyPropertyChange('queuedRelationships');
	},

	relationshipsForRecord: function(type, id, name) {
		var data, filtered = [];
		var all = this.get('allRelationships');

		for (var i in all) {
			if (all.hasOwnProperty(i)) {
				if (all[i].matchesOneSide(type, id, name)) {
					filtered.push(all[i]);
				}
			}
		}

		return filtered;
	},

	deleteRelationshipsForRecord: function(type, id) {
		Em.changeProperties(function() {
			var all = this.get('allRelationships');
			var keys = Em.keys(all);

			forEach.call(keys, function(key) {
				var relationship = all[key];

				if (relationship.get('type1') === type && relationship.get('id1') === id) {
					this.deleteRelationship(relationship);
				} else if (relationship.get('type2') === type && relationship.get('id2') === id) {
					this.deleteRelationship(relationship);
				}
			}, this);
		}, this);
	},

	/**
	 * @param {Model} record
	 * @param {Relationship} relationship
	 * @private
	 */
	connectRelationshipTo: function(record, relationship) {
		if (!record) {
			return;
		}

		record.get('relationships').addRelationship(relationship.thisName(record), relationship);
	},

	/**
	 * @param {Model} record
	 * @param {Relationship} relationship
	 * @private
	 */
	disconnectRelationshipFrom: function(record, relationship) {
		if (!record) {
			return;
		}

		record.get('relationships').removeRelationship(relationship);
	},

	/**
	 * Takes the relationships for a hasOne relationship, and sorts them in
	 * an object that is easy to manipulate. The object returned contains
	 * the following properties:
	 *
	 * - `[SERVER_STATE]` - A single relationship or `null`
	 * - `[CLIENT_STATE]` - A single relationship or `null`
	 * - `[DELETED_STATE]` - An array of relationships
	 *
	 * There are 5 valid configurations for a hasOne relationship at any
	 * given time:
	 *
	 * 1. No relationships connected
	 * 2. A single server relationship is connected
	 * 3. A single client relationship is connected
	 * 4. One or more delete relationships is connected
	 * 5. A single client relationship, along with one or more deleted relationships
	 *
	 * This function will make assertions to ensure that the relationship
	 * exists in one of these 5 states.
	 *
	 * @param {String} type
	 * @param {String} id
	 * @param {String} name
	 * @returns {Object}
	 */
	sortHasOneRelationships: function(type, id, name) {
		var values = {};
		var relationships = this.relationshipsForRecord(type, id, name);

		values[SERVER_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === SERVER_STATE;
		})[0] || null;

		values[DELETED_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === DELETED_STATE;
		});

		values[CLIENT_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === CLIENT_STATE;
		})[0] || null;

		Em.runInDebug(function() {
			/* jshint ignore:start */
			// No relationships at all
			if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
			// One server relationship, nothing else
			if (values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
			// One client relationship, nothing else
			if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && values[CLIENT_STATE]) return;
			// One client relationship and some deleted relationships
			if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && values[CLIENT_STATE]) return;
			// Some deleted relationships, nothing else
			if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && !values[CLIENT_STATE]) return;
			// Everything else is invalid
			Em.assert('Invalid hasOne relationship values.');
			/* jshint ignore:end */
		});

		return values;
	},

	updateRelationshipsWithNewId: function(typeKey, oldId, newId) {
		var all = this.get('allRelationships');

		for (var id in all) {
			if (all.hasOwnProperty(id)) {
				all[id].changeId(typeKey, oldId, newId);
			}
		}

		this.notifyPropertyChange('allRelationships');
	}

});


})();

(function() {

/**
 * Ember's ObjectProxy combined with the PromiseProxyMixin.
 * Acts as an object and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseObject
 * @extends ObjectProxy
 * @uses PromiseProxyMixin
 * @constructor
 */
EG.PromiseObject = Em.ObjectProxy.extend(Em.PromiseProxyMixin);

/**
 * Ember's ArrayProxy combined with the PromiseProxyMixin.
 * Acts as an array and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseArray
 * @extends ArrayProxy
 * @uses PromiseProxyMixin
 * @constructor
 */
EG.PromiseArray = Em.ArrayProxy.extend(Em.PromiseProxyMixin);

/**
 * Acts just like `PromiseObject` only it's able to hold the
 * ID and typeKey of a model before it's resolved completely.
 *
 * ```js
 * var user = EG.ModelPromiseObject.create({
 *     promise: this.store.find('user', '52'),
 *     id: '52',
 *     typeKey: 'user'
 * });
 *
 * user.get('isPending'); // true
 * user.get('id'); // '52'
 * user.get('typeKey'); // 'user'
 * ```
 *
 * @class ModelPromiseObject
 * @extends PromiseObject
 * @constructor
 */
EG.ModelPromiseObject = EG.PromiseObject.extend({
	__modelId: null,
	__modelTypeKey: null,

	id: function(key, value) {
		var content = this.get('content');

		if (arguments.length > 1) {
			if (content && content.set) {
				content.set('id', value);
			} else {
				this.set('__modelId', value);
			}
		}

		if (content && content.get) {
			return content.get('id');
		} else {
			return this.get('__modelId');
		}
	}.property('__modelId', 'content.id'),

	typeKey: function(key, value) {
		var content = this.get('content');

		if (arguments.length > 1) {
			if (content && content.set) {
				content.set('typeKey', value);
			} else {
				this.set('__modelTypeKey', value);
			}
		}

		if (content && content.get) {
			return content.get('typeKey');
		} else {
			return this.get('__modelTypeKey');
		}
	}.property('__modelTypeKey', 'content.typeKey')
});

})();

(function() {

/**
 * Specifies the details of a custom attribute type.
 * Comes with reasonable defaults that can be used for some extended types.
 *
 * @class AttributeType
 * @constructor
 */
EG.AttributeType = Em.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 * Can be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type Any
	 * @default null
	 * @final
	 */
	defaultValue: null,

	/**
	 * Converts a value of this type to its JSON form.
	 * The default function returns the value given.
	 *
	 * @method serialize
	 * @param {Any} obj Javascript value
	 * @return {JSON} JSON representation
	 */
	serialize: function(obj) {
		return obj;
	},

	/**
	 * Converts a JSON value to its Javascript form.
	 * The default function returns the value given.
	 *
	 * @method deserialize
	 * @param {JSON} json JSON representation of object
	 * @return {Any} Javascript value
	 */
	deserialize: function(json) {
		return json;
	},

	/**
	 * Determines if two values of this type are equal.
	 * Defaults to using `===`.
	 *
	 * @method isEqual
	 * @param {Any} a Javascript object
	 * @param {Any} b Javascript object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		return (a === b);
	}
});

})();

(function() {

/**
 * @class ArrayType
 * @extends AttributeType
 * @constructor
 */
EG.ArrayType = EG.AttributeType.extend({

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method serialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	serialize: function(arr) {
		if (Em.isNone(obj)) {
			return null;
		}

		obj = (obj.toArray ? obj.toArray() : obj);
		return (Em.isArray(obj) ? obj : null);
	},

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method deserialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	deserialize: function(arr) {
		return (Em.isArray(arr) ? arr : null);
	},

	/**
	 * Compares two arrays using `Ember.compare`.
	 *
	 * @method isEqual
	 * @param {Array} a
	 * @param {Array} b
	 * @returns {Boolean}
	 */
	isEqual: function(a, b) {
		if (!Em.isArray(a) || !Em.isArray(b)) {
			return false;
		}

		return Em.compare(a.toArray(), b.toArray()) === 0;
	}
});

})();

(function() {

/**
 * @class BooleanType
 * @extends AttributeType
 * @constructor
 */
EG.BooleanType = EG.AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default false
	 * @final
	 */
	defaultValue: false,

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method serialize
	 * @param {Boolean} bool
	 * @return {Boolean}
	 */
	serialize: function(bool) {
		return this.coerceToBoolean(bool);
	},

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method deserialize
	 * @param {Boolean} json
	 * @return {Boolean}
	 */
	deserialize: function(json) {
		return this.coerceToBoolean(json);
	},

	/**
	 * Coerces a value to a boolean. `true` and `'true'` resolve to
	 * `true`, everything else resolves to `false`.
	 *
	 * @method coerceToBoolean
	 * @param {Any} obj
	 * @return {Boolean}
	 */
	coerceToBoolean: function(obj) {
		if (Em.typeOf(obj) === 'boolean' && obj == true) { // jshint ignore:line
			return true;
		}

		if (Em.typeOf(obj) === 'string' && obj == 'true') {  // jshint ignore:line
			return true;
		}

		return false;
	}
});

})();

(function() {

/**
 * @class DateType
 * @extends AttributeType
 * @constructor
 */
EG.DateType = EG.AttributeType.extend({

	/**
	 * Converts any Date object, number or string to a timestamp.
	 *
	 * @method serialize
	 * @param {Date|Number|String} date
	 * @return {Number}
	 */
	serialize: function(date) {
		switch (Em.typeOf(date)) {
			case 'date':
				return date.getTime();
			case 'number':
				return date;
			case 'string':
				return new Date(date).getTime();
			default:
				return null;
		}
	},

	/**
	 * Converts any numeric or string timestamp to a Date object.
	 * Everything else gets converted to `null`.
	 *
	 * @method deserialize
	 * @param {Number|String} timestamp
	 * @return {Date}
	 */
	deserialize: function(timestamp) {
		switch (Em.typeOf(timestamp)) {
			case 'number':
			case 'string':
				return new Date(timestamp);
			default:
				return null;
		}
	},

	/**
	 * Converts both arguments to a timestamp, then compares.
	 *
	 * @param {Date} a
	 * @param {Date} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		var aNone = (a === null);
		var bNone = (b === null);

		if (aNone && bNone) {
			return true;
		} else if ((aNone && !bNone) || (!aNone && bNone)) {
			return false;
		} else {
			return (new Date(a).getTime() === new Date(b).getTime());
		}
	}
});

})();

(function() {

/**
 * Represents an enumeration or multiple choice type. This class cannot be
 * instantiated directly, you must extend the class, overriding both the
 * `defaultValue` and `values` properties. The `values` property must be
 * an array of unique strings (case insensitive). The `defaultValue` must
 * be a string, and the value must also exist in the `values` array.
 *
 * @class EnumType
 */
EG.EnumType = EG.AttributeType.extend({

	/**
	 * The default enum value. Must be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type String
	 * @final
	 */
	defaultValue: Em.computed(function() {
		throw new Error('You must override the `defaultValue` in an enumeration type.');
	}).property(),

	/**
	 * @property values
	 * @type {Array<String>}
	 * @default []
	 * @final
	 */
	values: [],

	/**
	 * Contains all of the values converted to lower case.
	 *
	 * @property valueSet
	 * @type {Set<String>}
	 * @default []
	 * @final
	 */
	valueSet: Em.computed(function() {
		return new Em.Set(this.get('values').map(function(value) {
			return value.toLocaleLowerCase();
		}));
	}).property('values'),

	/**
	 * Determines if the given option is a valid enum value.
	 *
	 * @property isValidValue
	 * @param {String} option
	 * @return {Boolean}
	 */
	isValidValue: function(option) {
		return this.get('valueSet').contains(option.toLowerCase());
	},

	/**
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method serialize
	 * @param {String} option
	 * @return {String}
	 */
	serialize: function(option) {
		option = option + '';

		if (this.isValidValue(option)) {
			return option;
		} else {
			var defaultValue = this.get('defaultValue');

			if (this.isValidValue(defaultValue)) {
				return defaultValue;
			} else {
				throw new Error('The default value you provided isn\'t a valid value.');
			}
		}
	},

	/**
	 *
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method deserialize
	 * @param {String} option
	 * @return {String}
	 */
	deserialize: Em.aliasMethod('serialize'),

	/**
	 * Compares two enum values, case-insensitive.
	 * @param {String} a
	 * @param {String} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (Em.typeOf(a) !== 'string' || Em.typeOf(b) !== 'string') {
			return false;
		} else {
			return ((a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase());
		}
	}
});

})();

(function() {

/**
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 *
 * @class NumberType
 * @extends AttributeType
 * @constructor
 */
EG.NumberType = EG.AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default 0
	 * @final
	 */
	defaultValue: 0,

	/**
	 * Coerces the given value to a number.
	 *
	 * @method serialize
	 * @param {Number} obj Javascript object
	 * @return {Number} JSON representation
	 */
	serialize: function(obj) {
		return this.coerceToNumber(obj);
	},

	/**
	 * Coerces the given value to a number.
	 *
	 * @method deserialize
	 * @param {Number} json JSON representation of object
	 * @return {Number} Javascript object
	 */
	deserialize: function(json) {
		return this.coerceToNumber(json);
	},

	/**
	 * If the object passed is a number (and not NaN), it returns
	 * the object coerced to a number primitive. If the object is
	 * a string, it attempts to parse it (again, no NaN allowed).
	 * Otherwise, the default value is returned.
	 *
	 * @method coerceToNumber
	 * @param {Any} obj
	 * @return {Number}
	 * @protected
	 */
	coerceToNumber: function(obj) {
		if (this.isValidNumber(obj)) {
			return Number(obj).valueOf();
		}

		if (Em.typeOf(obj) === 'string') {
			var parsed = Number(obj).valueOf();
			if (this.isValidNumber(parsed)) {
				return parsed;
			}
		}

		return 0;
	},

	/**
	 * Determines if the given number is an actual number and finite.
	 *
	 * @method isValidNumber
	 * @param {Number} num
	 * @return {Boolean}
	 * @protected
	 */
	isValidNumber: function(num) {
		return (Em.typeOf(num) === 'number' && !isNaN(num) && isFinite(num));
	}
});

})();

(function() {

/**
 * @class ObjectType
 * @extends AttributeType
 * @constructor
 */
EG.ObjectType = EG.AttributeType.extend({

	/**
	 * If the value is a JSON object, it's returned.
	 * Otherwise, it serializes to `null`.
	 *
	 * @method serialize
	 * @param {Object} obj
	 * @return {Object}
	 */
	serialize: function(obj) {
		if (this.isObject(obj)) {
			try {
				JSON.stringify(obj);
				return obj;
			} catch (e) {
				return null;
			}
		} else {
			return null;
		}
	},

	/**
	 * Returns the value if it's an object, `null` otherwise.
	 *
	 * @method deserialize
	 * @param {Object} json
	 * @return {Object}
	 */
	deserialize: function(json) {
		if (this.isObject(json)) {
			return json;
		} else {
			return null;
		}
	},

	/**
	 * Checks for equality using
	 * {{link-to-method 'ObjectType' 'deepCompare'}}.
	 *
	 * @method isEqual
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (!this.isObject(a) || !this.isObject(b)) {
			return false;
		}

		return this.deepCompare(a, b);
	},

	/**
	 * Determines if the value is a plain Javascript object.
	 *
	 * @method isObject
	 * @param {Object} obj
	 * @return {Boolean}
	 */
	isObject: function(obj) {
		return !Em.isNone(obj) && Em.typeOf(obj) === 'object' && obj.constructor === Object;
	},

	/**
	 * Performs a deep comparison on the objects, iterating
	 * objects and arrays, and using `===` on primitives.
	 *
	 * @method deepCompare
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	deepCompare: function(a, b) {
		if (this.isObject(a) && this.isObject(b)) {
			if (!new Em.Set(Em.keys(a)).isEqual(new Em.Set(Em.keys(b)))) {
				return false;
			}

			var keys = Em.keys(a);

			for (var i = 0; i < keys.length; i = i + 1) {
				if (!this.deepCompare(a[keys[i]], b[keys[i]])) {
					return false;
				}
			}

			return true;
		} else if (Em.isArray(a) && Em.isArray(b)) {
			return Em.compare(a, b) === 0;
		} else {
			return (a === b);
		}
	}
});

})();

(function() {

/**
 * @class StringType
 * @extends AttributeType
 * @constructor
 */
EG.StringType = EG.AttributeType.extend({

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method serialize
	 * @param {String} str
	 * @returns {String}
	 */
	serialize: function(str) {
		return (str === null ? null : '' + str);
	},

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method deserialize
	 * @param {String} json
	 * @returns {String}
	 */
	deserialize: function(json) {
		return (json === null ? null : '' + json);
	}
});

})();

(function() {

/**
 * Models are the classes that represent your domain data.
 * Each type of object in your domain should have its own
 * model, with attributes and relationships declared using the
 * [attr](EG.html#method_attr), [hasOne](EG.html#method_hasOne)
 * and [hasMany](EG.html#method_hasMany) functions.
 *
 * To create a model, subclass this class (or any other Model
 * subclass) and place it your app's namespace. The name
 * that you give it is important, since that's how it will be
 * looked up by the container. The usual convention is to use
 * a camel-cased name like `App.PostComment` or `App.ForumAdmin`.
 * For more information on resolving, read the Ember.js entry
 * on the [DefaultResolver](http://emberjs.com/api/classes/Ember.DefaultResolver.html).
 *
 * @class Model
 * @constructor
 * @uses Ember.Evented
 */
EG.Model = Em.Object.extend(Em.Evented, {

	/**
	 * This property is available on every model instance and every
	 * model subclass (after being looked up at least once by the
	 * container). This is the key that you use to refer to the model
	 * in relationships and store methods. Examples:
	 *
	 * ```
	 * App.User => user
	 * App.PostComment => postComment
	 * ```
	 *
	 * @property typeKey
	 * @type String
	 * @final
	 */
	typeKey: null,

	_id: null,

	/**
	 * The ID of the record. The ID can only be changed once, and only if
	 * it's being changed from a temporary ID to a permanent one. Only the
	 * store should change the ID from a temporary one to a permanent one.
	 *
	 * @property id
	 * @type String
	 * @final
	 */
	id: Em.computed(function(key, value) {
		var id = this.get('_id');

		if (arguments.length > 1) {
			var prefix = this.constructor.temporaryIdPrefix;

			if (id === null) {
				this.set('_id', value);
				return value;
			} else if (EG.String.startsWith(id, prefix) && !EG.String.startsWith(value, prefix)) {
				this.set('_id', value);
				return value;
			} else {
				throw new Error('Cannot change the \'id\' property of a model.');
			}
		}

		return id;
	}).property('_id'),

	/**
	 * @property store
	 * @type EmberGraph.Store
	 * @final
	 */
	store: null,

	/**
	 * Loads JSON data from the server into the record. This may be used when
	 * the record is brand new, or when the record is being reloaded. This
	 * should generally only be used by the store or for testing purposes.
	 * However, this can be useful to override to intercept data before it's
	 * loaded into the record;
	 *
	 * @method loadData
	 * @param {Object} json
	 * @deprecated Use `loadDataFromServer` instead
	 */
	loadData: Em.aliasMethod('loadDataFromServer'),

	/**
	 * Takes a payload from the server and merges the data into the current data.
	 * This is generally only called by the store, but it may be useful to
	 * override it if you're looking to intercept and modify server data before
	 * it's loaded into the record.
	 *
	 * @method loadDataFromServer
	 * @param {Object} json
	 */
	loadDataFromServer: function(json) {
		json = json || {};
		Em.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this.loadAttributesFromServer(json);
		this.loadRelationshipsFromServer(json);
	},

	/**
	 * Takes the data passed to the store's {{link-to-method 'Store' 'createRecord'}}
	 * method and loads it into the newly created record by calling the model's
	 * public API methods for manipulating records. This should really only be
	 * called by the store and when a record is brand new.
	 *
	 * @method initializeRecord
	 * @param {Object} json
	 */
	initializeRecord: function(json) {
		json = json || {};

		this.initializeAttributes(json);
		this.initializeRelationships(json);
		this.set('isInitialized', true);
	},

	/**
	 * Proxies the store's save method for convenience.
	 *
	 * @method save
	 * @return Promise
	 */
	save: function() {
		var _this = this;
		var property = null;

		if (this.get('isNew')) {
			property = 'isCreating';
		} else {
			property = 'isSaving';
		}

		this.set(property, true);
		return this.get('store').saveRecord(this).finally(function() {
			_this.set(property, false);
		});
	},

	/**
	 * Proxies the store's reload method for convenience.
	 *
	 * @method reload
	 * @return Promise
	 */
	reload: function() {
		var _this = this;

		this.set('isReloading', true);
		return this.get('store').reloadRecord(this).finally(function() {
			_this.set('isReloading', false);
		});
	},

	/**
	 * Proxies the store's delete method for convenience.
	 *
	 * @method destroy
	 * @return Promise
	 */
	destroy: function() {
		var _this = this;

		this.set('isDeleting', true);
		return this.get('store').deleteRecord(this).then(function() {
			_this.set('isDeleted', true);
			_this.set('store', null);
		}).finally(function() {
			_this.set('isDeleting', false);
		});
	},

	/**
	 * Determines if the other object is a model that represents the same record.
	 *
	 * @method isEqual
	 * @return Boolean
	 */
	isEqual: function(other) {
		if (!other) {
			return;
		}

		return (this.typeKey === Em.get(other, 'typeKey') && this.get('id') === Em.get(other, 'id'));
	},

	/**
	 * Rolls back changes to both attributes and relationships.
	 *
	 * @method rollback
	 */
	rollback: function() {
		this.rollbackAttributes();
		this.rollbackRelationships();
	}
});

EG.Model.reopenClass({

	/**
	 * The prefix added to generated IDs to show that the prefix wasn't given
	 * by the server and is only temporary until the real one comes in.
	 *
	 * @property temporaryIdPrefix
	 * @type String
	 * @static
	 */
	temporaryIdPrefix: 'EG_TEMP_ID_',

	/**
	 * @method isTemporaryId
	 * @param {String} id
	 * @return Boolean
	 * @static
	 */
	isTemporaryId: function(id) {
		return EG.String.startsWith(id, this.temporaryIdPrefix);
	},

	/**
	 * This method creates a record shell, initializing the `store` and `id` properties.
	 * (The ID is a temporary ID.) **This can only be called by the store.** Calling it
	 * yourself will decouple the record from the store, causing odd behavior.
	 *
	 * @method create
	 * @param {Store} store
	 * @return {Model}
	 */
	create: function(store) {
		var record = this._super();
		record.set('store', store);
		record.set('_id', Em.get(this, 'temporaryIdPrefix') + EG.generateUUID());
		return record;
	},

	/**
	 * @method extend
	 * @static
	 */
	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var attributes = {};
		var relationships = {};

		// Ember.Mixin doesn't have a `detectInstance` method
		if (!(options instanceof Em.Mixin)) {
			Em.keys(options).forEach(function(key) {
				var value = options[key];

				if (options[key]) {
					if (options[key].isRelationship) {
						relationships[key] = value;
						delete options[key];
					} else if (options[key].isAttribute) {
						attributes[key] = value;
						delete options[key];
					}
				}
			});
		}

		args.push(options);

		var subclass = this._super.apply(this, args);
		subclass._declareAttributes(attributes);
		subclass.declareRelationships(relationships);
		return subclass;
	},

	/**
	 * Determines if the two objects passed in are equal models (or model proxies).
	 *
	 * @param {Model} a
	 * @param {Model} b
	 * @return Boolean
	 * @static
	 */
	isEqual: function(a, b) {
		if (Em.isNone(a) || Em.isNone(b)) {
			return false;
		}

		if (this.detectInstance(a)) {
			return a.isEqual(b);
		}

		if (this.detectInstance(b)) {
			return b.isEqual(a);
		}

		if (this.detectInstance(Em.get(a, 'content'))) {
			return Em.get(a, 'content').isEqual(b);
		}

		if (this.detectInstance(Em.get(b, 'content'))) {
			return Em.get(b, 'content').isEqual(a);
		}

		return false;
	}
});



})();

(function() {

EG.Model.reopen({

	/**
	 * Denotes that the record is currently being deleted, but the server hasn't responded yet.
	 *
	 * @property isDeleting
	 * @type Boolean
	 * @final
	 */
	isDeleting: false,

	/**
	 * Denotes that a record has been deleted and the change persisted to the server.
	 *
	 * @property isDeleted
	 * @type Boolean
	 * @final
	 */
	isDeleted: false,

	/**
	 * Denotes that the record is currently saving its changes to the server, but the server hasn't responded yet.
	 * (This doesn't overlap with `isCreating` at all. This is only true on subsequent saves.)
	 *
	 * @property isSaving
	 * @type Boolean
	 * @final
	 */
	isSaving: false,

	/**
	 * Denotes that the record is being reloaded from the server, but the server hasn't responded yet.
	 *
	 * @property isReloading
	 * @type Boolean
	 * @final
	 */
	isReloading: false,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @property isLoaded
	 * @type Boolean
	 * @final
	 */
	isLoaded: Em.computed(function() {
		return this.get('store') !== null;
	}).property('store'),

	/**
	 * Denotes that the record has attribute or relationship changes that have not been saved to the server yet.
	 * Note: A new record is always dirty.
	 *
	 * @property isDirty
	 * @type Boolean
	 * @final
	 */
	isDirty: Em.computed.or('_areAttributesDirty', 'areRelationshipsDirty', 'isNew'),

	/**
	 * Denotes that the record is currently being saved to the server for the first time,
	 * and the server hasn't responded yet.
	 *
	 * @property isCreating
	 * @type Boolean
	 * @final
	 */
	isCreating: false,

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @property isNew
	 * @type Boolean
	 * @final
	 */
	isNew: Em.computed(function() {
		return EG.String.startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
	}).property('_id'),

	/**
	 * Denotes that the record is currently waiting for the server to respond to an operation.
	 *
	 * @property isInTransit
	 * @type Boolean
	 * @final
	 */
	isInTransit: Em.computed.or('isSaving', 'isDeleting', 'isCreating', 'isReloading'),

	/**
	 * Indicates whether the record has been completely initialized by the store yet.
	 * If this is `false`, it's not safe to use the record.
	 *
	 * @property isInitialized
	 * @type Boolean
	 * @final
	 */
	isInitialized: false
});

})();

(function() {

var disallowedAttributeNames = new Em.Set(['id', 'type', 'content', 'length']);

var createAttribute = function(attributeName, options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		readOnly: options.readOnly === true,

		// These should really only be used internally by the model class
		isEqual: options.isEqual
	};

	return Em.computed(function(key, value) {
		var meta = this.constructor.metaForAttribute(key);
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		// If it's currently undefined, we're setting it for the first time, so that's OK.
		if (arguments.length > 1 && meta.readOnly && current !== undefined) {
			throw new Em.Error('Cannot set read-only property "' + key + '" on object: ' + this);
		}

		Em.runInDebug(function() {
			if (arguments.length > 1 && value === undefined) {
				Em.warn('`undefined` is not a valid property value.');
			}
		});

		if (value !== undefined) {
      var scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

			if (scope.isEqual(server, value)) {
				delete this.get('_clientAttributes')[key];
			} else {
				this.set('_clientAttributes.' + key, value);
			}

			// This only notifies observers of the object itself, not the properties.
			// At this point in time, that's only the `_areAttributesDirty` property.
			this.notifyPropertyChange('_clientAttributes');
			return value;
		}

		return current;
	}).property('_clientAttributes.' + attributeName, '_serverAttributes.' + attributeName).meta(meta);
};

EG.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for each attribute.
	 */
	_declareAttributes: function(attributes) {
		var obj = {};

		Em.keys(attributes).forEach(function(attributeName) {
			obj[attributeName] = createAttribute(attributeName, attributes[attributeName].options);
		});

		this.reopen(obj);
	},

	/**
	 * A set of all of the attribute names for this model.
	 *
	 * @property attributes
	 * @for Model
	 * @type Set
	 * @static
	 * @readOnly
	 */
	attributes: Em.computed(function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Em.assert('`' + name + '` cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.addObject(name);
			}
		});

		return attributes;
	}).property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 *
	 * @method metaForAttribute
	 * @for Model
	 * @param {String} attributeName
	 * @return {Object}
	 * @static
	 */
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @method isAttribute
	 * @for Model
	 * @param {String} propertyName
	 * @return {Boolean}
	 * @static
	 */
	isAttribute: function(propertyName) {
		return Em.get(this, 'attributes').contains(propertyName);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @method eachAttribute
	 * @for Model
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param [binding] Object to use as `this`
	 * @static
	 */
	eachAttribute: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				callback.call(binding, name, meta);
			}
		});
	}
});

EG.Model.reopen({

	/**
	 * Represents the latest set of properties from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_clientAttributes`
	 * will be copied into this.
	 */
	_serverAttributes: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 */
	_clientAttributes: null,

	_initializeAttributes: function() {
		this.set('_serverAttributes', Em.Object.create());
		this.set('_clientAttributes', Em.Object.create());
	}.on('init'),

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areAttributesDirty: Em.computed(function() {
		return Em.keys(this.get('_clientAttributes') || {}).length > 0;
	}).property('_clientAttributes'),

	/**
	 * Returns an object that contains every attribute
	 * that has been changed since the last save.
	 *
	 * @method changedAttributes
	 * @for Model
	 * @return {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};
		var store = this.get('store');

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);
			var scope = meta.isEqual ? meta : store.attributeTypeFor(meta.type);
			if (client === undefined || scope.isEqual(server, client)) {
				return;
			}

			diff[name] = [server, client];
		}, this);

		return diff;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 *
	 * @method rollbackAttributes
	 * @for Model
	 */
	rollbackAttributes: function() {
		this.set('_clientAttributes', Em.Object.create());
	},

	/**
	 * Loads attributes from the server.
	 */
	loadAttributesFromServer: function(json) {
		this.constructor.eachAttribute(function(attributeName, meta) {
			Em.assert('Your JSON is missing the \'' + attributeName + '\' property.',
				!meta.isRequired || json.hasOwnProperty(attributeName));

			var value = (json.hasOwnProperty(attributeName) ? json[attributeName] : meta.defaultValue);

			this.set('_serverAttributes.' + attributeName, value);
			this._synchronizeAttribute(attributeName);
		}, this);
	},

	/**
	 * When an attribute's value is set directly (like in `extractPayload`), this
	 * will synchronize the server and client attributes and fix the dirty state.
	 */
	_synchronizeAttribute: function(name) {
		var server = this.get('_serverAttributes.' + name);
		var client = this.get('_clientAttributes.' + name);

		var meta = this.constructor.metaForAttribute(name),
        scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);
		if (scope.isEqual(server, client)) {
			delete this.get('_clientAttributes')[name];
			this.notifyPropertyChange('_clientAttributes');
		}
	},

	/**
	 * Sets up attributes given to the constructor for this record.
	 * Equivalent to setting the attribute values individually.
	 *
	 * @private
	 */
	initializeAttributes: function(json) {
		this.constructor.eachAttribute(function(name, meta) {
			if (meta.isRequired && json[name] === undefined) {
				throw new Em.Error('You tried to create a record without the required `' + name + '` property.');
			}

			this.set(name, json[name] === undefined ? meta.defaultValue : json[name]);
		}, this);
	}
});


})();

(function() {

var map = Em.ArrayPolyfills.map;
var reduce = Em.ArrayPolyfills.reduce;
var filter = Em.ArrayPolyfills.filter;
var forEach = Em.ArrayPolyfills.forEach;

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY = 'hasOne';
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY = 'hasMany';

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

var HAS_ONE_GETTER = function(key) {
	return this.getHasOneValue(key.substring(1), false);
};

var HAS_MANY_GETTER = function(key) {
	return this.getHasManyValue(key.substring(1), false);
};

var createRelationship = function(name, kind, options) {
	Em.assert('Invalid relatedType', Em.typeOf(options.relatedType) === 'string');
	Em.assert('Invalid inverse', options.inverse === null || Em.typeOf(options.inverse) === 'string');

	var meta = {
		isRelationship: false, // the 'real' relationship (without _) is the relationship
		kind: kind,
		isRequired: (options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false),
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		isReadOnly: options.readOnly === true,
		isPolymorphic: options.polymorphic === true
	};

	Em.assert('defaultValue for hasMany must be an array.', meta.kind === HAS_ONE_KEY || Em.isArray(meta.defaultValue));
	Em.assert('defaultValue for hasOne must be null or a string.',
			meta.kind === HAS_MANY_KEY || meta.defaultValue === null || Em.typeOf(meta.defaultValue) === 'string');

	return Em.computed(meta.kind === HAS_MANY_KEY ? HAS_MANY_GETTER : HAS_ONE_GETTER).
		property('relationships.client.' + name, 'relationships.deleted.' + name, 'relationships.server.' + name).
		meta(meta).readOnly();
};

EG.Model.reopenClass({

	/**
	 * Fetch the metadata for a relationship property.
	 *
	 * @method metaForRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @return {Object}
	 * @static
	 */
	metaForRelationship: Em.aliasMethod('metaForProperty'),

	/**
	 * Determines the kind (multiplicity) of the given relationship.
	 *
	 * @method relationshipKind
	 * @for Model
	 * @param {String} name
	 * @returns {String} `hasMany` or `hasOne`
	 * @static
	 */
	relationshipKind: function(name) {
		return this.metaForRelationship(name).kind;
	},

	/**
	 * Calls the callback for each relationship defined on the model.
	 *
	 * @method eachRelationship
	 * @for Model
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param [binding] Object to use as `this`
	 * @static
	 */
	eachRelationship: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				callback.call(binding, name, meta);
			}
		});
	},

	declareRelationships: function(relationships) {
		var obj = {};

		Em.runInDebug(function() {
			var disallowedNames = new Em.Set(['id', 'type', 'content', 'length', 'model']);

			forEach.call(Em.keys(relationships), function(name) {
				Em.assert('`' + name + '` cannot be used as a relationship name.', !disallowedNames.contains(name));
				Em.assert('A relationship name cannot start with an underscore.', name.charAt(0) !== '_');
				Em.assert('Relationship names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
			});
		});

		forEach.call(Em.keys(relationships), function(name) {
			obj['_' + name] = createRelationship(name, relationships[name].kind, relationships[name].options);
			var meta = Em.copy(obj['_' + name].meta(), true);
			var relatedType = meta.relatedType;

			var relationship;

			// We're not going to close over many variables for the sake of speed
			if (meta.kind === HAS_ONE_KEY) {
				relationship = function(key) {
					var value = this.get('_' + key);
					return (value ? this.get('store').find(value.type, value.id) : null);
				};
			} else if (!meta.isPolymorphic) {
				relationship = function(key) {
					var value = this.get('_' + key);
					var ids = Em.ArrayPolyfills.map.call(value, function(item) {
						return item.id;
					});
					return this.get('store').find(relatedType, ids);
				};
			} else {
				relationship = function(key) {
					var store = this.get('store');
					var value = this.get('_' + key);
					var groups = EG.groupRecords(value);
					var promises = Em.ArrayPolyfills.map.call(groups, function(group) {
						var ids = Em.ArrayPolyfills.map.call(group, function(item) {
							return item.id;
						});
						return store.find(group[0].type, ids);
					});
					return Em.RSVP.Promise.all(promises).then(function(groups) {
						return Em.ArrayPolyfills.reduce.call(groups, function(array, group) {
							return array.concat(group);
						}, []);
					});
				};
			}

			meta.isRelationship = true;
			obj[name] = Em.computed(relationship).property('_' + name).readOnly().meta(meta);
		});

		this.reopen(obj);
	}

});

EG.Model.reopen({

	areRelationshipsDirty: Em.computed(function() {
		return this.get('relationships.client.length') > 0 || this.get('relationships.deleted.length') > 0;
	}).property('relationships.client.length', 'relationships.deleted.length'),

	changedRelationships: function() {
		var changes = {};

		this.constructor.eachRelationship(function(name, meta) {
			var oldVal, newVal;

			if (meta.isReadOnly) {
				return;
			}

			if (meta.kind === HAS_MANY_KEY) {
				oldVal = this.getHasManyValue(name, true);
				var oldValSet = map.call(oldVal, function(value) {
					return value.type + ':' + value.id;
				});

				newVal = this.getHasManyValue(name, false);
				var newValSet = map.call(newVal, function(value) {
					return value.type + ':' + value.id;
				});

				if (!EG.arrayContentsEqual(oldVal, newVal)) {
					changes[name] = [oldVal, newVal];
				}
			} else {
				oldVal = this.getHasOneValue(name, true);
				newVal = this.getHasOneValue(name, false);

				if (!oldVal && !newVal) {
					return;
				}

				if ((!oldVal && newVal) || (oldVal && !newVal) ||
					(oldVal.typeKey !== newVal.typeKey || oldVal.id !== newVal.id)) {
					changes[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changes;
	},

	rollbackRelationships: function() {
		Em.changeProperties(function() {
			var store = this.get('store');

			var client = this.get('relationships').getRelationshipsByState(CLIENT_STATE);
			forEach.call(client, function(relationship) {
				store.deleteRelationship(relationship);
			});

			var deleted = this.get('relationships').getRelationshipsByState(DELETED_STATE);
			forEach.call(deleted, function(relationship) {
				store.changeRelationshipState(relationship, SERVER_STATE);
			});
		}, this);
	},

	addToRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			var i, store = this.get('store');

			// Don't modify a read-only relationship (unless we're initializing)
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly && this.get('isInitialized')) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = Em.get(id, 'typeKey');
				id = Em.get(id, 'id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var otherModel = store.modelForType(polymorphicType);
			var otherMeta = (meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse));
			var currentValues = this.getHasManyRelationships(relationshipName, false);
			var serverValues = this.getHasManyRelationships(relationshipName, true);

			// Check to see if the records are already connected
			for (i = 0; i < currentValues.length; ++i) {
				if (currentValues[i].otherType(this) === polymorphicType && currentValues[i].otherId(this) === id) {
					return;
				}
			}

			// If the inverse is null or a hasMany, we can create the relationship without conflict
			if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
				// Check for delete relationships first
				for (i = 0; i < serverValues.length; ++i) {
					if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
						store.changeRelationshipState(serverValues[i], SERVER_STATE);
						return;
					}
				}

				store.createRelationship(this.typeKey, this.get('id'), relationshipName,
					polymorphicType, id, meta.inverse, CLIENT_STATE);

				return;
			}

			// Make sure there are no conflicts on the other side since it's a hasOne
			var otherValues = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
			if (otherValues[SERVER_STATE]) {
				store.changeRelationshipState(otherValues[SERVER_STATE], DELETED_STATE);
			} else if (otherValues[CLIENT_STATE]) {
				store.deleteRelationship(otherValues[CLIENT_STATE]);
			}

			// Check for any deleted relationships that match the one we need
			for (i = 0; i < serverValues.length; ++i) {
				if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
					store.changeRelationshipState(serverValues[i], SERVER_STATE);
					return;
				}
			}

			// If all else fails, create a relationship
			store.createRelationship(this.typeKey, this.get('id'), relationshipName,
				polymorphicType, id, meta.inverse, CLIENT_STATE);
		}, this);
	},

	removeFromRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			// Don't modify a read-only relationship
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = Em.get(id, 'typeKey');
				id = Em.get(id, 'id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var relationships = this.getHasManyRelationships(relationshipName, false);
			for (var i = 0; i < relationships.length; ++i) {
				if (relationships[i].otherType(this) === polymorphicType && relationships[i].otherId(this) === id) {
					if (relationships[i].get('state') === CLIENT_STATE) {
						this.get('store').deleteRelationship(relationships[i]);
					} else {
						this.get('store').changeRelationshipState(relationships[i], DELETED_STATE);
					}

					break;
				}
			}
		}, this);
	},

	setHasOneRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			var store = this.get('store');

			// Don't modify a read-only relationship (unless we're initializing)
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly && this.get('isInitialized')) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = id.typeKey;
				id = id.get('id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var otherModel = store.modelForType(polymorphicType);
			var otherMeta = (meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse));
			var currentRelationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), relationshipName);

			// First make sure they're not already connected
			if (currentRelationships[SERVER_STATE] &&
				currentRelationships[SERVER_STATE].otherType(this) === polymorphicType &&
				currentRelationships[SERVER_STATE].otherId(this) === id) {
				return;
			}

			if (currentRelationships[CLIENT_STATE] &&
				currentRelationships[CLIENT_STATE].otherType(this) === polymorphicType &&
				currentRelationships[CLIENT_STATE].otherId(this) === id) {
				return;
			}

			// They're not connected, so we definitely have to get rid of the current value
			if (currentRelationships[SERVER_STATE]) {
				store.changeRelationshipState(currentRelationships[SERVER_STATE], DELETED_STATE);
			} else if (currentRelationships[CLIENT_STATE]) {
				store.deleteRelationship(currentRelationships[CLIENT_STATE]);
			}

			// If the inverse is null or a hasMany, we can just create the relationship
			if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
				var temp1;
				// Check for a deleted relationship first
				for (var i = 0; i < currentRelationships[DELETED_STATE].length; ++i) {
					temp1 = currentRelationships[DELETED_STATE][i];
					if (temp1.otherType(this) === polymorphicType && temp1.otherId(this) === id) {
						store.changeRelationshipState(temp1, SERVER_STATE);
						return;
					}
				}

				// If we can't find one, just create a new relationship
				store.createRelationship(this.typeKey, this.get('id'), relationshipName,
					polymorphicType, id, meta.inverse, CLIENT_STATE);

				return;
			}

			// We have to make sure there are no conflicts on the other side, since it's also a hasOne
			var otherRelationships = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
			if (otherRelationships[SERVER_STATE]) {
				store.changeRelationshipState(otherRelationships[SERVER_STATE], DELETED_STATE);
			} else if (otherRelationships[CLIENT_STATE]) {
				store.deleteRelationship(otherRelationships[CLIENT_STATE]);
			}

			// Finally, check for a deleted relationship between the two
			var temp2;
			for (var j = 0; j < currentRelationships[DELETED_STATE].length; ++j) {
				temp2 = currentRelationships[DELETED_STATE][j];
				if (temp2.otherType(this) === polymorphicType && temp2.otherId(this) === id) {
					store.changeRelationshipState(temp2, SERVER_STATE);
					return;
				}
			}

			// If all else fails, create a relationship
			store.createRelationship(this.typeKey, this.get('id'), relationshipName,
				polymorphicType, id, meta.inverse, CLIENT_STATE);
		}, this);
	},

	clearHasOneRelationship: function(relationshipName) {
		Em.changeProperties(function() {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			var relationship = this.getHasOneRelationship(relationshipName, false);
			if (relationship) {
				if (relationship.get('state') === CLIENT_STATE) {
					this.get('store').deleteRelationship(relationship);
				} else {
					this.get('store').changeRelationshipState(relationship, DELETED_STATE);
				}
			}
		}, this);
	}

});

EG.Model.reopen({

	/**
	 * Stores all of the relationships currently connected to this record.
	 * The model itself should only read from this object. All additions
	 * and deletions are handled by the store (so they can be reciprocated).
	 *
	 * @type RelationshipMap
	 */
	relationships: null,

	initializeRelationshipStore: Em.on('init', function() {
		this.set('relationships', new EG.RelationshipStore());
	}),

	getHasOneRelationship: function(name, server) {
		var relationships;

		if (server) {
			relationships = this.get('relationships').getServerRelationships(name);
		} else {
			relationships = this.get('relationships').getCurrentRelationships(name);
		}

		if (relationships.length <= 0) {
			return null;
		} else {
			return relationships[0];
		}
	},

	getHasOneValue: function(name, server) {
		var relationship = this.getHasOneRelationship(name, server);

		if (relationship === null) {
			return null;
		} else {
			return {
				type: relationship.otherType(this),
				id: relationship.otherId(this)
			};
		}
	},

	getHasManyRelationships: function(name, server) {
		if (server) {
			return this.get('relationships').getServerRelationships(name);
		} else {
			return this.get('relationships').getCurrentRelationships(name);
		}
	},

	getHasManyValue: function(name, server) {
		return map.call(this.getHasManyRelationships(name, server), function(relationship) {
			return {
				type: relationship.otherType(this),
				id: relationship.otherId(this)
			};
		}, this);
	}

});

})();

(function() {

var map = Em.ArrayPolyfills.map;
var filter = Em.ArrayPolyfills.filter;
var reduce = EG.ArrayPolyfills.reduce;
var forEach = Em.ArrayPolyfills.forEach;

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

// TODO: This can probably be moved into the store to be more model-agnostic
// Idea: load attributes into records directly, but load relationships into store
// Split the data apart in `extractPayload`
EG.Model.reopen({

	/**
	 * Sets up relationships given to the constructor for this record.
	 * Equivalent to calling the relationship functions individually.
	 *
	 * @private
	 */
	initializeRelationships: function(json) {
		this.constructor.eachRelationship(function(name, meta) {
			if (meta.isRequired && json[name] === undefined) {
				throw new Em.Error('You tried to create a record without the required `' + name + '` relationship.');
			}

			var value = (json[name] === undefined ? meta.defaultValue : json[name]);

			if (meta.kind === HAS_MANY_KEY) {
				forEach.call(value, function(v) {
					switch (Em.typeOf(v)) {
						case 'string':
							this.addToRelationship(name, v);
							break;
						case 'instance':
							this.addToRelationship(name, v.get('id'), v.get('typeKey'));
							break;
						default:
							this.addToRelationship(name, v.id, v.type);
							break;
					}
				}, this);
			} else {
				switch (Em.typeOf(value)) {
					case 'string':
						this.setHasOneRelationship(name, value);
						break;
					case 'null':
						// It's already null
						break;
					case 'instance':
						this.setHasOneRelationship(name, value.get('id'), value.get('typeKey'));
						break;
					default:
						this.setHasOneRelationship(name, value.id, value.type);
						break;
				}
			}
		}, this);
	},

	/**
	 * Merges relationship data from the server into the relationships
	 * already connected to this record. Any absolutely correct choices
	 * are made automatically, while choices that come down to preference
	 * are decided based on the configurable store properties.
	 *
	 * @param {Object} json
	 * @private
	 */
	loadRelationshipsFromServer: function(json) {
		this.constructor.eachRelationship(function(name, meta) {
			var otherKind = null;

			if (meta.inverse) {
				otherKind = this.get('store').modelForType(meta.relatedType).metaForRelationship(meta.inverse).kind;
			}

			// TODO: I don't much like this here. Same for the attributes one.
			if (meta.isRequired && json[name] === undefined) {
				throw new Em.Error('Your JSON is missing the required `' + name + '` relationship.');
			}

			if (json[name] === undefined) {
				json[name] = meta.defaultValue;
			}

			if (meta.kind === HAS_MANY_KEY) {
				switch (otherKind) {
					case HAS_ONE_KEY:
						this.connectHasManyToHasOne(name, meta, json[name]);
						break;
					case HAS_MANY_KEY:
						this.connectHasManyToHasMany(name, meta, json[name]);
						break;
					default:
						this.connectHasManyToNull(name, meta, json[name]);
						break;
				}
			} else {
				if (json[name]) {
					switch (otherKind) {
						case HAS_ONE_KEY:
							this.connectHasOneToHasOne(name, meta, json[name]);
							break;
						case HAS_MANY_KEY:
							this.connectHasOneToHasMany(name, meta, json[name]);
							break;
						default:
							this.connectHasOneToNull(name, meta, json[name]);
							break;
					}
				} else {
					switch (otherKind) {
						case HAS_ONE_KEY:
							this.disconnectHasOneFromHasOne(name, meta);
							break;
						case HAS_MANY_KEY:
							this.disconnectHasOneFromHasMany(name, meta);
							break;
						default:
							this.disconnectHasOneFromNull(name, meta);
							break;
					}
				}
			}
		}, this);
	},

	disconnectHasOneFromNull: Em.aliasMethod('disconnectHasOneFromHasMany'),

	disconnectHasOneFromHasOne: Em.aliasMethod('disconnectHasOneFromHasMany'),

	disconnectHasOneFromHasMany: function(name, meta) {
		var store = this.get('store');
		var relationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), name);

		if (relationships[DELETED_STATE].length > 0) {
			forEach.call(relationships[DELETED_STATE], function (relationship) {
				store.deleteRelationship(relationship);
			}, this);
		}

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
			return;
		}

		if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
			store.deleteRelationship(relationships[SERVER_STATE]);
			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE]) {
			if (!store.get('sideWithClientOnConflict')) {
				store.deleteRelationship(relationships[CLIENT_STATE]);
			}
		}
	},

	connectHasOneToNull: Em.aliasMethod('connectHasOneToHasMany'),

	connectHasOneToHasOne: function(name, meta, value) {
		// TODO: This is going to be LONG. But make it right, then make it good
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var theseValues = store.sortHasOneRelationships(thisType, thisId, name);
		var otherValues = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

		var thisCurrent = theseValues[SERVER_STATE] || theseValues[CLIENT_STATE] || null;
		var otherCurrent = otherValues[SERVER_STATE] || otherValues[CLIENT_STATE] || null;
		if (thisCurrent === otherCurrent) {
			store.changeRelationshipState(thisCurrent, SERVER_STATE);
			return;
		}

		// Hehe, I'm going to look back on this one day...

		/* jshint ignore:start */
		var handled;

		if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			store.deleteRelationship(theseValues[SERVER_STATE]);

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = null;

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = relationship;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship !== handled) {
						store.deleteRelationship(relationship);
					}
				});

				if (handled === null) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = null;

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = relationship;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship !== handled) {
						store.deleteRelationship(relationship);
					}
				});

				if (handled === null) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
			forEach.call(theseValues[DELETED_STATE], function(relationship) {
				store.deleteRelationship(relationship);
			});

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}
		/* jshint ignore:end */
	},

	connectHasOneToHasMany: function(name, meta, value) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var relationships = store.sortHasOneRelationships(thisType, thisId, name);
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		// TODO: Make it right, then make it good
		if (relationships[SERVER_STATE] && relationships[SERVER_STATE].otherType(this) === value.type &&
			relationships[SERVER_STATE].otherId(this) === value.id) {
			return;
		}

		if (relationships[CLIENT_STATE] && relationships[CLIENT_STATE].otherType(this) === value.type &&
			relationships[CLIENT_STATE].otherId(this) === value.id) {
			store.changeRelationshipState(relationships[CLIENT_STATE], SERVER_STATE);
			return;
		}

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			return;
		}

		if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			store.deleteRelationship(relationships[SERVER_STATE]);
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			if (sideWithClientOnConflict) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
			} else {
				store.deleteRelationship(relationships[CLIENT_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}

		var handled;

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			handled = false;

			forEach.call(relationships[DELETED_STATE], function(relationship) {
				if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
					if (sideWithClientOnConflict) {
						// NOOP
					} else {
						store.changeRelationshipState(relationship, SERVER_STATE);
					}

					handled = true;
				} else {
					store.deleteRelationship(relationship);
				}
			}, this);

			if (!handled) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			handled = false;

			forEach.call(relationships[DELETED_STATE], function(relationship) {
				if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
					if (sideWithClientOnConflict) {
						// NOOP
					} else {
						store.deleteRelationship(relationships[CLIENT_STATE]);
						store.changeRelationshipState(relationship, SERVER_STATE);
					}

					handled = true;
				} else {
					store.deleteRelationship(relationship);
				}
			}, this);

			if (!handled) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(relationships[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
			}

			return;
		}
	},

	connectHasManyToNull: Em.aliasMethod('connectHasManyToHasMany'),

	connectHasManyToHasOne: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var valueMap = reduce.call(values, function(map, value) {
			map[value.type + ':' + value.id] = value;
			return map;
		}, {});

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

			if (valueMap[valueKey]) {
				switch (relationship.get('state')) {
					case SERVER_STATE:
						// NOOP
						break;
					case DELETED_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}
						break;
					case CLIENT_STATE:
						store.changeRelationshipState(relationship, SERVER_STATE);
						break;
				}
			} else {
				switch (relationship.get('state')) {
					case SERVER_STATE:
					case DELETED_STATE:
						store.deleteRelationship(relationship);
						break;
					case CLIENT_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(relationship);
						}
						break;
				}
			}

			delete valueMap[valueKey];
		}, this);

		// We've narrowed it down to relationships that have to be created from scratch. (Possibly with conflicts.)
		EG.values(valueMap, function(key, value) {
			var conflicts = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

			if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.deleteRelationship(conflicts[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(conflicts[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
				return;
			}

			if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(conflicts[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
				return;
			}
		}, this);
	},

	connectHasManyToHasMany: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var valueMap = reduce.call(values, function(map, value) {
			map[value.type + ':' + value.id] = value;
			return map;
		}, {});

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

			if (valueMap[valueKey]) {
				switch (relationship.get('state')) {
					case SERVER_STATE:
						// NOOP
						break;
					case DELETED_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}
						break;
					case CLIENT_STATE:
						store.changeRelationshipState(relationship, SERVER_STATE);
						break;
				}
			} else {
				switch (relationship.get('state')) {
					case SERVER_STATE:
					case DELETED_STATE:
						store.deleteRelationship(relationship);
						break;
					case CLIENT_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(relationship);
						}
						break;
				}
			}

			delete valueMap[valueKey];
		}, this);

		// We've narrowed it down to relationships that have to be created from scratch.
		EG.values(valueMap, function(key, value) {
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
		});
	}
});

})();

(function() {

/**
 * Declares an attribute on a model. The options determine the type and behavior
 * of the attributes. Bold options are required:
 *
 * - **`type`**: The type of the attribute. `string`, `boolean`, `number`, `date`, `array`
 * and `object` are the built in types. New types can be declared by extending `AttributeType`.
 * - `defaultValue`: The value that gets used if the attribute is missing from the loaded data.
 * If omitted, the attribute is required and will error if missing.
 * - `readOnly`: Set to `true` to make the attribute read-only. Defaults to `false`.
 * - `isEqual`: Function that will compare two different instances of the attribute. Should take
 * two arguments and return `true` if the given attributes are equal. Defaults to the function
 * declared in the `AttributeType` subclass.
 *
 * The option values are all available as property metadata, as well the `isAttribute` property
 * which is always `true`, and the `isRequired` property.
 *
 * Like other Ember properties, `undefined` is _not_ a valid attribute value.
 *
 * @method attr
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 */
EG.attr = function(options) {
	return {
		isAttribute: true,
		options: options
	};
};

/**
 * Declares a *-to-many relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related models that reciprocates this relationship.
 * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is an empty array.
 * - `readOnly`: Set to `true` to make the relationship read-only. Defaults to `false`.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasMany`.
 *
 * @method hasMany
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 */
EG.hasMany = function(options) {
	return {
		isRelationship: true,
		kind: EG.Model.HAS_MANY_KEY,
		options: options
	};
};

/**
 * Declares a *-to-one relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related model that reciprocates this relationship.
 * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is `null`.
 * - `readOnly`: Set to `true` to make the relationship read-only. Defaults to `false`.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasOne`.
 *
 * @method hasOne
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 */
EG.hasOne = function(options) {
	return {
		isRelationship: true,
		kind: EG.Model.HAS_ONE_KEY,
		options: options
	};
};


})();