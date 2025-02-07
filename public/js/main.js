// /js/main.js


$(document).ready(function () {


  var sliders = document.querySelectorAll('.glide');

  for (var i = 0; i < sliders.length; i++) {
    var glide = new Glide(sliders[i], {
      type: 'carousel',
      animationDuration: 2000,
      autoplay: 4500,
      focusAt: '1',
      startAt: 3,
      perView: 1,
    });

    glide.mount()
  }
});