/* utils.js
 ***************************************************
 *
 * This script provides miscellaneous useful functions.
 *
 ***************************************************/

var utils = {

	// Returns a random integer between min and max (inclusive)
	randBetween: function (min, max) {
		return Math.floor (Math.random () * (max - min + 1) + min);
	},

	// Returns a random floating point number between min (inclusive) and max (exclusive)
	randBetweenFloat: function (min, max) {
		return Math.random () * (max - min) + min;
	},

	// Returns the index of the maximum number in the given array
	maxFromArray: function (array) {
		var max = 0;
		var index = 0;
		for (var i = 0; i < array.length; i++) {
			if (array[i] > max) {
				index = i;
				max = array[i];
			}
		}
		return index;
	},

	// Returns a copy of an array
	copyArray: function (array) {
		return array.slice();
	},

	// Clamps a number to within the specified bounds
	clamp: function (num, min, max) {
		return Math.min(Math.max(num, min), max);
	},

	// Converts an angle from radians to degrees
	radiansToDegress: function(rad) {
		return rad * (180 / Math.PI);
	},

	// Converts an angle from degrees to radians
	degreesToRadians: function(deg) {
		return deg * (Math.PI / 180);
	},

	// Returns the distance between two points
	distance: function(x1, y1, x2, y2) {
		var a = x2 - x1;
		var b = y2 - y1;
		return Math.sqrt(a * a + b * b);
	},

	// Converts an RGB component to hex
	rgbComponentToHex: function(comp) {
		var hex = this.clamp(Math.round(comp), 0, 255).toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	},

	// Converts an RGB colour to hex
	rgbToHex: function(r, g, b) {
		return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
	},

	// Returns the given vector with its magnitude normalised to 1
	normaliseVector: function(vector) {
		var magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		return {x: vector.x / magnitude, y: vector.y / magnitude};
	}

}