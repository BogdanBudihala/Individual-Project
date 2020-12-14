window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  document.getElementById("greetingSpan").innerHTML = "Hello, "+currentUser;

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
  response = "Worker profile registered successfully.<br>You will be redirected";
  displayAlert(response);
  var dotsCount = 1;
  var timer = setInterval(() => {
    if(dotsCount > 3){
      clearInterval(timer);
      redirectPage("../templates/companySearch.html")
    }
    else {
      displayAlert(response+".".repeat(dotsCount));
    }
    dotsCount += 1;
  }, 500);
}
