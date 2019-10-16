$(document).ready(function(){

// create a function in about us to call tip function on only about us page. and ther are some updates before sending all other page updates. 

// console.log("DOM function called");
let x=0;
let imageWidth, maxWidth=1200,arrowCount=3,marginWidth;

function getmaxWidth(){
	let screenSize = $(document).width();
	if(screenSize <= 767 ){
		arrowCount = 5;
		marginWidth = 1;

		
	}else if(screenSize >=767 && screenSize <= 1025){
		// console.log("screen size called");
		arrowCount = 4;
		$('.three-slider img').css("width","50%");
		marginWidth = 10;
	}else{
		arrowCount = 3;
		marginWidth = 20;
		
	}
	
		imageWidth = parseInt($('.three-slider img').width());
		maxWidth= (imageWidth *arrowCount) + marginWidth;
		console.log("max width is " + maxWidth , marginWidth);
		$('.three-slider').css("max-width",maxWidth);
}

function sliderGallery(number){

	let images = $('.three-slider img'), moveLeft, leftNum;
	getmaxWidth();
	x = x + number;
	x = Math.abs(x);
	console.log("after math function"+x);
	marginWidth *= x;
	// console.log("imageWidth is "+imageWidth * x, "marginWidth is" + marginWidth);
	moveLeft = (imageWidth * x) + marginWidth;
	console.log("moveLeft is" +moveLeft);
	imageWidth = "-"+ moveLeft;
	// console.log(parseInt(imageWidth));
	leftNum = parseInt(imageWidth) + "px";
	console.log(leftNum);
	images.css("left",leftNum);
	images.css("transition","all 0.5s ease-in-out");
	// console.log(arrowCount);
	if(x >= arrowCount){
		//if right side button clcicked
		x=-1;
		//else if left button clicked then x=5 only
	}
	console.log(x);
}

	$('.right-slide a').click(function(){
		sliderGallery(1);
	});

	$('.left-slide a').click(function(){
		sliderGallery(-1);
	});	

	$("a[href^='#']").click(function(e) {
	e.preventDefault();
	
	var position = $($(this).attr("href")).offset().top;
	position -= 200;
	$("body, html").animate({
			scrollTop: position
		},1000 );
	});

	$(window).resize(function(){
		getmaxWidth();
		slickSlider();
	});

	function slickSlider(){
		let screenSize = $(document).width();
		if(screenSize <= 768 ){
			$('.slider-gallery').slick(
				{
				 	nextArrow: $('.right-slide'),
		  			prevArrow: $('.left-slide')
				});
		}else{
			$('.slider-gallery').slick({
			  infinite: true,
			  slidesToShow: 3,
			  slidesToScroll: 1,
			  nextArrow: $('.right-slide'),
			  prevArrow: $('.left-slide')
			});
		}
	}

	//calling functions
	getmaxWidth();
	slickSlider();
});


