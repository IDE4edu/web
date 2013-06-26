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

MODEL.prototype.pushStudentWorkToLatestNodeVisit =  function(thisNodeId, bsState)  {
	this.node.view.connectionManager.request('POST', 2, this.node.pushStudentStateURL, {
		type : 'BS',
		userId : this.node.userId,
		nodeId : thisNodeId,
		json : bsState
	});

};

// based on View.prototype.postCurrentNodeVisit
MODEL.prototype.postCurrentNodeVisit = function(successCallback, failureCallback, additionalData) {
	// get current node visit
	var stepWorkId = this.node.nodeId;
	var url = this.node.pushStudentVisitsURL;
	var json = "";  // get json version of current node visit
	var uaci = this.node.view.userAndClassInfo;
	
	this.node.view.connectionManager.request('POST', 3, url, 
				{id: stepWorkId, 
				//runId: this.getConfig().getConfigParam('runId'), 
				userId: this.getUserAndClassInfo().getWorkgroupId(), 
				data: nodeVisitData
					}, 
					this.processPostResponse, 
					{vle: this, 
					 nodeVisit:currentNodeVisit, 
					 successCallback:successCallback,
					 failureCallback:failureCallback,
					 additionalData:additionalData},
					this.processPostFailResponse);

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


