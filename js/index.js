
/* most of the following file upload functions courtesy of a CodePen project I found */

function handleFileDrop(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.originalEvent.dataTransfer.files; 
  console.log('Caught a File!');
  doUpload(files[0]);
  console.log($.PAYLOAD);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
    evt.originalEvent.dataTransfer.dropEffect = "copy";

  $("#dz").addClass("bg-dark text-white");
  $("#dzText").text("Release to upload");

}

function handleDragLeave(evt) {
  // User exits hover event, return to original state
  evt.stopPropagation();
  evt.preventDefault();
  $("#dz").removeClass("bg-dark text-white");
  $("#dzText").text("Drop your file here (or click)");

}

function doUpload(e, download = false) {
  //--> Desc: Handles drag-and-drop & stnd MQF parsing
  //--> Passing in true tells parser that this is a 
  //    web address.  Needed to pull files from local 
  //    server (i.e., MQFs residing with this project)
  console.log('attempt');
  Papa.parse(e, {
    header: true,
    download: download,
    delimiter: "\t",
    skipEmptyLines: 'greedy',
    before: function(file, inputElem){ console.log('Attempting to Parse...')},
    error: function(err, file, inputElem, reason){ console.log(err); },
    complete: function(results, file){
      $.PAYLOAD = results;  // put results into global var
      dispTestOpts();       // call next step (display the test options)
    }
  });
}

function handleStdMqf(e) {
  // -->  Handles pre-built MQF button click
  // -->  Constructs file path based on button value,
  //      then passes to doUpload()... "true" is needed
  //      since the file is local to the server
  const val = $(this).attr("value");
  const fullPath = `./mqf/${val}.txt`;
  doUpload(fullPath, true);
}

function dropzoneClick(evt){
  // relay click event to hidden file upload input
  $('#file').click();
}    
 
function handleFileSelect(evt) {
  var file = evt.target.files[0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      console.log(results);
    },
    error: function(err) {
      console.log(err);
    }
  });

} // end dropzoneClick()

function dispTestOpts(){
  /* Desc: Display test options area */ 
  
  // hide uploadArea & show optionArea
  $("#uploadArea, #preBuiltMqf, #jumbotron").addClass("d-none");
  $("#optArea").removeClass("d-none");

  //TODO: Populate "Select Version" drop-down

  let versionDict = {};

  /* Populate "# of questions" drop-down
  // Additionally: track unique test versions
  // AND sort test 
  */
  var numQuestions = $.PAYLOAD.data.length;
  var optsToAppend = "";
  let currItem = null;
  for (i=1; i < numQuestions + 1; i++){
    optsToAppend += '<option value="' + i + '">' + String(i) + '</option>';
    
    /*  Check to see if "vers" column exists in data, if it does
        sort test question #s by version number into dictionary
        ex: {a: [1,3,6], b: [2,5,9]}
    */
    //TODO: Refactor: (1) only need to check if "vers" exists once
    //                (2) assign value to currItem AFTER checking if vers exists (nest the null check inside this)
    currItem = $.PAYLOAD.data[i-1];
    if (currItem.hasOwnProperty("vers") && currItem.vers !== null && currItem.vers !== undefined && currItem.vers !== "") {
      if (versionDict.hasOwnProperty(currItem.vers)) {
        versionDict[currItem.vers].push(i-1);
      } else {
        versionDict[currItem.vers] = [i-1];
      }
    }

  } // end for

  console.log(versionDict);
  $("#inputQuestions").append(optsToAppend);
}


function shuffleArray(array) {
  /* Durstenfeld shuffle algorithm */
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

function handleOptionsSubmit(evt){
  /* Desc: User has selected options, now generate test */
  
  //evt.originalEvent.stopPropagation();
  evt.originalEvent.preventDefault();

  // Randomize test

  //minPassing = $("#inputPassingScore").val();

  // Randomize the questions
  randomizeQuestions();


  // init pagination
  paginateInit();

  // render first question
  displayQuestion(0);

  // hide optionArea and show test area
  $("#optArea").addClass("d-none");
  $("#testArea").removeClass("d-none");

}

function randomizeQuestions() {
  /* Generate randomized test number array
      Approach: (1) Create a simple array numbered 1 to total # of questions in CSV
                (2) Shuffle that array
                (3) Truncate array to # of question user selected
      End State:  randomized indices of user-specified length.  
                  In other words: x random questions selected from y total questions  
  */
  
  var randQuestions = $("#inputQuestions option:selected").val();
  var numQuestions = $.PAYLOAD.data.length;

  for(let i = 0; i < numQuestions; i++){        
    questionList.push(i);
  }
  shuffleArray(questionList);             
  questionList.length = randQuestions;    // truncate array to user-specified number of questions 

  // init dataTracker obj
  for (let i=0; i < questionList.length; i++){
    dataTracker[i] = -1;
  }

}

function displayQuestion(questionIdx){
  /* Desc: Use handlebars.js to render specified question into template area */

  // Get question from question bank (i.e., $.PAYLOAD)
  var randQ = questionList[questionIdx]
  var context = $.PAYLOAD.data[randQ];

  // Render template (via handlebars.js)
  var source = document.getElementById("test-template").innerHTML;
  var template = Handlebars.compile(source);
  var html = template(context);
  $("#testContentQuestion").html(html);

  // (re)wire up event handler(s) on each render
  $("input[type=radio][name='radio-answer'").on("change", handleRadioChange);

  // re-select question if user already picked one
  var userSelectedNum = dataTracker[questionIdx];
  if(userSelectedNum != -1) {
    var jQStr = "input[name='radio-answer'][value='" + userSelectedNum + "']";
    $(jQStr).prop('checked', true);
  }

}



/****** Pagination *******/

function paginateInit(){
  currentQ = 0;
  nextQ = 1;
  prevQ = -1;
  lastQ = questionList.length;
  updatePaginate();
}

function updatePaginate() {
  /* Desc: update pagination buttons on page */
  
  $("#currPage > span").text(currentQ + 1);

  // Disable/enable next button 
  var np = $("#nextPage");
  if (nextQ == -1){
    np.addClass("disabled");
    np.prop("selectedIndex", -1);
  } else if (nextQ != -1 && np.prop("selectedIndex") == -1){
    // next question shouldn't be disable but still is
    np.prop("selectedIndex", 0);
    np.removeClass("disabled");
  }

  // Disable/enable prev button

  var pp = $("#prevPage");
  if (prevQ == -1){
    pp.addClass("disabled");
    pp.prop("selectedIndex", -1);
  } else if (prevQ != -1 && pp.prop("selectedIndex") == -1){
    pp.prop("selectedIndex", 0);
    pp.removeClass("disabled");
  }
}

function paginateNext(){
  // update to next only if one exists
  if( currentQ + 1 <= (questionList.length - 1) ){
    /* update trackers: 
          'previous' quesion is current
          'current' is next
          'next' is next-next (+2 from current, if exists)
    */
    prevQ = currentQ;
    nextQ = (currentQ + 2 <= (questionList.length -1)) ? nextQ + 2 : -1; 
    currentQ = currentQ + 1;

    //update pagination
    updatePaginate();

    // render new question
    displayQuestion(currentQ);

  } else {
    console.log("Unable to go to next question: at end of list");
    console.log("currentQ: ", currentQ);
    console.log("questionList.length: ", questionList.length);
  }
}

function paginatePrev(){
  if(currentQ > 0){
    nextQ = currentQ;
    prevQ = (currentQ > 1) ? currentQ - 2 : -1;
    currentQ = currentQ - 1;

    // update pagination
    updatePaginate();

    //render new question
    displayQuestion(currentQ);
  }

}

function paginateJumpto(){
  /* Desc: Jumpt to a specific question */
  // TODO: implement pagination 
  x = 0;

}

/***** Test events *****/
function handleRadioChange(evt){
  /* Desc: Record user's selected answer whenever they click an option */

  // Get the radio button's value
  var selAnswer = this.value;

  // Record into answer tracker
  dataTracker[currentQ] = selAnswer;

}

function handleFinishTest(){
  /* Desc: User has finished test and is submitting for grading */
  x=0;

  // Hide Modal
  $("#modalSubmit").modal('hide');

  // Hide Test area
  $("#testArea").addClass("d-none");


  // Grade test and plug into results page
  var totQuestions = questionList.length;
  var numCorrect = 0; // counter of correct questions
  
  // loop through answers, adding to numCorrect
  for (var key in dataTracker) {
    if(dataTracker.hasOwnProperty(key)){
      if(dataTracker[key] == $.PAYLOAD.data[key].ans){
        numCorrect += 1;
      }
    }
  }

  // calculate grade, compare to minimum passing
  var percentage = Math.floor((numCorrect / totQuestions) * 100);
  var pass = percentage >= minPassing;

  // construct result
  var bannerText =  pass 
                    ? "Congratuations, you passed!" 
                    : "Sorry, you did not pass!";
  $("#resultBanner").text(bannerText);
  $("#resultScore").text(String(percentage) + "%");
  
  // Display results
  $("#resultsArea").removeClass("d-none")

}

function handleRetake(randQ = false) {
  // User wishes to re-take the same test
  // Reset the variables and start from question 1

  if (randQ.data === true) { randomizeQuestions(); }

  // re-init dataTracker obj
  for (let i=0; i < questionList.length; i++){
    dataTracker[i] = -1;
  }

  // reset pagination
  paginateInit();

  // render first question
  displayQuestion(0);

  // hide 
  $("#resultsArea").addClass("d-none");
  $("#testArea").removeClass("d-none");

}