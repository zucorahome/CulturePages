// [ Navigation Controller ]
//
(function(){
  // Make sure we are live and ready..
  $(document).ready(function() {
    // Vars & Declarations
    // -------------------------------

    // Timers
    // -------------------------------
    var resizeTimer;

    // Initialization Functions
    // --------------------------------
    //
    // Fix Dropdown Heights
    normalizeDropdown();
    var mainNav = $('[data-main-navigation]');
    activeNavigation( mainNav );

    // Scroll Events
    // -------------------------------
    $(document).scroll(function (event) {
      // Variables
      // Targets ( Use Custom Data Attr )
      var mainNav = $('[data-main-navigation]');
      // Activate Nav Background
      activeNavigation( mainNav );
    });

    // Resize Events (debounced)
    // -----------------------------
    $(window).on('resize', function(e) {
      // Clear Timer
      clearTimeout(resizeTimer);
      // Fire function after 250ms
      resizeTimer = setTimeout(function() {
        // Normalize Dropdowns Again...
        normalizeDropdown();
        // Check Nav
        activeNavigation( mainNav );
        // Close Nav if open
        if ($('body').hasClass('body-active-mobile-nav')) {
          $('[data-mobile-menu]').toggleClass('zuc-mobile-nav-active');
          $('body').toggleClass('body-active-mobile-nav');
        }
      },250);
    });

    // Mobile Nav Controls
    // ----------------------------
    //
    // Toggle Mobile Nav Open | Close
    $('[data-open-menu]').click( function(){
      $('[data-mobile-menu]').toggleClass('zuc-mobile-nav-active');
      $('body').toggleClass('body-active-mobile-nav');
    });
    // Toggle Mobile Nav Accordion Logic
    $('[data-accordion-item]').click( function(event){
      // If tapped item already selected...
      if ($(event.target).hasClass('zuc-accordion-active')){
        $(event.target).removeClass('zuc-accordion-active');
      }
      else {
        $('[data-accordion-item]').removeClass('zuc-accordion-active');
        $(event.target).toggleClass('zuc-accordion-active');
      }
    });
  });

  // Auxiliary Functions
  // -------------------------
  //
  // Fix Dropdown Function
  function normalizeDropdown() {
    var mainNavDropdown = $('[data-main-navigation]'),
        navHiddenDropdown = $('[data-hidden-menu]'),
        outerNavHeight = $('[data-nav-height]'),
        heightAdjustment = mainNavDropdown.outerHeight();
        bodyPadding = outerNavHeight.outerHeight();

    // Normalize the top distance of the dropdowns so they are flush
    navHiddenDropdown.css({
      "top": ( heightAdjustment - 0.3 ) + 'px'
    });
    // Add margin to Body to push content down a bit
    $('body').css({
      "margin-top" : bodyPadding + 'px'
    });

  };

  function activeNavigation( target ) {
    var top = $(window).scrollTop();

    if ( top >= 50 ) {
      target.addClass('zuc-nav-active');
    }
    else if ( top === 0 ) {
      target.removeClass('zuc-nav-active');
    }
  };
})();

// Close Broadcast Banner
function closeBroadcast() {
  $('[data-broadcast-banner]').addClass('u-hidden');
}
