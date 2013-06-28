
/**
 * A representation of a Brainstorm which can be either 
 * open_response or single_choice (not implemented) and
 * can run with a server or serverless
 * @constructor
 * @author: patrick lawler
 */
function BRAINSTORM(node){
	this.node = node;
	this.view = node.view;
	this.content = node.content;
	this.states = [];
	this.recentResponses = new Array();
	this.subscribed = false;

	if(node.studentWork != null && node.studentWork != "" && node.studentWork != "[]") {
		// NATE student work is just one, now
		this.states.push(JSON.parse(node.studentWork)); 
	} else {
		this.states = [];  
	};

};

/**
 * Prepares the html elements with the appropriate starter
 * options. NOTE: Assumes either brainlite.html or brainfull.html
 * are loaded.
 */
BRAINSTORM.prototype.prepareStarterSentence = function(){
	/* set starter sentence html element values */
	if(this.content.starterSentence.display=='2'){
		this.showStarter();
	};

	if(this.content.starterSentence.display!='1'){
		document.getElementById('starterParent').innerHTML = '';
	} else {
		document.getElementById('starterParent').innerHTML = "<div id='starterSentenceDiv' class='starterSentence'><a onclick='showStarter()'>Show Starter Sentence</a></div>";
	};
};



/**
 * Handles brainstorm when it has a server backend
 * @param frameDoc the dom object for the brainstorm html interface
 */
BRAINSTORM.prototype.brainfullLoaded = function(frameDoc) {
	var enableStep = true;
	var message = '';




	//post the current node visit to the db without an end time
	if (this.state) {
		// NATE LAUGHS AT YOUR PITIFUL ATTEMPTS -- done outside brainstorm-page
		//this.node.view.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostFailureResponse,{});
	}
	this.recentResponses = new Array();
	var parent = frameDoc.getElementById('main');
	var nextNode = frameDoc.getElementById('studentResponseDiv');
	var old = frameDoc.getElementById('questionPrompt');

	if(old){
		parent.removeChild(old);
	};

	/*
	 * create the element that will display the question for the student to
	 * respond to
	 */
	var newQuestion = createElement(frameDoc, 'div', {id: 'questionPrompt'});
	newQuestion.innerHTML = this.content.assessmentItem.interaction.prompt;

	parent.insertBefore(newQuestion, nextNode);

	/* clear any lingering responses */
	frameDoc.getElementById('studentResponse').value = '';

	//get the starterSentence from the xml if any
	this.prepareStarterSentence();

	if (this.states!=null && this.states.length > 0) {
		/*
		 * if the student has previously posted a response to this brainstorm
		 * we will display all the canned and classmate responses. we do not
		 * need to display the responses in the states because all previous
		 * responses should have been posted to the server so they should
		 * show up from calling showClassmateResponses()
		 */
		frameDoc.getElementById('studentResponse').value = this.states[this.states.length - 1].response;
		this.showCannedResponses(frameDoc);
		this.showClassmateResponses(frameDoc);
		this.enableRefreshResponsesButton();
	} else if(!this.content.isGated) {
		/*
		 * if this brainstorm is not gated we will display all the canned
		 * and classmate responses
		 */
		this.showCannedResponses(frameDoc);
		this.showClassmateResponses(frameDoc);
		this.enableRefreshResponsesButton();
	};

	/* start the rich text editor if specified */
	/* rte disabled for now. erroneous behavior saving/loading */
	if(this.content.isRichTextEditorAllowed){
		var loc = window.location.toString();
		var vleLoc = loc.substring(0, loc.indexOf('/vle/')) + '/vle/';
		$('#studentResponse').tinymce({
			// Location of TinyMCE script
			script_url : '/vlewrapper/vle/jquery/tinymce/jscripts/tiny_mce/tiny_mce.js',

			// General options
			theme : "advanced",
			skin : "cirkuit",

			// Theme options
			theme_advanced_buttons1: 'bold,italic,importAsset',
			theme_advanced_buttons2: '',
			theme_advanced_buttons3: '',
			theme_advanced_buttons4: '',
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			theme_advanced_statusbar_location : "bottom",
			relative_urls: false,
			remove_script_host: true,
			document_base_url: vleLoc,
			setup : function(ed) {
				// Register import asset button
				ed.addButton('importAsset', {
					title : 'Use My Asset',
					image : '/vlewrapper/vle/jquery/tinymce/jscripts/tiny_mce/plugins/image_tools/img/image_alt.png',
					onclick : function() {
						var params = {};
						params.tinymce = this;
					}
				});
			}
		});
	} 

};

/**
 * Displays the responses class mates have posted
 * @param frameDoc the dom object for the brainstorm html interface
 */

BRAINSTORM.prototype.showClassmateResponses = function(frameDoc) {

	//make the request to get posts made by class mates and then display those posts
	this.node.view.connectionManager.request('GET', 2, this.node.getStudentDataURL, {
		type : 'brainstorm',
		periodId : this.node.view.userAndClassInfo.getPeriodId(),
		inOrder : true,
		userId : this.node.view.userAndClassInfo.getWorkgroupId() + ":" + this.node.view.userAndClassInfo.getClassmateIdsByPeriodId(this.node.view.userAndClassInfo.getPeriodId()),
		//runId : this.node.view.config.getConfigParam('runId'),
		nodeId : this.node.nodeId
	}, getClassmateResponsesCallback, {
		frameDoc : document,
		recentResponses : this.recentResponses,
		content : this.content,
		vle : this.node.view,    //we send the view instead, woot!
		bs : this
	});

};

/**
 * A response callback function that calls the showClassmateResponses function
 * @param eventName the name of the event
 * @param fireArgs the args passed to the event when the event is fired
 * @param subscribeArgs the args passed to the event when the event is
 * 		subscribed to 
 */
BRAINSTORM.prototype.showClassmateResponsesCallback = function(eventName, fireArgs, subscribeArgs) {
	subscribeArgs.bs.showClassmateResponses(subscribeArgs.frameDoc);
};

/**
 * This function is used by array.sort(function) which sorts an array
 * using the function that is passed in.
 * This function looks at the timestamp attribute of objects and 
 * sorts them in chronological order, from oldest to newest.
 */
function sortByTimestamp(object1, object2) {
	//get the timestamp values
	var timestamp1 = object1.timestamp;
	var timestamp2 = object2.timestamp;

	/*
	 * return a negative value if 1 comes before 2
	 * return 0 if values are the same
	 * return a positive value if 1 comes after 2
	 */
	return timestamp1 - timestamp2;
}

/**
 * The callback function for displaying class mate posts. After it displays
 * all the class mate posts, we will display the student's recent post from
 * the recentResponses array.
 * @param responseText the response text from the async request
 * @param responseXML the response xml from the async request
 * @param handlerArgs the extra arguments used by this function
 */

// NATE SCREWED THIS ALL AROUND, YES  (in his defense, it was only after being screwed with by it)
// just returns all states with userId/nodeId we need -- screw the 'visits'
function getClassmateResponsesCallback(responseText, responseXML, handlerArgs) {
	var bs = handlerArgs.bs;
	if(responseText) {
		//the responseText should be json

		//parse the json
		states = JSON.parse(responseText);

		//used for adding responses to the student UI
		var frameDoc = handlerArgs.frameDoc;
		var responsesParent = frameDoc.getElementById('responses');

		var responseStates = new Array();
		var replyStates = new Array();

		//loop through the states
		for (var x = 0; x < states.length; x++) {
			var state = JSON.parse(states[x]);

			// DAMN THAT NATE GUY
			if (state.postType != null && state.postType == "reply") {
				replyStates.push(state);
			} else {
				// it should be "new"
				responseStates.push(state);
			}
		}

		//sort the arrays by timestamp using the function we wrote
		responseStates.sort(sortByTimestamp);
		replyStates.sort(sortByTimestamp);

		//loop through the responseStates
		for(var z=0; z<responseStates.length; z++) {
			//obtain a responseState
			var responseState = responseStates[z];

			//add the response to the UI. this will also show the reply link if reply is enabled for this step.
			bs.addStudentResponse(responseState, handlerArgs.vle, handlerArgs.content);
		}

		// then loop through the reply states and show them
		//loop through the responseStates
		for(var z=0; z<replyStates.length; z++) {
			//obtain a responseState
			var replyState = replyStates[z];

			//add the response to the UI. this will also show the reply link if reply is enabled for this step.
			bs.addStudentResponse(replyState, handlerArgs.vle, handlerArgs.content);
		}


	} else {

	BRAINSTORM.prototype.showRecentResponses(frameDoc, recentResponses, responsesParent, vle);
	}
};

/**
 * Reply to a post or another reply. The student replies to a specific node state which is stored within a node visit.
 *  When the save reply button is clicked, this function is called. It will save
 * the student's reply in the node state and then display everyone's
 * responses including this current one just saved.
 * Note: this is different from savePost which saves a first-level original post. This saves a reply.
 * 
 * @replyText the text of the reply
 * @replyToNodeVisitId the node visit the student is replying to
 * @replyToNodeStateTimestamp the timestamp of the node state within the nodevisit that the student is replying to
 */
BRAINSTORM.prototype.saveReply = function(replyText, replyToNodeVisitId, replyToNodeStateTimestamp) {

	if(replyText && replyText!=""){
		// create a reply brainstorm state
		var postType = "reply";
		var currentState = new BRAINSTORMSTATE(replyText, postType, replyToNodeVisitId, replyToNodeStateTimestamp);
		this.view.pushStudentWork(this.node.id, currentState);
		
		this.states.push(currentState);

		this.recentResponses.push(replyText);

		//check if we are using a server backend
		if(this.content.useServer) {
			/*
			 * we are using a server backend so we can retrieve other students'
			 * responses
			 */
			currentState.userId=this.node.view.getUserAndClassInfo().getWorkgroupId();


			// create additional data for reply save callback function 
			var additionalCallbackData = {
					"replyState":currentState,
					"replyToNodeVisitId":replyToNodeVisitId,
					"replyToNodeStateTimestamp":replyToNodeStateTimestamp,
					"bs":this
			}

			/*
			 * post the current node visit to the db immediately without waiting
			 * for the student to exit the step.
			 */
			// NATE HATES YOUR FREEDOMS	
			//this.node.view.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostFailureResponse,additionalCallbackData);
		} else {
			for(var x=0; x<this.states.length; x++) {
				this.addStudentResponse(this.states[x], this.node.view, this.content);
			}
		}

		//make the "check for new responses" button clickable
		this.enableRefreshResponsesButton();
	} else {
		document.getElementById('saveMsg').innerHTML = "<font color='8B0000'>nothing to save</font>";
	};
};





/**
 * This displays the responses made by the author/teacher. This
 * is used in server as well as serverless mode.
 * @param frameDoc the dom object that contains all the brainstorm
 * 		elements
 */
BRAINSTORM.prototype.showCannedResponses = function(frameDoc){
	/* get parent */
	var responsesParent = frameDoc.getElementById('responses');

	/* remove any old children */
	while(responsesParent.firstChild){
		responsesParent.removeChild(responsesParent.firstChild);
	};

	if (this.content.cannedResponses) {
		/* create new response elements for each response in canned responses and append to parent */
		for(var p=0;p<this.content.cannedResponses.length;p++){
			var response = createElement(frameDoc, 'div', {rows: '7', cols:  '100', disabled: true, id: this.content.cannedResponses[p].name});
			var responseTitle = createElement(frameDoc, 'div', {id: 'responseTitle_' + this.content.cannedResponses[p].name});
			responseTitle.innerHTML = 'Posted By: &nbsp;' + this.content.cannedResponses[p].name;
			responseTitle.appendChild(createElement(frameDoc, 'br'));
			responseTitle.appendChild(response);
			responseTitle.setAttribute('class', 'responseTitle');
			response.innerHTML = this.content.cannedResponses[p].response;
			response.setAttribute('class', 'responseTextArea');

			responsesParent.appendChild(responseTitle);
			responsesParent.appendChild(createElement(frameDoc, 'br'));
		};
	};

};

/**
 * Displays the responses made by the student during this node visit.
 * These responses have not been posted back to the server yet which
 * is why we need to keep a local copy of them until they have been
 * posted back to the server. This is only used in server mode.
 * @param frameDoc the dom object that contains all the brainstorm
 * 		elements
 * @param recentResponses an array of responses that the student has
 * 		made during this node visit
 * @param responsesParent the dom object of the parent element for 
 * 		the brainstorm
 * @param vle this student's vle
 */
BRAINSTORM.prototype.showRecentResponses = function(frameDoc, recentResponses, responsesParent, vle) {
	/*
	 * loop through all the response(s) the student has posted during the
	 * current node visit and display them
	 */
	for(var z=0; z< recentResponses.length; z++) {
		/*
		 * display the responses the student has just posted during the
		 * current node visit
		 */
		var recentResponse = recentResponses[z];
		var dummyState = {response:recentResponse, userId:vle.getWorkgroupId()};
		BRAINSTORM.prototype.addStudentResponse(dummyState, vle, this.content);
	};
};

/**
 * When the save button is clicked, this function is called. It will save
 * the student's response in the node state and then display everyone's
 * responses including this current one just saved.
 * Note: this is different from saveReply which saves a reply. This saves a first-level original post.
 * @param frameDoc the dom object that contains all the brainstorm elements
 */
BRAINSTORM.prototype.savePost = function(frameDoc){

	var response = $('#studentResponse').val();

	//obtain the dom object that holds all the responses
	var responsesParent = frameDoc.getElementById('responses');

	/*
	 * clear out all the responses from the last time we loaded
	 * them so we do not have any duplicates. down below, we will 
	 * re-load all of the responses again including any new responses.
	 */
	// NATE -- this should move below the if, right, in case empty post?
	while(responsesParent.firstChild){
		responsesParent.removeChild(responsesParent.firstChild);
	};

	if(response && response!=""){
		var postType = "new";
		var currentState = new BRAINSTORMSTATE(response, postType);
		this.view.pushStudentWork(this.node.id, currentState);
		this.states.push(currentState);

		frameDoc.getElementById('saveMsg').innerHTML = "<font color='8B0000'>save successful</font>";

		this.recentResponses.push(response);

		//display the canned responses
		this.showCannedResponses(frameDoc);

		//check if we are using a server backend
		if(this.content.useServer) {
			/*
			 * we are using a server backend so we can retrieve other students'
			 * responses
			 */

			/*
			 * post the current node visit to the db immediately without waiting
			 * for the student to exit the step.
			 */
			
			// NATE KILLED THIS WITH RELUCTANCE...
			//this.node.view.postCurrentNodeVisit(this.processPostSuccessResponse,this.processPostSuccessResponse,{"hi":"ho"});
			//   already done at page load
			//this.view.model.postCurrentNodeVisit(this.processPostSuccessResponse, this.processPostFailResponse,{})
	
			this.showClassmateResponses(frameDoc);
		} else {
			for(var x=0; x<this.states.length; x++) {
				this.addStudentResponse(this.states[x], this.node.view, this.content);
			}
		}

		//make the "check for new responses" button clickable
		this.enableRefreshResponsesButton();
	} else {
		frameDoc.getElementById('saveMsg').innerHTML = "<font color='8B0000'>nothing to save</font>";
	};
};

/**
 * Add the response to the brainstorm display. This function is used to display
 * canned responses, classmate responses, and recent responses.
 * @param state the node state containing the student's response
 * @param vle the vle of the student who is logged in
 * @param content content for this brainstorm
 */
// NATE -- we send the view instead of the vle -- it has the userInfo 
//   and, changed the locations of tinymce stuff
BRAINSTORM.prototype.addStudentResponse = function(state, vle, content) {
	//obtain the dom object that holds all the responses
	var responsesParent = $('#responses');
	var postedByUserId = state.userId;

	var responseMainDiv = $('<div>').addClass('responseMainDiv');
	if (state != null && state.nodeVisitId != null) {
		responseMainDiv.attr('bsNodeVisitId', state.nodeVisitId);
		responseMainDiv.attr('bsNodeStateTimestamp', state.timestamp);
	}

	//create the response title and textarea elements
	var responseTitle = $('<div>').addClass('responseTitle').html("<span class='postedBy'>Posted By: &nbsp;" + vle.getUserAndClassInfo().getUserNameByUserId(postedByUserId) + "<span>");
	var responseTextArea = $('<div>').attr("rows","7").attr("cols","80").attr("disabled", true)
	.attr('class', 'responseTextArea').html(state.response);

	if (content.isAllowStudentReply) {
		// if student are allowed to reply to other students' posts, add the reply link
		if (state != null && state.nodeVisitId != null) {
			var replyLink = $("<span>").addClass("replyLink")
			.attr("bsNodeVisitId", state.nodeVisitId)
			.attr("bsNodeStateTimestamp", state.timestamp)
			.html("Reply");
			replyLink.click({bs: this, content: content},function(event) {
				var bs = event.data.bs;
				var content = event.data.content;
				// when reply link is clicked, show the reply box directly below where students can enter a reply
				var bsNodeVisitId = $(this).attr("bsnodevisitid");
				var bsNodeStateTimestamp = $(this).attr("bsnodestatetimestamp");
				if ($("#replyDiv_"+bsNodeVisitId+"_"+bsNodeStateTimestamp).length != 0) {
					// a reply box already exists, don't show another one.
					return;
				}

				var replyDiv = $("<div>").addClass("replyDiv").attr("bsNodeVisitId", bsNodeVisitId)
				.attr("bsNodeStateTimestamp", bsNodeStateTimestamp).attr("id","replyDiv_"+bsNodeVisitId+"_"+bsNodeStateTimestamp);
				var replyTextareaId = "replyTextArea_"+bsNodeVisitId+"_"+bsNodeStateTimestamp;
				var replyTextarea = $("<textarea>").addClass("replyTextarea")
				.attr("rows","5").attr("cols","100").attr("bsNodeVisitId", bsNodeVisitId)
				.attr("id",replyTextareaId);
				replyDiv.append(replyTextarea);

				var replySaveButton = $("<input>").addClass("replySaveButton").attr("type","button").val("Post Reply");

				replySaveButton.click({bs:bs},function(event) {
					var bs = event.data.bs;
					// when Post Reply button is clicked, post reply to server and update UI
					var replyText = $(this).siblings(".replyTextarea").val();
					var replyToNodeVisitId = $(this).parents(".replyDiv").attr("bsNodeVisitId");
					var replyToNodeStateTimestamp = $(this).parents(".replyDiv").attr("bsNodeStateTimestamp");
					//var bs = handlerArgs.bs;
					bs.saveReply(replyText,replyToNodeVisitId,replyToNodeStateTimestamp);
				});
				// add the "Post Reply" button after the reply text area, at the bottom of the replyDiv
				replyDiv.append(replySaveButton);

				// add the reply div to the end of the div that contains the post/reply that we're replying to.
				$(this).parents("[bsNodeVisitId='"+bsNodeVisitId+"'][bsNodeStateTimestamp='"+bsNodeStateTimestamp+"']").append(replyDiv);	

				// make the reply textareas into a rich text editor
				if(content.isRichTextEditorAllowed){
					var loc = window.location.toString();
					var vleLoc = loc.substring(0, loc.indexOf('/vle/')) + '/vle/';
					$('#'+replyTextareaId).tinymce({
						// Location of TinyMCE script
						script_url : '/vlewrapper/vle/jquery/tinymce/jscripts/tiny_mce/tiny_mce.js',

						// General options
						theme : "advanced",
						skin : "cirkuit",

						// Theme options
						theme_advanced_buttons1: 'bold,italic,importAsset',
						theme_advanced_buttons2: '',
						theme_advanced_buttons3: '',
						theme_advanced_buttons4: '',
						theme_advanced_toolbar_location : "top",
						theme_advanced_toolbar_align : "left",
						theme_advanced_statusbar_location : "bottom",
						relative_urls: false,
						remove_script_host: true,
						document_base_url: vleLoc,
						setup : function(ed) {
							// Register import asset button
							ed.addButton('importAsset', {
								title : 'Use My Asset',
								image : '/vlewrapper/vle/jquery/tinymce/jscripts/tiny_mce/plugins/image_tools/img/image_alt.png',
								onclick : function() {
									var params = {};
									params.tinymce = this;
									
								}
							});
						}
					});
				} 
			});

			// add reply link alongside the title
			responseTitle.append(replyLink);
		} 
	}

	// add the title and textarea to the response main div
	responseMainDiv.append(responseTitle).append(responseTextArea);

	if (state != null && state.postType != null && state.postType == "reply") {
		// this is a reply to a post. show it below the response to which it replies to.
		var replyToNodeVisitId = state.bsReplyToNodeVisitId;
		var replyToNodeStateTimestamp = state.bsReplyToNodeStateTimestamp;

		// get the div that contains the original post that this reply is for
		var replyToDiv = $("div[bsnodevisitid='"+replyToNodeVisitId+"'][bsnodestatetimestamp='"+replyToNodeStateTimestamp+"']");

		$(responseMainDiv).addClass("reply");
		replyToDiv.append(responseMainDiv);
	} else {
		// this is an original post. show it in the top level 'responses' div.
		$(responseMainDiv).addClass("response");
		responsesParent.append(responseMainDiv);	
	}

};




/**
 * Places the starter sentence, if provided, at the top of the
 * response and appends any of the student's work after it.
 */
BRAINSTORM.prototype.showStarter = function(){
	if(this.content.starterSentence.display != '0'){

		//get the response box element
		var responseBox = document.getElementById('studentResponse');

		//update normally if rich text editor is not available
		if(!this.richTextEditor){
			responseBox.value = this.content.starterSentence.sentence + '\n\n' + responseBox.value;
		} else {//otherwise, we need to set it in the editor instance
			this.richTextEditor.setContent(this.content.starterSentence.sentence + '<br/><br/>' + this.richTextEditor.getContent());
		};

		//link clicked, so remove it
		document.getElementById('starterParent').innerHTML = '';
	} else {
		
	};
};


/**
 * Retrieve responses again so that the student can see
 * all the latest responses
 * @param frameDoc
 */
BRAINSTORM.prototype.refreshResponses = function(frameDoc) {
	/*
	 * clear the responses because the show functions after this
	 * just append to the div
	 */
	this.clearResponses();

	//show the canned responses
	this.showCannedResponses(frameDoc);

	//check if we are using a server
	if(this.content.useServer) {
		//show the classmate responses by requesting them from the server
		this.showClassmateResponses(frameDoc);
	}
};

/**
 * Clears the responses div
 */
BRAINSTORM.prototype.clearResponses = function() {
	document.getElementById("responses").innerHTML = "";
};

/**
 * Makes the "Check for new responses" button clickable
 */
BRAINSTORM.prototype.enableRefreshResponsesButton = function() {
	document.getElementById("refreshResponsesButton").disabled = false;
};

/**
 * Makes the "Check for new responses" button not clickable
 */
BRAINSTORM.prototype.disableRefreshResponsesButton = function() {
	document.getElementById("refreshResponsesButton").disabled = true;
};



/**
 * Handles the response from posting student data to the server. 
 * Gets called after default processPostResponse.
 * 
 * @param responseText a json string containing the response data
 * @param responseXML
 * @param args any args required by this callback function which
 * 		were passed in when the request was created
 */
BRAINSTORM.prototype.processPostSuccessResponse = function(responseText, responseXML, args){
	if (args.additionalData.replyState) {  // this is a callback for a reply that was saved successfully. remove the reply textarea and show it in the UI.
		var replyState = args.additionalData.replyState;
		replyState.nodeVisitId = JSON.parse(responseText).id; // get the new nodevisit id and set it in this state so replies can happen on this reply.
		var replyToNodeVisitId = args.additionalData.replyToNodeVisitId;
		var replyToNodeStateTimestamp = args.additionalData.replyToNodeStateTimestamp;
		var bs = args.additionalData.bs;
		var content = bs.content;

		// remove replyDiv with textarea from dom
		$(".replyDiv[bsnodevisitid='"+replyToNodeVisitId+"'][bsnodestatetimestamp='"+replyToNodeStateTimestamp+"']").remove();

		// also show this reply on the forum immediately so student doesn't have to refresh.
		bs.addStudentResponse(replyState, this.vle, content);		
	}
};

/**
 * Handles the FAIL response from posting student data to the server.
 * @param responseText a json string containing the response data
 * @param args any args required by this callback function which
 * 		were passed in when the request was created
 */
BRAINSTORM.prototype.processPostFailResponse = function(responseText, args){
	// this is a callback for a failed save.
	alert("Failed to save reply. Please talk to your teacher.");	
};
