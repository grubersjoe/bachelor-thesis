var cfg = {
	'wireframe': true,
	'animation': true,
	'perspective': true
};

document.addEventListener('DOMContentLoaded', function () {
	'use strict'; // Strict mode

	var box;
	var controls = document.querySelectorAll('input[type=checkbox], select');
	for (var i = 0; i < controls.length; i++) {
		controls[i].addEventListener('change', function () {
			cfg[this.dataset.property] ^= true; // Toggles boolean value (XOR)
			document.dispatchEvent(new CustomEvent('configChanged'));
		});
	}

	var labels = document.querySelectorAll('label');
	for (var i = 0; i < labels.length; i++) {
		labels[i].addEventListener('click', function () {
		   if (this.previousElementSibling.type === 'checkbox') {
				box = this.previousElementSibling;
				box.checked ^= true;
				cfg[box.dataset.property] ^= true;
				document.dispatchEvent(new CustomEvent('configChanged'));
		   }
		});
	}
});