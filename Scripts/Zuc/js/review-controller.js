// [ Hero Slider Controller ]
// Reserve global variables
var _ZucReviewLimit = null;
var _zucReviewIndex = null;
var _zucDesiredIndex = null;
var _zucReviewResizeTimer = null;

(function(){

  // Make sure we are live and ready..
  $(document).ready(function() {
    // Check to make sure the review module is alive
    if ( $('#zuc-review-module') ) {
      // Initialize review module
      initializeReviews();
    }

    window.setInterval(function(){
      traverseReview(1);
    },3500);
  });

  // Resize Events (debounced)
  // -----------------------------
  $(window).on('resize', function(e) {
    // Clear Timer
    clearTimeout(_zucReviewResizeTimer);
    // Fire function after 250ms
    _zucReviewResizeTimer = setTimeout(function() {
      // Reinitialize reviews
      initializeReviews();
    },250);
  });


  function initializeReviews() {
    $('.--active-review').removeClass('--active-review');
    // Reserve Variable
    var reviewHeight = null;
    // Select the first of the vunch
    firstTarget = $('[data-review]')[0];
    // Make it Active
    $(firstTarget).addClass('--active-review');
    // Get height of first review..
    reviewHeight = $(firstTarget).height();
    // Set container to that height for absolute elements
    // $('[data-review-container]').css({
    //   "height" : reviewHeight + 'px'
    // });
    // Set review limit
    _ZucReviewLimit = $('[data-review]');
    _ZucReviewLimit = _ZucReviewLimit.length - 1;
    // Set Current active review
    _zucReviewIndex = 0;
    _zucDesiredIndex = 0;
  }
})();


function traverseReview(direction) {
  // Container for height
  var newHeight = null;
  // Figure out which review to show..
  // Are we going passed the end of the array?
  if (direction + _zucDesiredIndex > _ZucReviewLimit) {
    // Reset to start
    _zucDesiredIndex = 0;
  }
  // Are we going passed the start of the array?
  else if (direction + _zucDesiredIndex < 0) {
    // Reset to the end
    _zucDesiredIndex = _ZucReviewLimit;
  }
  else {
    // Move as desired
    _zucDesiredIndex += direction;
  }

  // Remove any active review classes...
  $('.--active-review').removeClass('--active-review');
  // Select the correct review based on the math above..
  desiredTarget = $('[data-review]')[_zucDesiredIndex];
  // Get height of next review
  newHeight = $(desiredTarget).height();
  // Set container to that height for absolute elements
  // $('[data-review-container]').css({
  //   "height" : newHeight + 'px'
  // });
  // Make Active
  $(desiredTarget).addClass('--active-review');
}
