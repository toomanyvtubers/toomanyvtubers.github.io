var streams = {};
var hidden_streams = new Array();
var best_per_row = 1;
var YTAPI_ready = false;
const default_thumbnail = 'files/multi.png';
const domain_name = window.location.hostname;
var stream_JSON;

$(document).ready(function() {
	var stream_input = $("#stream_input")[0];
	$("#option_default_volume_slider")[0].addEventListener('input', function(e) {$("#option_default_volume_num").text(e.target.value)});

	$(window).resize(function() {
		optimize_size();
		$(".optionbox").each(function(index, value) {
			absolute_center($(this));
		});
	});
});

function optimize_size() {
	var num_streams = Object.keys(streams).length - hidden_streams.length;
	var height = $(window).innerHeight() - 24;
	var width = $("#wrapper").width();

	var best_height = 0;
	var best_width = 0;
	var wrapper_padding = 0;
	for (var per_row = 1; per_row <= num_streams; per_row++) {
		var num_rows = Math.ceil(num_streams / per_row);
		var max_width = width / per_row;
		var max_height = height / num_rows;
		if (max_width * 9/16 < max_height) {max_height = max_width * 9/16;}
		else {max_width = (max_height) * 16/9;}
		if (max_width > best_width) {
			best_width = max_width;
			best_height = max_height;
			best_per_row = per_row;
			wrapper_padding = Math.floor((height - num_rows * max_height)/2);
		}
	}
	$("#streams").width(width);
	$("#streams .stream").height(Math.floor(best_height));
	$("#streams .stream").width(Math.floor(best_width));
	$("#streams").css("padding-top", wrapper_padding);
	update_stream_thumbnails();
}

function absolute_center(object) {
	var window_height = $(window).height();
	var window_width = $(window).innerWidth();
	var obj_height = object.height();
	var obj_width = object.width();
	var pos_x = (window_width - obj_width)/2;
	var pos_y = (window_height - obj_height)/2;
	if (pos_x < 0) {pos_x = 0;}
	if (pos_y < 0) {pos_y = 0;}
	object.css('position', 'absolute');
	object.css('left', pos_x);
	object.css('top', pos_y);
}

function showWindow(window_id) {
	$(window_id).toggle();
	$(".optionbox:not("+window_id+")").hide();
	absolute_center($(window_id));
}

function show_streams_window() {
	showWindow("#change_streams");
	clear_stream_input();
	stream_input.focus();
}

function clear_stream_input(){
	stream_input.value = " ";
	update_scroll_height();
	stream_input.value = "";
	absolute_center($("#change_streams"));
}

function update_stream_thumbnails() {
	$("#stream_thumbnails").html("");
	var num_streams = Object.keys(streams).length;
	var active_streams = 0;
	for (var stream_name in streams){
		if (hidden_streams.includes(stream_name)){continue;}
		$("#stream_thumbnails").append(streamThumbAndX(stream_name));

		setTitleText(stream_name);

		active_streams++;
		if (active_streams % best_per_row == 0) {
			$("#stream_thumbnails").append('<br />');
		}
	}
	$("#active_stream_num").text(active_streams);
	$("#total_stream_num").text(num_streams);
	absolute_center($("#change_streams"));
}

function update_hidden_stream_thumbnails() {
	$("#hidden_stream_thumbnails").html("");
	var num_streams = hidden_streams.length
	for (var i = 0; i < num_streams; i++) {
		stream_name = hidden_streams[i];
		$("#hidden_stream_thumbnails").append(streamThumbAndX(stream_name));
		setTitleText(stream_name);
	}
	$("#hidden_stream_num").text(num_streams);
	absolute_center($("#change_streams"));
}

function streamThumbAndX(stream_name){
	div = '<div class="inline" id=info_'+ stream_name + '><a href="' + streams[stream_name].address + ' " target="_blank"><img class="video_thumb" src="'+ streams[stream_name].thumbnail + '" referrerpolicy="no-referrer" /></a><br />'+streams[stream_name].start_time+'<div class="remove_stream_button" onclick="removeStream(\'' + stream_name + '\');">X</div></div>';
	return $(div)
	
}

function setTitleText(stream_name){
		var title_text = streams[stream_name].title;
		if (streams[stream_name].channel_name != undefined && streams[stream_name].channel_name != ""){
			title_text += "\n" + streams[stream_name].channel_name;
		}
		if (streams[stream_name].start_time != undefined && streams[stream_name].start_time != ""){
			title_text += "\n" + streams[stream_name].start_time;
		}
		if (streams[stream_name].error > -1){
			$("#info_"+stream_name).css("border", "thick solid #FF0000");
			title_text += "\nError " + streams[stream_name].error + ": " + youtube_error_code[streams[stream_name].error];
		}
		$("#info_"+stream_name).attr("title", title_text);	
}

function update_scroll_height(){
	stream_input.style.height = "";
	stream_input.style.height = stream_input.scrollHeight + "px";
	stream_input.style.width = "";
	stream_input.style.width = stream_input.scrollWidth + "px";
}

function attachYTAPI(stream_name){
	if (YTAPI_ready){
		streams[stream_name].player = new YT.Player('embed_' + stream_name, {
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange,
				'onError': onPlayerError
			}
		});
	}
	else {
		window.setTimeout(attachYTAPI, 2000, stream_name);
	}
}

function addStream(stream_input, stream_title = null, stream_time = null){
	var stream_name, stream_address, stream_thumbnail, host_name;
	[stream_name, stream_address, stream_thumbnail, host_name] = parseURL(stream_input);
	if (stream_name == "" || stream_name in streams || hidden_streams.includes(stream_name)){return;}
	if (stream_title == null){stream_title = host_name + ": " + stream_name;}
	if (stream_time == null){stream_time = "";}

	var stream_object = $('<iframe id="embed_' + stream_name + '" class="stream" src="' + stream_address + '" allowfullscreen="true" allow="autoplay"></iframe>')
	
	switch (host_name){
		case "youtube":
			hidden_streams.push(stream_name);
			stream_object.addClass("hidden");
			window.setTimeout(attachYTAPI, 1000, stream_name);
		break;
		case "twitch":
		break;
		default:
		break;
	}
	streams[stream_name] = {"address": stream_address, 
							"thumbnail": stream_thumbnail, 
							"hostname": host_name, 
							"title": stream_title,
							"start_time": stream_time}
	streams[stream_name].error = -1;
	$("#streams").append(stream_object);
}

function unhideStream(stream_name){
	var stream_index = hidden_streams.indexOf(stream_name);
	if (stream_index !== -1) {hidden_streams.splice(stream_index, 1);}
	optimize_size();
	update_hidden_stream_thumbnails();
	$("#embed_"+stream_name).removeClass("hidden");
}

function removeStream(stream_name){
	if (stream_name in streams) {
		delete streams[stream_name]
		$("#embed_"+stream_name).remove();
	}
	var stream_index = hidden_streams.indexOf(stream_name);
	if (stream_index !== -1) {
		hidden_streams.splice(stream_index, 1);
		update_hidden_stream_thumbnails();
	}
	optimize_size();
}

function addNotification(message, option_check = ""){
	if ($("#"+option_check).is(":checked") == true || option_check == ""){
		$("#notifications").append('<div>' + message + '</div>');
		$("#notification_num").text(parseInt($("#notification_num").text())+1);
		absolute_center($("#notifications_window"));
	}
}

function clearNotifications(){
	$("#notifications").html("");
	$("#notification_num").text(0);
	absolute_center($("#notifications_window"));
}

function getParameter(parameters, parameter){
	var arguments = parameters.slice(1).split("&");
	for (i = 0; i < arguments.length; i++){
		if (arguments[i].split("=")[0] == parameter) {
			return arguments[i].split("=")[1];
		}
	}
}

function youtubeVideoData(stream_name){
	stream_address = "https://www.youtube.com/embed/" + stream_name + "?enablejsapi=1&embed_domain=" + domain_name;
	stream_thumbnail = 'https://i.ytimg.com/vi/' + stream_name + '/mqdefault.jpg'
	host_name = "youtube";
	return [stream_name, stream_address, stream_thumbnail, host_name];
}

function parseURL(URL){
	var parser = document.createElement('a');
	parser.href = URL;
	var stream_name, stream_address, stream_thumbnail, host_name;
	switch (parser.hostname){
		case "www.twitch.tv":
			host_name = "twitch";
			switch (parser.pathname.split("/")[1]) {
				case "videos":
					stream_name = parser.pathname.split("/")[2];
					stream_address = "https://player.twitch.tv/?autoplay=false&video=v" + stream_name + "&parent=" + domain_name;
					stream_thumbnail = default_thumbnail;
				break;
				default:
					stream_name = parser.pathname.split("/")[1];
					stream_address = "http://player.twitch.tv/?muted=true&channel=" + stream_name + "&parent=" + domain_name;
					stream_thumbnail = 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + stream_name + '-320x180.jpg';
				break;
			}
		break;
		case "player.twitch.tv":
			host_name = "twitch";
			var arguments = parser.search.slice(1).split("&");
			for (i = 0; i < arguments.length; i++){
				if (arguments[i].split("=")[0] == "channel") {
					stream_name = arguments[i].split("=")[1];
					stream_address = "http://player.twitch.tv/?muted=true&channel=" + stream_name + "&parent=" + domain_name;
					stream_thumbnail = 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + stream_name + '-320x180.jpg';
				}
				else if (arguments[i].split("=")[0] == "video") {
					stream_name = arguments[i].split("=")[1].slice(1);
					stream_address = "https://player.twitch.tv/?autoplay=false&video=v" + stream_name + "&parent=" + domain_name;
					stream_thumbnail = default_thumbnail;
				}
			}
		break;
		case "static-cdn.jtvnw.net":
			host_name = "twitch";
			var temp = parser.pathname.split("/")[2]
			stream_name = temp.substr(10, temp.length-22)
			stream_address = "http://player.twitch.tv/?muted=true&channel=" + stream_name;
			stream_thumbnail = 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + stream_name + '-320x180.jpg';
		break;
		
		case "www.youtube.com":
			host_name = "youtube";
			switch (parser.pathname.split("/")[1]){
				case "watch":
					stream_name = getParameter(parser.search, "v");
					return youtubeVideoData(stream_name);
				break;
				case "embed":
					if (parser.pathname.split("/")[2] != undefined){
						if (parser.pathname.split("/")[2] != "live_stream"){
							stream_name = parser.pathname.split("/")[2];
							return youtubeVideoData(stream_name);
						}
						else {
							host_name = "youtube channel";
							stream_name = parser.pathname.split("/")[2];
							stream_address = "https://www.youtube.com/embed/live_stream?channel=" + stream_name + "&embed_domain=" + domain_name;
							stream_thumbnail = default_thumbnail;
						}
					}
					else {
						stream_name = getParameter(parser.search, "list");
						stream_address = "https://www.youtube.com/embed?listType=playlist&list=" + stream_name + "&enablejsapi=1&embed_domain=" + domain_name;
						stream_thumbnail = default_thumbnail;
					}
				break;
				case "playlist":
					stream_name = parser.search.split("&")[0].split("=")[1];
					stream_address = "https://www.youtube.com/embed?listType=playlist&list=" + stream_name + "&enablejsapi=1&embed_domain=" + domain_name;
					stream_thumbnail = default_thumbnail;
				break;
				case "channel":
					host_name = "youtube channel";
					stream_name = parser.pathname.split("/")[2];
					stream_address = "https://www.youtube.com/embed/live_stream?channel=" + stream_name + "&embed_domain=" + domain_name;
					stream_thumbnail = default_thumbnail;
				break;
				default:
					host_name = "";
					stream_name = "";
					stream_address = "";
					stream_thumbnail = default_thumbnail;
				break;
			}
		break;
		case "youtu.be":
			host_name = "youtube";
			stream_name = parser.pathname.split("/")[1];
			return youtubeVideoData(stream_name);
		break;
		case "i.ytimg.com":
		case "i1.ytimg.com":
		case "i2.ytimg.com":
		case "i3.ytimg.com":
		case "i4.ytimg.com":
		case "i9.ytimg.com":
			host_name = "youtube";
			var temp = parser.pathname.split("/");
			stream_name = temp[temp.length-2];
			return youtubeVideoData(stream_name);
		break;
		
		case "www.bilibili.com":
			host_name = "bilibili";
			var temp = parser.pathname.split("/");
			var videoid = temp[temp.length-1];
			switch (videoid.substring(0,2)){
				case "av": //av80168336
					var parameter = "aid="
				break;
				case "BV": //BV1J7411R7qg
					var parameter = "bvid="
				break;
				default:
					//var parameter = "cid="
					addNotification("This bilibili video url is not currently supported, or maybe I just messed something up, I dunno.", "option_notification_error_check")
					return ["", "", "", default_thumbnail];
				break;
			}
			stream_name = videoid.slice(2);
			stream_address = "https://player.bilibili.com/player.html?" + parameter + stream_name;
			stream_thumbnail = default_thumbnail;
		break;
		
		case "www.pornhub.com":
			host_name = "pornhub";
			switch (parser.pathname.split("/")[1]){
				case "view_video.php":
					stream_name = parser.search.split("&")[0].split("=")[1];
				break;
				case "embed":
					stream_name = parser.pathname.split("/")[2]
				break;
			}
			stream_address = "https://www.pornhub.com/embed/" + stream_name;
			stream_thumbnail = default_thumbnail;
		break;
		
		case "soundcloud.com":
			host_name = "soundcloud";
			stream_name = parser.pathname.split("/")[2];
			stream_address = "https://w.soundcloud.com/player/?url=" + escape(parser.href) + "&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=true";
			stream_thumbnail = default_thumbnail;
		break;
		case "w.soundcloud.com":
			host_name = "soundcloud";
			var url = getParameter(parser.search, "url");
			var temp = url.split("/");
			stream_name = temp[temp.length-1];
			stream_address = "https://w.soundcloud.com/player/?url=" + url + "&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=true";
			stream_thumbnail = default_thumbnail;
		break;
		
		case "":
			if (URL.substring(0,1) == '{'){ // This is probably JSON
				JSON_import = JSON.parse(URL);
				for (var stream_name in JSON_import){
					var stream = JSON_import[stream_name];
					addStream(stream.address, stream.title, stream.start_time);
				}
			}
			
			
		default:
			host_name = "";
			stream_name = "";
			stream_address = "";
			stream_thumbnail = default_thumbnail;
		break;
	}
	return [stream_name, stream_address, stream_thumbnail, host_name];
}

function update_streams() {
	if (stream_input.value.substring(0,1) == '{'){ // This is probably JSON
		JSON_import = JSON.parse(stream_input.value);
		for (var stream_name in JSON_import){
			var stream = JSON_import[stream_name];
			addStream(stream.address, stream.title, stream.start_time);
		}
	}
	else { //These are probably URLs
		var new_stream_inputs = stream_input.value.split("\n"); // add new streams
		for (var i = 0; i < new_stream_inputs.length; i++) {
			addStream(new_stream_inputs[i]);
		}
	}
	optimize_size();
	update_hidden_stream_thumbnails();
	clear_stream_input();
}

function export_streams(){
	stream_input.value = JSON.stringify(streams, replacer, '\t');
	update_scroll_height();
	absolute_center($("#change_streams"));
	stream_input.focus();
}

function replacer(key, value) {
	if (key == "player") {
		return undefined;
	}
	if (["address", "title", "start_time"].includes(key) || typeof value === 'object') {
		return value;
	}
}

function onYouTubePlayerAPIReady() {
	YTAPI_ready = true;
}

function onPlayerReady(event) {
	var stream_name = event.target.getVideoData().video_id;
	addNotification("Video ready: " + stream_name, "option_notification_queued_check");

	event.target.playVideo();
	streams[stream_name].title = event.target.getVideoData().title;
	streams[stream_name].thumbnail = 'https://i.ytimg.com/vi/' + event.target.getVideoData().video_id + '/mqdefault.jpg';
	var playlist = event.target.getPlaylist();
	if (playlist == null){
		streams[stream_name].playlist_length = 0;
		streams[stream_name].playlist_index = -1;
	}
	else {
		streams[stream_name].playlist_length = playlist.length;
		streams[stream_name].playlist_index = 0;
	}	
}

var debugData;
function onPlayerStateChange(event) {
	var video_data = event.target.getVideoData();
	var stream_name = video_data.video_id;
	var playlist_index = streams[stream_name].playlist_index;
	var playlist_length = streams[stream_name].playlist_length;
	
	if (streams[stream_name].channel_name == undefined || streams[stream_name].channel_name == ""){
		streams[stream_name].channel_name = video_data.author;
		setTitleText(stream_name);
	}
	var channel_name = streams[stream_name].channel_name;
	debugData = event;
	switch (event.data){
		case -1:
			//addNotification("unstarted");
		break;
		case 0:
			//navigator.onLine = check internet connection
			if (navigator.onLine && playlist_index + 1 == playlist_length){
				addNotification(stream_name + " ended ("+channel_name+")", "option_notification_end_check");
				if ($("#option_remove_complete_check").is(":checked")){
					removeStream(stream_name);
				}
			}
		break;
		case 1:
			if (hidden_streams.includes(stream_name)){
				addNotification(stream_name + " playing ("+channel_name+")", "option_notification_start_check");
				unhideStream(stream_name);

				var default_volume = $("#option_default_volume_slider")[0].value;
				event.target.setVolume(default_volume);
				if (default_volume > 0) {event.target.unMute();}
				streams[stream_name].start_time = "LIVE!"
				setTitleText(stream_name);
			}
			if (playlist_length > 0) {
				streams[stream_name].playlist_index = event.target.getPlaylistIndex();
				streams[stream_name].title = "(" + (streams[stream_name].playlist_index + 1) + "/" + playlist_length + ")\n" + video_data.title;
				streams[stream_name].thumbnail = 'https://i.ytimg.com/vi/' + video_data.video_id + '/mqdefault.jpg';
				update_stream_thumbnails();
			}
		break;
		case 2:
			//addNotification(stream_name + " paused");
		break;
		case 3:
			//addNotification(stream_name + " buffering");
		break;
		case 5:
			//addNotification(stream_name + " video cued");
		break;
		default:
			addNotification(stream_name + " Unknown event: "+event.data, "");
		break;
	}
}

function onPlayerError(event){
	var stream_name = event.target.getVideoData().video_id;
	switch (event.data){
		case 2:
		case 5:
		case 100:
		case 101:
		case 150:
			addNotification(stream_name + " Error "+ event.data + ": " + youtube_error_code[event.data], "option_notification_error_check");
		break;
		default:
			addNotification(stream_name + " Error "+ event.data + ": Unknown error", "option_notification_error_check");
		break;
	}
	streams[stream_name].error = event.data;
	setTitleText(stream_name);
}

var youtube_error_code = {
	2: "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.",
	5: "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.",
	100: "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.",
	101: "The owner of the requested video does not allow it to be played in embedded players.",
	150: "The owner of the requested video does not allow it to be played in embedded players."
}

var script = document.createElement("script");
script.src = "http://www.youtube.com/player_api";
document.getElementsByTagName("head")[0].appendChild(script)

function updateStreams(){
	getStreamData(0, 50, []);
}

function getStreamData(offset, limit, base_data){
	$.ajax({
		"async": false,
		"crossDomain": true,
		"url": "https://holodex.net/api/v2/live?sort=available_at&order=asc&limit="+limit+"&offset="+offset+"&paginated=true&max_upcoming_hours=24",
		"method": "GET",
		"headers": {},
		"success": function(json_data){
			let stream_data = base_data.concat(json_data.items);
			
			if (offset+limit > json_data.total) {//if we have all of the data, proceed
				stream_JSON = stream_data;
				updateLiveList(stream_JSON);
			}
			else {//if we need more data, call recursively
				getStreamData(offset+limit, limit, stream_data);
			}
			
		}
	});
}

function updateLiveList(stream_list){
	$("#live_streams").html("");
	for (var i in stream_list){
		if (stream_list[i].channel.type != "vtuber"){continue}
		if (stream_list[i].id in streams) {continue;} // ignore streams we already have queued		

		var target_div_ID = "live_streams";

		if ($("#option_separate_organizations_check").is(":checked") == true){
			var org_name = stream_list[i].channel.org;
			if (org_name == null) {org_name = "Unknown"}

			target_div_ID = 'live_'+org_name.replace(/\W/g,'_')+'_streams';

			if ($("#"+target_div_ID).length == 0) {
				let target_div = $('<div class="centering" id='+ target_div_ID + '></ hr>'+org_name+'<br /></div>');
				$("#live_streams").append(target_div);
			}		
		}
		
		$("#"+target_div_ID).append(streamThumbAndTime(stream_list[i]));
		absolute_center($('#live_window'));
	
	}
}

function streamThumbAndTime(stream_data){
	var stream_name = stream_data.id;
	var stream_address = "https://www.youtube.com/watch?v=" + stream_name;
	var stream_thumbnail = 'https://i.ytimg.com/vi/' + stream_name + '/mqdefault.jpg'
	var user_thumbnail = stream_data.channel.photo

	var temp_stream_time = new Date(stream_data.start_scheduled);
	var stream_time = (temp_stream_time.getTime() > new Date()) ? temp_stream_time.toLocaleString() : "LIVE!";
	
	var stream_title = stream_data.title;

	var stream_object = $('<div class="inline" id=livedata_' + stream_name + ' title="' + stream_title + '"><img class="video_thumb" src="'+ stream_thumbnail + '" referrerpolicy="no-referrer" /><img class="user_thumb" src="'+user_thumbnail+'" referrerpolicy="no-referrer" /><br />' + stream_time + '</div>');
	stream_object.click(function () {
		addStream(stream_address, stream_title, stream_time);
		optimize_size();
		update_hidden_stream_thumbnails();
	});
		
	return stream_object;
}

$(document).on('keyup', function(e) {
	switch (e.key){
		case "Escape":
			$(".optionbox").hide();
		break;
	}
});

$(document).on('paste', function(e) {//if we try to paste something into the add stream text box without selecting it first
	if ($("#change_streams").is(":visible") && $("#stream_input").is(":focus") == false) {
		stream_input.focus();//select it so that the text gets pasted there
	}
});
