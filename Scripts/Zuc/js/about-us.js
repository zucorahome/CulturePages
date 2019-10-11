$(document).ready(function(){

$('.jobPostings').hide();
 $(".current-openings").click(function(){
    $(".jobPostings").show(1000);
  });

let i=0, left= 9;

//call this function on about-us page only. 
let currentPath = window.location.pathname;

if(currentPath.indexOf('about') > 0 || currentPath.indexOf('ourstory') > 0){
	let interval = setInterval(autoRotate, 2500);
}

 function autoRotate(){
 	let totalValues = $('.zuc-sixgrid-item');
 	let hiddenText = $('.zuc-sixgrid-item').find('p');
	let textBlock = $('#value-text');

	textBlock[0].innerHTML = hiddenText[i].innerText;
	let stringLeft= left+'%';
	$('.tip-1').css('left',stringLeft);
	i++;
	if(i >= totalValues.length){
 			i = 0;
 			left=9;
 		}else{
 			left = left + 20;	
 		}
 }

// Media query to hide the tooltip texts
	$(window).resize(function(){
		if($(document).width() <= 767){
			
			$('.value-text-shadow').css('display','none');
		}else{
			$('.value-text-shadow').css('display','block');
		}
	});

	function changingOpacity(currentClass){
		let pastDiv= $('.thumb-active');
	 	pastDiv.removeClass('thumb-active');
		pastDiv.addClass('low-opacity');
		if($(currentClass).hasClass('low-opacity')){
			$(currentClass).addClass('thumb-active');
		$(currentClass).removeClass('low-opacity');	
		}
	}

	 $('.thumbnail').click(function(){
	 	let $class = this;
	 	changingOpacity($class);
		let currentId = $(this).attr('id');
		let m = currentId;
		showGalleryInfo(m);
	});


		$('.left-arrow').click(function(){
			let clickNum = -1;
			arrowClicked(clickNum);
	});

	$('.right-arrow').click(function(){
		let clickNum = 1;
		arrowClicked(clickNum);

	});

	function arrowClicked(number){
	
		let clickNum = number;
		let pastId = $('.thumb-active').attr('id'); //getting the last thumb active id
		let newId = parseInt(pastId,10) + parseInt(clickNum,10); //getting new id number
		if(newId >= 11){
			//checking if it goes more than length
			newId = 0; 
		}else if(newId < 0){
			newId = 10;	
		}
		showGalleryInfo(newId);
		
		let stringId  = newId.toString();
		let currentClass = $("#"+stringId);
		changingOpacity(currentClass);

	}		
	
function showGalleryInfo(number){
	let staff = '{"directors":['+
	'{"image":"brad-geddes","name":"Brad Geddes","title":"Head Coach, President & CEO","desc":"As an accomplished entrepreneur and business leader, Brad and his team are constantly creating opportunities to provide Canadians with smarter living solutions that combine emerging technologies with in-home professional services to help Canadians live more comfortably.","linkedin":"http://ca.linkedin.com/in/bradfordgeddes"},' + 
	'{"image":"michelle-mahovlich","name":"Michelle Mahovlich","title":"Sr. Director, Operations","desc":"With a passion for constantly improving our operations to better serve our customers, Michelle\'s experience and knowledge of almost every facet of our business drives our pursuit for excellence.","linkedin":"https://www.linkedin.com/in/michelle-mahovlich-007954175/"},'+
	'{"image":"mark-geddes","name":"Mark Geddes","title":"Sr. Director, Business Development","desc":"By leveraging Mark\'s in-depth industry experience and his retail knowledge, we create customized performance programs designed to deliver significant revenue success of our major partners.","linkedin":"https://www.linkedin.com/in/mark-geddes-642092b2/"},'+
	'{"image":"ashleigh-geddes","name":"Ashleigh Geddes","title":"Sr. Director, Partner Programs","desc":"With Ashleigh\'s thorough understanding of the needs of our retail partners, we offer highly effective programs that deliver outstanding financial benefits together with exceptional customer experiences.","linkedin":"https://www.linkedin.com/in/ashleighmgeddes/"},'+
	'{"image":"david-cohn","name":"David Cohn","title":"Director, National Sales","desc":"David combines his experience with ongoing analysis of the market to anticipate industry and consumer trends; and to provide timely and effective protection and product solutions that are aligned with clients\' business goals.","linkedin":"https://www.linkedin.com/in/david-cohn-070ab814/"},'+
	'{"image":"magda-everett","name":"Magda Everett","title":"Director, Financial Services","desc":"Magda leads our incredible team of financial professionals who assist our many partners and associates. She also provides the internal support and guidance we need to keep our business financially strong and healthy.","linkedin":"https://www.linkedin.com/in/magdalena-everett-b3746a70/"},'+
	'{"image":"trevor-brimson","name":"Trevor Brimson","title":"Director, Digital Transformation","desc":"While leading our continuously evolving business transformation, Trevor helps us leverage the power of technology to deliver new solutions for tomorrow\'s digitally connected homes.","linkedin":"https://www.linkedin.com/in/trevor-brimson-72472936/"},'+
	'{"image":"jim-brower","name":"Jim Brower","title":"Director, Product & Logistics","desc":"Jim leads our product manufacturing and distribution operations to make sure we deliver only the best solutions for our customers.","linkedin":"https://www.linkedin.com/in/jim-brower-76762018/"},'+
	'{"image":"rebeca-lopez","name":"Rebeca Lopez","title":"Director, Customer Success","desc":"Rebeca and her team of 21 Customer Solutions Agents deliver highly personalized solutions to customers to solve their appliance, furniture or home systems problems.","linkedin":"https://www.linkedin.com/in/rebeca-lopez-92511070/"},'+
	'{"image":"colleen-babenko","name":"Colleen Babenko","title":"Director, Marketing and Communications","desc":"Recognized for her work by the International Association of Business Communicators, Colleen leads our growing MarCom team to execute innovative strategies that increase Canadian\'s awareness of smarter living.","linkedin":"https://www.linkedin.com/in/colleen-babenko/"},'+
	'{"image":"oksana-tchoutchman","name":"Oksana Tchoutchman","title":"Director, Customer Solutions","desc":"Delivering exceptional service is what Oksana does best. Finding creative solutions, we count on Oksana\'s experience and professional expertise to deliver outstanding solutions that please our Smarter Living Members, customers, and retail partners.","linkedin":"https://www.linkedin.com/in/oksana-t-89a74891/"}]}';

	let obj = JSON.parse(staff), newName, newTitle, newDesc, newImage, newLinkedin,image;

	let data = obj.directors[number];
			image = data.image;
			newImage = '../../Images/Zuc/images/about/'+image+'.jpg';
			newName = data.name;
			newTitle = data.title;
			newDesc = data.desc;
			newLinkedin = data.linkedin;
			$('.gallery-image img').attr('src',newImage);
			$('.gallery-title').text(newName);
			$('.gallery-subtitle').text(newTitle);
			$('.desc').text(newDesc);
			$('.linkedin-link').attr('href',newLinkedin);
}

	// https://www.w3schools.com/js/tryit.asp?filename=tryjs_json_parse
});

