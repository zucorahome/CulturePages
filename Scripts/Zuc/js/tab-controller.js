var currentTab = 0;

(function(){

  var resizeTimer;

  // Make sure we are live and ready..
  $(document).ready(function() {
    // Check to make sure the review module is alive
      // Initialize review module
      changeTab(currentTab);
  });

  $(window).on('resize', function(e) {
    // Clear Timer
    clearTimeout(resizeTimer);
    // Fire function after 250ms
    resizeTimer = setTimeout(function() {
    changeTab(currentTab);
    },250)
  });
})();

function changeTab(input) {
  // Container for height
  var newHeight = null;
  // Remove any active text classes.
  $('.--active-text').removeClass('--active-text');
  // Select the correct tab based on the input.
  desiredTarget = $('[data-detail-text]')[input];
  // Get height of the selected tabs text.
  newHeight = $(desiredTarget).outerHeight() * 1.1;
  // Set container to that height for absolute elements.
  $('[detail-container]').height(newHeight);
  // Make tab active.
  $(desiredTarget).addClass('--active-text');

  // Remove any active tab classes...
  $('.--active').removeClass('--active');
  // Select the correct tab based on the input, and add the active class
  $($('[data-detail-tab]')[input]).addClass('--active');
  
  currentTab = input;
}
