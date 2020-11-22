window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  beginWindowLoadingByType(0);
}

function activateTransition(targetPosInPercentage){
  movementTab = document.getElementById("toggleMovementDiv");
  if(!movementTab.value){
    movementTab.value = "0%";
  }
  movementTab.style.left = targetPosInPercentage;
}
// Change movementTab.value when going back and forth between windows

function loadAvatar(){
  if(hasAvatar(validateCurrentUser())){
    avatar = "load custom avatar"
    document.getElementById("avatarImage").src = avatar;
  }
}

function hasAvatar(authInfo){
  // Search in database whether the user has a specific avatar saved
  return false;
}

function beginWindowLoadingByType(winType){
  urls = ['http://127.0.0.1:5000/worker_details', 'http://127.0.0.1:5000/worker_details',
   'http://127.0.0.1:5000/worker_details', 'http://127.0.0.1:5000/worker_details']
  callbackFuncs = [loadHomeWindow, loadCompanyWindow, ()=>{}, loadAccountWindow];
  document.getElementById("toggleMovementDiv").value = winType * 20 + "%";
  document.getElementById("alertContainer").style.display = "none";
  let currentWin = document.getElementById("homeScreen");
  currentWin !== null ? currentWin.remove() : null;

  url = urls[winType];
  parameters = {username: validateCurrentUser()}
  parseResponseCallback = callbackFuncs[winType];
  callback = (response) => {parseWindowLoadingResponse(response, parseResponseCallback)};
  postData(url, parameters, callback);
}

function parseWindowLoadingResponse(response, callback){
  if(response.success){
    document.getElementById("mainScreen").innerHTML='<div class="screen" id="homeScreen"></div>';
    callback(response.parameters);
  }
  else{
    displayAlert(response.message);
  }
}


// HOME SECTION sourcecode

function loadHomeWindow(workerDetails){
  loadHTMLChunk("../plain/homeSection.html", document.getElementById("homeScreen"), () => {
    document.getElementById("greetingSpan").innerHTML = "Hello, "+getShortenedTextValue(workerDetails.firstName, 30);
  });
}

function submitHomeSectionEntry(){
  url = 'http://127.0.0.1:5000/login_employee';
  parameters = {username: validateCurrentUser(), identifier: document.getElementById("homeSectionCompanyIdentifier").value}
  callback = (response) => {parseHomeSectionResponse(response)};
  postData(url, parameters, callback);
}

function validateHomeSectionEntry(callMethodIfValid){
  var entry = document.getElementById("homeSectionCompanyIdentifier");
  setCustomValidityHomeSectionError(entry);
  if(!entry.checkValidity()){
    entry.reportValidity();
  }
  else{
    callMethodIfValid();
  }
}

function setCustomValidityHomeSectionError(object){
  var errorMessage="";
  if(object.validity.valueMissing){
      errorMessage = "Field cannot be empty.";
  }
  else if(object.validity.tooShort){
    errorMessage = "Field must be between 3 and 10 characters.";
  }
  object.setCustomValidity(errorMessage);
}

function parseHomeSectionResponse(response){
    if(response.success){
      document.getElementById("homeSectionForm").reset();
      document.body.style.cursor = "progress";
      setInterval(() => {
        redirectPage("../templates/employeeLogged.html");
      }, 1000);
    }
    else{
      displayAlert(response.message);
    }
}

// COMPANY SECTION sourcecode


function loadCompanyWindow(workerDetails){
  loadHTMLChunk("../plain/companySection.html", document.getElementById("homeScreen"), () => {
    compDesc = document.getElementById("companySectionDescription");
    compDesc.addEventListener('blur', () => {expandCompanyTextArea(false, compDesc, '30px')}, true);
    compDesc.addEventListener('click', () => {expandCompanyTextArea(true, compDesc, '125px')}, true);
  });
}

function changeCheckBoxValue(checkBoxButton){
  var locationEntry = document.getElementById("companySectionLocation");
  checkBoxButton.innerHTML = checkBoxButton.value == 0 ? "<span class='checkMarkSpan'>✓</span>" : "";
  locationEntry.disabled = checkBoxButton.value == 0 ? true: false;
  locationEntry.style.opacity = checkBoxButton.value == 0 ? ".5" : "1";
  locationEntry.value = checkBoxButton.value == 0 ? "Remote" : "";
  checkBoxButton.value = checkBoxButton.value == 0 ? 1: 0;
}

function validateCompanySectionEntries(callMethodIfValid){
    var entriesArray = document.getElementsByClassName("companySectionEntries")

    for(let i = 0; i < entriesArray.length; i++){
      setCustomValidityCompanySectionError(entriesArray[i]);
      if(!entriesArray[i].checkValidity()){
        entriesArray[i].reportValidity();
        return;
      }
    }
  callMethodIfValid();
}

function setCustomValidityCompanySectionError(object){
  var errorMessage="";
  if(object.validity.valueMissing){
      errorMessage = "Field cannot be empty.";
  }
  else if(object.validity.tooShort){
    objLength = object.id == "companySectionDescription" ? "100 and 350 characters." :
    object.id == "companySectionIdentifier" ? "3 and 10 characters." : "3 and 30 characters.";
    errorMessage = "Field must be between " + objLength;
  }
  else if(object.validity.patternMismatch){
    errorMessage = "Company identifier may only contain alphanumerical values or any of the symbols:\n. - _ followed by alphanumerical values."
  }
  object.setCustomValidity(errorMessage);
}

function submitCompanySectionEntries(){
  url = 'http://127.0.0.1:5000/register_company';
  entriesArray = document.getElementsByClassName("companySectionEntries");
  parameters = {title: entriesArray[0].value, id: entriesArray[1].value, location: entriesArray[2].value,
      description: entriesArray[3].value, username: validateCurrentUser()}
  callback = (response) => {parseCompanySectionResponse(response)};
  postData(url, parameters, callback);
}

function parseCompanySectionResponse(response){
    if(response.success){
      document.getElementById("companySectionForm").reset();
      expandCompanyTextArea(false, document.getElementById("companySectionDescription"), '30px');
      checkBoxButton = document.getElementById("companySectionCheckBoxButton");
      if(checkBoxButton.value == 1){
        changeCheckBoxValue(checkBoxButton);
      }
    }
    displayAlert(response.message);
}

function expandCompanyTextArea(enterBool, textArea, height){
  textArea.style.height = !enterBool && textArea.value != "" ? Math.min(125, Math.max(Math.floor(textArea.value.length/2.1), 30))+"px" : height;
}

// ACCOUNT SECTION sourcecode


function loadAccountWindow(accountInfo){
  loadHTMLChunk("../plain/accountSection.html", document.getElementById("homeScreen"), () => {
    document.getElementById("greetingSpan").innerHTML = "Hello, "+getShortenedTextValue(accountInfo.firstName, 30);
    document.getElementById("emailSpan").innerHTML = "admin@BudihalaINC.com";
  });
}

function toggleAccountSectionChangeBox(actionType){
  changeAvatarBox = document.getElementById("accountSectionChangeAvatarBox");
  if(changeAvatarBox != null){
    changeAvatarBox.remove();
  }
  if(actionType==0){
    document.getElementById("accountSectionUpperAreaDiv").innerHTML+=
      "<button id='accountSectionChangeAvatarBox'>Change avatar</button>";
      document.getElementById("accountSectionChangeAvatarBox").addEventListener('click', loadPopupWindow);
      $('#accountSectionChangeAvatarBox').css('top', window.event.pageY-$('#accountSectionContainerDiv').offset().top);
      $('#accountSectionChangeAvatarBox').css('left', window.event.pageX-$('#accountSectionContainerDiv').offset().left);
  }
}

function loadPopupWindow(){
  document.getElementById("homeScreen").insertAdjacentHTML('afterbegin', '<div id="tempPlainPopupWindow"></div>');
  loadHTMLChunk("../plain/accountSectionPopupWindow.html", document.getElementById("tempPlainPopupWindow"), () => {
    document.getElementById("popupWindowInfoSpan").innerHTML="Select new avatar";
    document.getElementById("popupWindowContent").innerHTML=
          `<form>
            <button id="popupWindowSelectFilePseudoButton" type="button" onClick="document.getElementById('popupWindowSelectFile').click()">
              Select Image</button>
            <input type="file" id="popupWindowSelectFile" accept="image/*" style="display: none">
          </form>`;
  });
  toggleScreenVisibility(true);
}

function toggleScreenVisibility(isLocked){
  containerDiv = document.getElementById("accountSectionContainerDiv");
  containerDiv.style.pointerEvents = isLocked? "none": "initial";
  containerDiv.style.opacity = isLocked? ".3": "initial";
}

function submitModifications(modType){
  if(modType==0){
    document.getElementById("tempPlainPopupWindow").remove();
    toggleScreenVisibility(false);
  }
}
