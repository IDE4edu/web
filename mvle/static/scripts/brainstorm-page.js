var brainstorm;

function loadContentAfterScriptsLoad(node) {
	/* for authoring, if richTextEditor exists, we want to remove
	 * it (clean up previous) before rendering new brainstorm object */
	if (brainstorm && brainstorm.richTextEditor) {
		/* try removing */
		if (brainstorm.richTextEditor.remove) {
			brainstorm.richTextEditor.remove();
		}

		/*  try destroying */
		if (brainstorm.richTextEditor.destroy) {
			brainstorm.richTextEditor.destroy(true);
		}
	}

	brainstorm = new BRAINSTORM(node);
	brainstorm.brainfullLoaded(document);
	
	// nate added
	$('#brain_title .actual_brain_title').html(node.content.title);
	$('#brain_title .brain_username').html("("+node.view.getUserAndClassInfo().getUserNameByUserId(node.userId)+")");
	$('#brain_title .brain_username').show();
	node.view.model.postCurrentNodeVisit();
};

/*
 function loadContent(node) {
 scriptloader.loadScripts('brainstorm', node.contentPanel.window.document, node.id, eventManager);
 };
 */

function save() {
	brainstorm.savePost(document);
};

function showStarter() {
	brainstorm.showStarter();
};

function refreshResponses() {
	brainstorm.refreshResponses(document);
};

/////////////////////////////////////
//// brainstorm additions for eduride

// NODE needs:
//   id   (nodeId)
//   userId
//   content
//   student work: array of BrainstormState (htmlstring)
//   view
//   getStudentDataURL, pushStudentStateURL, pushStudentVisitsURL
//   currentNodeVisit
// VIEW:
//    connectionManager.request(),
//    userAndClassInfo:  (view.getUserAndClassInfo(), vle.getUserAndClassInfo(), view.userAndClassInfo.)
//		getWorkGroupID()
//		getPeriodId()
//		getClassmateIdsByPeriodId(periodId)   -> string of workgroupIDs
//      getUserNameByUserId(userID -- from state)
//       (this stuff also in vle.)
//    pushStudentWork()
//    postCurrentNodeVisit()
//    MODEL
// CONTENT:  (also in brainstorm.content)
// MODEL:
//    pushStudentWorkToLatestNodeVisit ( nodeId, BRAINSTORMSTATE)

// tiny_mce script urls and images and shit -- two different places

// event manager
var eventManager = new EventManager(false);

// user info dealio
function UserInfoContentObject(json) {
	this.json = json;
}

UserInfoContentObject.prototype.getContentJSON = function() {
	return this.json;
};

// model  -- handles data movement
function MODEL(node) {
	this.node = node;
}

MODEL.prototype.pushStudentWorkToLatestNodeVisit = function(thisNodeId, bsState) {
	// these two are needed for display 
	bsState.nodeVisitId = thisNodeId;
	bsState.userId = this.node.userId;
	this.node.view.connectionManager.request('POST', 2, this.node.pushStudentStateURL, {
		type : 'BS',
		userId : this.node.userId,
		nodeId : thisNodeId,
		json : encodeURIComponent(JSON.stringify(bsState))
	});

};

// based on View.prototype.postCurrentNodeVisit, used instead of it
MODEL.prototype.postCurrentNodeVisit = function(successCallback, failureCallback, additionalData) {
	var currentNodeVisit = this.node.currentNodeVisit;
	var stepWorkId = this.node.nodeId;
	var url = this.node.pushStudentVisitsURL;
	var json = encodeURIComponent(JSON.stringify(currentNodeVisit));
	// get json version of current node visit
	var uaci = this.node.view.getUserAndClassInfo();

	this.node.view.connectionManager.request('POST', 3, url, {
		nodeId : stepWorkId,
		//runId: this.getConfig().getConfigParam('runId'),
		userId_fromClass : uaci.getWorkgroupId(),
		visitStartTime: currentNodeVisit.visitStartTime,
		visitEndTime: currentNodeVisit.visitEndTime,
		type: "BS",
		periodId : uaci.getPeriodId(),
		userId : this.node.userId,
		json : json
	}, this.processPostResponse, {
		vle : this,
		nodeVisit : currentNodeVisit,
		successCallback : successCallback,
		failureCallback : failureCallback,
		additionalData : additionalData
	}, this.processPostFailResponse);

};

// NODE

function NODE() {
	// brainstorm node, somehow -- makes a bunch of wise4 stuff work
	this.view = new View();
	this.view.connectionManager = new ConnectionManager(eventManager);
	this.view.model = new MODEL(this);
}

// aw, unused now
NODE.prototype.grabJsonFrom = function(htmlid) {
	var ih = document.getElementById(htmlid).innerHTML.trim();
	var par = $.parseJSON(ih);
	return par;
};

//  html will call these setters, built from template

// db index
NODE.prototype.setNodeId = function(id_htmlid) {
	var val = parseInt(document.getElementById(id_htmlid).innerHTML.trim());
	this.id = val;
	this.nodeId = val;
};

NODE.prototype.setUserId = function(id_htmlid) {
	var val = parseInt(document.getElementById(id_htmlid).innerHTML.trim());
	this.userId = val;
};

NODE.prototype.setGetStudentDataURL = function(id_htmlid) {
	var val = document.getElementById(id_htmlid).innerHTML.trim();
	this.getStudentDataURL = val;
};

NODE.prototype.setPushStudentVisitsURL = function(id_htmlid) {
	var val = document.getElementById(id_htmlid).innerHTML.trim();
	this.pushStudentVisitsURL = val;
};

NODE.prototype.setPushStudentStateURL = function(id_htmlid) {
	var val = document.getElementById(id_htmlid).innerHTML.trim();
	this.pushStudentStateURL = val;
};

NODE.prototype.setUserInfo = function(userInfoJson) {
	var contentJson = new UserInfoContentObject(userInfoJson)
	this.view.loadUserAndClassInfo(contentJson);
};

