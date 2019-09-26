// [ Hero Slider Controller ]
(function(){
  var desiredSlide;
  var resizeTimer;
  var slides;
  var currentSlide;
  var maxSlides;
  var sliderTimer;

  // Make sure we are live and ready..
  $(document).ready(function() {
    // Normalize Container
    normalizeSlider();
    // Set Vars
    slides = $('[data-slide]');
    maxSlides = slides.length;

    // Find current active slide
    for ( i = 0; i <= maxSlides; i++) {
      // Iterate through array until you find the active one
      if ( $(slides[i]).hasClass('--active-slide') ) {
        currentSlide = $(slides[i]).attr('data-slide');
      }
    }

    // Event listener on bottom dots
    $('[data-move-slide]').click(function(){
      // If user clicks... stop the interval
      clearInterval(sliderTimer);
      // Only trigger if user clicks an inactive icon
      if (!$(this).hasClass('--active')) {
        // Get value of attribute
        desiredSlide =  $(this).attr('data-move-slide');
        // Remove active status from the old mark..
        $('[data-move-slide]').removeClass('--active');
        $('[data-slide]').removeClass('--active-slide');
        // Add active status to current mark
        $(this).addClass('--active');
        $('[data-slide=' + desiredSlide + ']').addClass('--active-slide');
        currentSlide = desiredSlide;
      }
      // Once the funciton is over, start the timer again.
      sliderTimer = setInterval(flipSlider, 5000);
    });

    // Slider is on a 3 second interval
    sliderTimer = setInterval(flipSlider, 5000);

  });
  // Resize Events (debounced)
  // -----------------------------
  $(window).on('resize', function(e) {
    // Clear Timer
    clearTimeout(resizeTimer);
    // Fire function after 250ms
    resizeTimer = setTimeout(function() {
      // Normalize Dropdowns Again...
      normalizeSlider();
    },250);
  });

  // Fix height of container based on contents
  function normalizeSlider() {
    containerHeight = $('[data-slide]')[0].getBoundingClientRect().height;
    $('[data-slide-container]').css({
      'height': containerHeight + 'px'
    });
  };

  function flipSlider () {
    // Slide number that will be set on DOM
    var setSlide;
    if ( (currentSlide + 1) > maxSlides ) {
      setSlide = 1;
    }
    else {
      setSlide = (currentSlide + 1);
    }
    // Remove active status from the old mark..
    $('[data-move-slide]').removeClass('--active');
    $('[data-slide]').removeClass('--active-slide');
    // Add active status to current mark
    $('[data-slide=' + setSlide + ']').addClass('--active-slide');
    $('[data-move-slide=' + setSlide + ']').addClass('--active');

    // Set current Slide to reflect change.
    currentSlide = setSlide;
  }
})();
