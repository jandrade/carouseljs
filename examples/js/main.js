/**
 * @fileOverview Demos for Slider
 * @author Juan Andrade <juandavidandrade@gmail.com>
 * @version 1.0
 */

$('.slider-default').slider();


$('.slider-single').slider({
	//auto: true,
	forceTouch: true,
	duration: 1000,
	//infinite: false,
	single: true
});

$('.slider-auto').slider({
	auto: true,
	forceTouch: true,
	duration: 2000,
	single: true
});


$('.slider-no-inf').slider({
	infinite: false
});

$('.slider-vertical').slider({
	forceTouch: true,
	infinite: false,
	vertical: true
});
