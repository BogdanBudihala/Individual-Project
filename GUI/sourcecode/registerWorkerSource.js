window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  document.getElementById("greetingSpan").innerHTML = "Hello, "+getShortenedTextValue(currentUser, 25);

  wkrAddr = document.getElementById("workerAddress")
  wkrAddr.addEventListener('blur', () => {expandTextArea(false, wkrAddr, '30px')}, true);
  wkrAddr.addEventListener('click', () => {expandTextArea(true, wkrAddr, '80px')}, true);
}

function validateEntries(callMethodIfValid){
    var entriesArray = document.getElementsByClassName("workerRegisterEntry");

    for(let i = 0; i < entriesArray.length; i++){
      setCustomValidityError(entriesArray[i]);
      if(!entriesArray[i].checkValidity()){
        entriesArray[i].reportValidity();
        return;
      }
    }
  callMethodIfValid();
}

function setCustomValidityError(object){
  var errorMessage="";
  if(object.validity.valueMissing ){
      errorMessage = "Field cannot be empty.";
  }
  else if(object.validity.tooShort){
    objLength = object.id == "workerAddress" ? "10 and 100 characters." : "3 and 30 characters.";
    errorMessage = "Field must be between " + objLength;
  }
  else if(object.validity.patternMismatch){
    errorMessage = "Field may only contain letters or any of the following symbols: . - followed by letters"
  }
  object.setCustomValidity(errorMessage);
}

function expandTextArea(enterBool, textArea, height){
  textArea.style.height = !enterBool && textArea.value != "" ? Math.max(Math.floor(textArea.value.length/2.1), 30)+"px" : height;
}

function submitEntries(){
  url = 'http://127.0.0.1:5000/register_workerprofile';
  entriesArray = document.getElementsByClassName("workerRegisterEntry");
  parameters = {firstName: entriesArray[0].value, lastName: entriesArray[1].value, city: entriesArray[2].value,
      country: entriesArray[3].value, address: entriesArray[4].value, username: validateCurrentUser()}

  callback = (response) => {parseResponse(response)};
  postData(url, parameters, callback);
}

function parseResponse(response){
    if(response.success){
      document.getElementById("workerForm").reset();
      document.body.style.cursor = "progress";
      startCounter()
    }
    else{
      displayAlert("Unexpected error occured: " + response.message);
    }
}

function expandWindow(winType){
  splitSides = document.getElementsByClassName("splitside")
  splitSides[1].style.display = winType == 0 ? "block" : "none";
  splitSides[0].style.marginLeft = winType == 0 ? "0" : "25%";
  document.getElementsByClassName("arrowButton")[0].value = winType == 0 ? 1: 0;
  document.getElementsByClassName("arrowImage")[0].src = winType == 0 ? "../graphics/arrowreversed.png" : "../graphics/arrow.png";
}

function startCounter(){
  response = "Worker profile registered successfully. You will be redirected within ";
  displayAlert(response+"5 seconds");
  var timeLeft = 4;
  var timer = setInterval(() => {
    if(timeLeft <= 0){
      clearInterval(timer);
      redirectPage("../templates/companySearch.html")
    }
    else {
      displayAlert(response+timeLeft+" seconds");
    }
    timeLeft -= 1;
  }, 1000);
}
