function postData(url, parametersToSend, callbackIfSuccessful){
  $.ajax({
   url: url,
   type: 'POST',
   contentType: "application/json",
   data: JSON.stringify(parametersToSend),
   success: callbackIfSuccessful
 });
}

function postBinaryData(url, parametersToSend, callbackIfSuccessful){
  $.ajax({
   url: url,
   type: 'POST',
   processData: false,
   contentType: false,
   data: parametersToSend,
   success: callbackIfSuccessful
  });
}

function attachOnEnterSubmit(entry, button){
  entry.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      button.click();
    }
  });
}

function redirectPage(url){
  window.location.replace(url);
}

function validateCurrentUser(){
  var currentUser = null;
  try{
    const { ipcRenderer } = require('electron')
    currentUser = ipcRenderer.sendSync('getCurrentUser');
    if(currentUser === null || currentUser.username === null || currentUser.password === null){
      throw "Unauthorised access to the webpage";
    }
    postData('http://127.0.0.1:5000/login_form', {username: currentUser.username},
      (response) => {parseVerificationResponse(response, currentUser)});
  }
  catch(errorCode){
    document.body.innerHTML="<h1>Error 401: Unauthorised access to webpage</h1>";
    //redirectPage("../templates/unauthorised.html")
  }
  return currentUser.username;
}

function validateCurrentComp(){
  var currentComp = null;
  try{
    const { ipcRenderer } = require('electron')
    currentComp = ipcRenderer.sendSync('getCurrentComp');
    if(currentComp === null){
      throw "Unauthorised access to the webpage";
    }
    postData('http://127.0.0.1:5000/login_employee', {username: validateCurrentUser(), identifier: currentComp},
      (response) => {parseCompanyVerificationResponse(response)});
  }
  catch(errorCode){
    document.body.innerHTML="<h1>Error 401: Unauthorised access to webpage</h1>";
  }
  return currentComp;
}

function parseVerificationResponse(response, currentUser){
  if(!response.success || response.parameters.password != currentUser.password){
    document.body.innerHTML="<h1>Error 401: Unauthorised access to webpage</h1>";
    //redirectPage("../templates/unauthorised.html");
  }
}

function parseCompanyVerificationResponse(response){
  if(!response.success){
    document.body.innerHTML="<h1>Error 401: Unauthorised access to webpage</h1>";
  }
}

function displayAlert(message){
  document.getElementById("alertContainer").style.display = 'block';
  document.getElementById("errorMsg").innerHTML = message;
  setTimeout(()=>{document.getElementById("alertContainer").style.display = 'none'}, 3500);
}

function getCharacterWeight(char){
  asciiVal = char.charCodeAt(0);
  hasWeightOne = [46, 49, 102, 105, 106, 108, 116, 73].includes(asciiVal);
  hasWeightTwo = [45, 95, 74].includes(asciiVal) || asciiVal >=50 && asciiVal <=57 ||
    asciiVal >=97 && asciiVal <=122 && ![107, 109, 119].includes(asciiVal);
  hasWeightTwoHalf = [48, 107, 109].includes(asciiVal) ||
    asciiVal >=65 && asciiVal <=90 && ![68, 72, 77, 79, 81, 85, 87, 88].includes(asciiVal);
  hasWeightThree = asciiVal != 87;
  return hasWeightOne ? 1 : hasWeightTwo ? 2 : hasWeightTwoHalf ? 2.5 : hasWeightThree? 3 : 5;
}

function getShortenedTextValue(text, maxWeight){
  let crtWeight = 0, crtIndex = 0, returnValue = "";
  while(crtIndex < text.length && crtWeight + getCharacterWeight(text[crtIndex]) < maxWeight){
    returnValue+=text[crtIndex];
    crtWeight+=getCharacterWeight(text[crtIndex]);
    crtIndex++;
  }
  return returnValue == text ? returnValue : returnValue+".";
}
