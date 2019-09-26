function changeMainImage(input) {
    
    $('.--active-image').removeClass('--active-image');
    // Select the correct review based on the math above..
    desiredTarget = $('[data-showcase-small]')[input];
    
    $(desiredTarget).addClass('--active-image');

    picture = $('[data-showcase-image]')[input]

    bigPicture = $('[data-showcase-big]')[0]

    bigPicture.src = picture.src;
    bigPicture.alt = picture.alt;
  }
