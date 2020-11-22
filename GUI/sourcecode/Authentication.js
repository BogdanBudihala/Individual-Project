window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(false);
  let entryClasses = ['loginEntry', 'registerEntry', 'resetEntry']
  entryClasses.forEach((className, index) => {
    let entries = document.getElementsByClassName(className);
    let buttons = document.getElementsByClassName('submitButton');
    attachOnEnterSubmit(entries[entries.length-1], buttons[index]);
  })

}

function activateTransition(targetPosInPercentage){
  movementTab = document.getElementById("toggleMovementDiv");
  if(!movementTab.value){
    movementTab.value = "0%";
  }
  movementTab.style.left = targetPosInPercentage;
}

function changeWindow(winType){
  document.getElementById("alertContainer").style.display = "none";
  document.getElementById("toggleMovementDiv").value = winType * 33.3 + "%";
  document.getElementById("loginPanel").style.left = winType == 0 ? "0%" : "-100%";
  document.getElementById("registerPanel").style.left = winType == 1 ? "0%" : "100%";
  document.getElementById("forgotPwPanel").style.left = winType == 2 ? "0": "100%";
}

function validateEntries(entryType, callMethodIfValid){
    var entriesArray = entryType === 0? document.getElementsByClassName("loginEntry") : entryType === 1?
      document.getElementsByClassName("registerEntry") : document.getElementsByClassName("resetEntry");
    registerBool = entryType === 1;
    for(let i=0; i<entriesArray.length; i++){
      setCustomValidityError(registerBool, entriesArray[i]);
      if(!entriesArray[i].checkValidity()){
        entriesArray[i].reportValidity();
        return;
      }
    }
  callMethodIfValid();
}

function setCustomValidityError(registerBool, object){
  var errorMessage="";
  if(object.validity.valueMissing){
    errorMessage = "Field cannot be empty.";
  }
  else if(registerBool){
    var objectType = object.getAttribute("name");
    switch(objectType){
      case "text":
        errorMessage = object.validity.tooShort ? "Username must be between 5 and 30 characters." : object.validity.patternMismatch ?
          "Username may only contain alphanumerical values or any of the symbols:\n. - _ followed by alphanumerical values." : errorMessage;
        break;
      case "password":
        errorMessage = object.validity.tooShort ? "Password must be between 8 and 30 characters." : object.validity.patternMismatch ?
          "Password may only contain alphanumerical values or any of the symbols:\n! @ # $ % ^ & *." : errorMessage;
        if(object.id == "registerConfPassword" && errorMessage == ""){
          errorMessage = object.value != document.getElementById("registerPassword").value ? "Passwords do not match." : errorMessage;
        }
        break;
      case "email":
        errorMessage = object.validity.tooShort ? "Email address must be between 8 and 50 characters." : object.validity.patternMismatch ?
          "Email address address does not represent a valid email." : errorMessage;
        break;
    }
  }
  object.setCustomValidity(errorMessage);
}

function submitEntries(formType){
  callMethod = formType == 0? () => {validateEntries(0,sendLoginInfo)} : formType == 1?
    () => {validateEntries(1,sendRegisterInfo)} : () => {validateEntries(2,sendForgotPwInfo)};
  callMethod();
}

function sendLoginInfo(){
  url = 'http://127.0.0.1:5000/login_form';
  parameters = {
    username: document.getElementById("loginUser").value,
  }
  callback = (response) => {parseLoginResponse(response)};
  postData(url, parameters, callback);
}
function sendRegisterInfo(){
  const { hashInput } = require("../sourcecode/dataHandler.js")
  url = 'http://127.0.0.1:5000/register_form';
  parameters = {
    username: document.getElementById("registerUser").value,
    password: hashInput(document.getElementById("registerPassword").value),
    email: document.getElementById("registerEmail").value,
  }
  callback = (response) => {parseResponse(response, 1)};
  postData(url, parameters, callback);
}
function sendForgotPwInfo(){
  // TO BE IMPLEMENTED
  alert("Not implemented")
}

function parseResponse(response, winType){
  displayAlert(response.message);
  if(response.success){
    formIdToReset = winType == 1? "registerForm" : "resetForm";
    document.getElementById(formIdToReset).reset();
  }
}

async function parseLoginResponse(response){
  if(response.success){
    var plainValue = document.getElementById("loginPassword").value;
    const { isHashMatch } = require("../sourcecode/dataHandler.js")
    if(await isHashMatch(plainValue, response.parameters.password)){
      employmentInfo = response.employment;
      url = employmentInfo.hasWorkerProfile ? "../GUI/templates/companySearch.html" : "../GUI/templates/registerWorker.html"
      loadLoginPage(response.parameters, url);
    }
    else{
      displayAlert("Username or password is not correct.");
    }
  }
  else{
    displayAlert(response.message);
  }
}

function loadLoginPage(authenticationDetails, url){
  const { ipcRenderer } = require('electron')
  ipcRenderer.send('allowAuthentication', authenticationDetails, url);
}
