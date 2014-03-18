var key = "cm9xbkw9obnnbu9591rqplqq";
var secret = "hocljxppsd";
var feedBackTime = "";
var oauth,listings,feedback;

$(document).ready(function(){
	$("#ListingInfo").hide();
	$(".spinner").show();
	$("#listingInfo").hide();
	oauth = ChromeExOAuth.initBackgroundPage({
	  'request_url': 'https://openapi.etsy.com/v2/oauth/request_token',
	  'authorize_url': "",
	  'access_url': 'https://openapi.etsy.com/v2/oauth/access_token',
	  'consumer_key': key,
	  'consumer_secret': secret,
	  'scope': 'email_r',
	  'app_name': 'Etsy Viewer'
	});
	oauth.authorize(function(){
		$('#feedbackArea').hide();
		$("#backToListings").click(function(){
			$("#listingInfo") .show();
			$('#feedbackArea').hide();
		});
		initListings();
	});
	$("#back").click(function(){
		$("#listingInfo").show();
		$("#feedbackArea").hide();
	});
});

function etsyCtrl($scope){
	$scope.listings = listings;

	$scope.totalViews = function(){
		var total = 0;
		for (var i=0; i<listings.length; i++){
			total += listings[i].views;
		}
		return total;
	}

	$scope.feedback = feedback;

	$scope.getFeedBack = function(){
		chrome.browserAction.setBadgeText({text: ""});
		var url = "https://openapi.etsy.com/v2/private/users/__SELF__/feedback/as-seller";
		var request = {
			'method' :'GET'
		};
		oauth.sendSignedRequest(url, function(resp, xhr){
			var results = JSON.parse(resp).results;
			$("#listingInfo").hide();
			$scope.$apply(function(){
				$scope.feedback = results;
			});
			$('#feedbackArea').show();
			// for (var i=0; i<results.length; i++){
			// 	$scope.getUsername(results[i].buyer_user_id), i;
			// }
			
		});
	}

	$scope.getUsername = function (userId, indexOfFeedback){
		var url = "https://openapi.etsy.com/v2/private/users/" + userId;
		var request = {
			'method' :'GET'
		};
		oauth.sendSignedRequest(url, function(resp, xhr){
			var results = JSON.parse(resp).results;
			$scope.$apply(function(){
				$scope.feedback[indexOfFeedback].buyerName = results[0].login_name;
			});
			
		});
	}
}

function initListings(){
	var shopId;
	var url = "https://openapi.etsy.com/v2/private/users/__SELF__/shops";
	var request = {
		'method' :'GET'
	};
	oauth.sendSignedRequest(url, function(resp, xhr){
		shopId = JSON.parse(resp).results[0].shop_id;
		getListingsForShop(shopId);
	}, request);
}

function getListingsForShop(shopId){
	var url = "https://openapi.etsy.com/v2/private/shops/" + shopId + "/listings/active";
	var request = {
		'method' :'GET'
	};
	oauth.sendSignedRequest(url, function(resp, xhr){
		listings = JSON.parse(resp).results;
		angular.bootstrap(document);
		$(".spinner").hide();
		$("#listingInfo").show();
	return listings;
	}, request);
}

function pingFeedback(){
	var url = "https://openapi.etsy.com/v2/private/users/__SELF__/feedback/as-seller";
	var request = {
		'method' :'GET'
	};
	oauth.sendSignedRequest(url, function(resp, xhr){
		var results = JSON.parse(resp).results;
		chrome.storage.sync.get("feedBackTime",function(item){
			if (!item.feedBackTime){
				var time = results[0].creation_tsz;
				chrome.storage.sync.set({'feedBackTime': time});
				chrome.browserAction.setBadgeText({text: results.length.toString()});
			} else {	
				var count = 0;
				for (var i=0 ; i<results.length ; i++){
					if (results[i].creation_tsz > item.feedBackTime){
						count++;
					}
					var time = results[0].creation_tsz;
					chrome.storage.sync.set({'feedBackTime': time});
					if (count > 0){
						chrome.browserAction.setBadgeText({text: count.toString()});
					}
				}
			}
		});
	});
}

setInterval(pingFeedback, 1800000);

