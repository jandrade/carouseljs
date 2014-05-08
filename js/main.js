/**
 * @fileOverview Demos for Slider
 * @author Juan Andrade <juandavidandrade@gmail.com>
 * @version 1.0
 */

/* global bite */
document.addEventListener('DOMContentLoaded', function() {
    var slider = new bite.Slider('.slider-default', {
        breakpoints: [
            { width: 320, items: 1},
            { width: 480, items: 2},
            { width: 768, items: 3},
            { width: 1024, items: 6}
        ]
    });

    var sliderSingle = new bite.Slider('.slider-single', {
        forceTouch: true,
        single: true
    });

    var sliderAuto = new bite.Slider('.slider-auto', {
        auto: true,
        single: true,
        forceTouch: true,
        duration: 4000
    });

    var sliderNoInf = new bite.Slider('.slider-no-inf', {
        infinite: false
    });

    var sliderVertical = new bite.Slider('.slider-vertical', {
        forceTouch: true,
        infinite: false,
        vertical: true,
        single: true
    });
});