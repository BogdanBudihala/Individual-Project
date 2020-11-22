window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  document.getElementById("greetingSpan").innerHTML = "Hello "+currentUser+",<br>";

  compDesc = document.getElementById("compDescription")
  empAddr = document.getElementById("employeeAddress")
  compDesc.addEventListener('blur', () => {expandTextArea(false, compDesc, 'initial')}, true);
  compDesc.addEventListener('click', () => {expandTextArea(true, compDesc, '160px')}, true);
  empAddr.addEventListener('blur', () => {expandTextArea(false, empAddr, 'initial')}, true);
  empAddr.addEventListener('click', () => {expandTextArea(true, empAddr, '80px')}, true);
}

function validateEntries(currentPage, callMethodIfValid){
    var entriesArray = currentPage === 0? document.getElementsByClassName("companyRegisterEntry") :
      document.getElementsByClassName("employeeRegisterEntry");

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
    objLength = object.id == "compDescription" ? "100 and 350 characters." : object.id == "employeeAddress" ?
      "10 and 100 characters." : object.id == "compIdentifier" ? "3 and 10 characters." : "3 and 30 characters.";
    errorMessage = "Field must be between " + objLength;
  }
  else if(object.validity.patternMismatch){
    errorMessage = "Company identifier may only contain alphanumerical values or any of the symbols:\n. - _ followed by alphanumerical values."
  }
  object.setCustomValidity(errorMessage);
}

function scrollWindow(isFirstWindow){
  arrowButtons = document.getElementsByClassName("arrowButton");
  document.getElementById("employeeRegisterPanel").style.left = isFirstWindow ? "0" : "100%";
  document.getElementById("companyRegisterPanel").style.left = isFirstWindow ? "-100%" : "0";
  document.getElementById("submitCompanyRegister").style.display = isFirstWindow ? "block" : "none";
  arrowButtons[0].disabled = isFirstWindow;
  arrowButtons[1].disabled = !isFirstWindow;
}



function expandTextArea(enterBool, textArea, height){
  textArea.style.height = !enterBool && textArea.value != "" ? Math.max(Math.floor(textArea.value.length/2.1), 30)+"px" : height;
}

function changeCheckBoxValue(checkBoxButton){
  var locationEntry = document.getElementById("compLocation");
  checkBoxButton.innerHTML = checkBoxButton.value == 0 ? "<span id='checkMarkSpan'>✓</span>" : "";
  locationEntry.disabled = checkBoxButton.value == 0 ? true: false;
  locationEntry.style.opacity = checkBoxButton.value == 0 ? ".5" : "1";
  locationEntry.value = checkBoxButton.value == 0 ? "Remote" : "";
  checkBoxButton.value = checkBoxButton.value == 0 ? 1: 0;
}

function submitEntries(entriesType){
  url = entriesType == 0 ? 'http://127.0.0.1:5000/register_company' : 'http://127.0.0.1:5000/register_employee';
  entriesArray = entriesType == 0 ? document.getElementsByClassName("companyRegisterEntry") :
    document.getElementsByClassName("employeeRegisterEntry");
  parameters = entriesType == 0 ?
    {title: entriesArray[0].value, id: entriesArray[1].value, location: entriesArray[2].value,
      description: entriesArray[3].value, username: validateCurrentUser()} :
    {firstName: entriesArray[0].value, lastName: entriesArray[1].value, city: entriesArray[2].value,
      country: entriesArray[3].value, address: entriesArray[4].value, username: validateCurrentUser()}

  callback = (response) => {parseResponse(response, entriesType)};
  postData(url, parameters, callback);
}

function parseResponse(response, entryType){
  if(entryType == 0){
    if(response.success){
      submitEntries(1);
    }
    else{
      displayAlert(false, response.message);
      scrollWindow(false);
    }
  }
  else{
    if(response.success){
      document.getElementById("companyForm").reset()
      document.getElementById("employeeForm").reset()
      startCounter();
    }
    else{
      displayAlert(false, "Unexpected error occured: " + response.message);
    }
  }
}

function startCounter(){
  response = "Company registered successfully. You will be redirected within ";
  displayAlert(true, response+"5 seconds");
  var timeLeft = 4;
  var timer = setInterval(() => {
    if(timeLeft <= 0){
      clearInterval(timer);
      redirectPage("../templates/employeeLogged.html")
    }
    else {
      displayAlert(true, response+timeLeft+" seconds");
    }
    timeLeft -= 1;
  }, 1000);
}
