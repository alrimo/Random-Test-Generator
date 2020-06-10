$.PAYLOAD = new Object();
var dataTracker = new Object();
var questionList = [];
var currentQ = -1;	// idx of current, prev, next, last questions
var nextQ = -1;
var prevQ = -1;
var lastQ = -1;
var minPassing = -1;


$(document).ready(function(){
  $("#file").change(handleFileSelect);	

  // event handlers
	var dropzone = $("#dz");
	dropzone.on("dragover", handleDragOver);
	dropzone.on("drop", handleFileDrop);
	dropzone.on("dragleave", handleDragLeave);
	$("#formOptions").on("submit", handleOptionsSubmit);
	$("#nextPage > a").on("click", paginateNext);
	$("#prevPage > a").on("click", paginatePrev);
	$("#btnFinish").on("click", handleFinishTest);

	/*  Range Input Slider */
	var slider = document.getElementById("inputPassingScore");
	var output = document.getElementById("rangeVal");
	output.innerHTML = slider.value;

	slider.oninput = function() {
	  output.innerHTML = this.value;
	}



 });
