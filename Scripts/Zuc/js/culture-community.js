$(document).ready(function(){

// create a function in about us to call tip function on only about us page. and ther are some updates before sending all other page updates. 

console.log("DOM function called");

// have function which takes the number 1 and increses each time they click.
//that number * -425px left of each image. 
let x=0;
$('.left-slide').hide();
function sliderGallery(number){
	//slide's max width should be changable
	//moveLeft different as per screen width : mobile, ipad and desktop
	//for mobile need to go -50. hopefully that works
	let images = $('.three-slider img'), imageWidth, moveLeft, leftNum,arrowCount=3,marginWidth=20;
	imageWidth= parseInt($('.three-slider img').width());
	console.log(imageWidth);
	x = x + number;
	x = Math.abs(x);
	if(x > 0){
		$('.left-slide').show(500);
	}else{
		$('.left-slide').hide();
	}
	marginWidth *= x;
	console.log(marginWidth);
	moveLeft = (imageWidth * x) + marginWidth;
	console.log("move left is "+ moveLeft);
	imageWidth = "-"+ moveLeft;
	leftNum = parseInt(imageWidth) + "px";
	console.log(leftNum);
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
});


