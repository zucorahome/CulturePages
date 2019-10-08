$(document).ready(function(){

// create a function in about us to call tip function on only about us page. and ther are some updates before sending all other page updates. 

console.log("DOM function called");

// have function which takes the number 1 and increses each time they click.
//that number * -425px left of each image. 
let x=0;
// $('.left-slide').hide();
//slide's max width should be changable
let imageWidth, maxWidth,arrowCount=3;

function getmaxWidth(){
	imageWidth = parseInt($('.three-slider img').width());
	maxWidth= imageWidth *arrowCount;
	$('.three-slider').css("max-width",maxWidth);
}

function sliderGallery(number){

	let images = $('.three-slider img'), moveLeft, leftNum,marginWidth=20;
	getmaxWidth();
	x = x + number;
	x = Math.abs(x);
	// if(x > 0){
	// 	$('.left-slide').show(500);
	// }else{
	// 	$('.left-slide').hide();
	// }
	marginWidth *= x;
	moveLeft = (imageWidth * x) + marginWidth;
	imageWidth = "-"+ moveLeft;
	leftNum = parseInt(imageWidth) + "px";
	images.css("left",leftNum);
	images.css("transition","all 0.5s ease-in-out");
	if(x >= arrowCount){
		x=-1;
	}
}


$('.right-slide a').click(function(){
	sliderGallery(1);
});

	$('.left-slide a').click(function(){
		sliderGallery(-1);
	});

	getmaxWidth();

	$("a[href^='#']").click(function(e) {
	e.preventDefault();
	
	var position = $($(this).attr("href")).offset().top;
	position -= 200;
	$("body, html").animate({
			scrollTop: position
		},1000 );
	});
});


