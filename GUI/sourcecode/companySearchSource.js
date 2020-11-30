window.onload = bindEvents();


function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  beginWindowLoadingByType(0, null);
  sendAvatarFetchRequest(0);
}

function activateTransition(targetPosInPercentage){
  movementTab = document.getElementById("toggleMovementDiv");
  if(!movementTab.value){
    movementTab.value = "0%";
  }
  movementTab.style.left = targetPosInPercentage;
}
// Change movementTab.value when going back and forth between windows

function sendAvatarFetchRequest(avatarType){
  url = 'http://127.0.0.1:5000/load_avatar';
  parameters = {username: validateCurrentUser()}
  callback = (response) => {parseAvatarLoadingResponse(response, avatarType)};
  postData(url, parameters, callback);
}
function parseAvatarLoadingResponse(response, avatarType){
    avatar = avatarType == 0? "avatarImage" : "avatarImageEnlarged";
    if(response.success){
      document.getElementById(avatar).src = response.parameters.avatar === null ? "../graphics/user.png":
        'data:image/png;base64,' + response.parameters.avatar;
    }
    else{
      displayAlert(response.message);
    }
}

function beginWindowLoadingByType(winType, propagatedCallback){
  activateTransition(winType*20+"%");
  urls = ['http://127.0.0.1:5000/worker_details', 'http://127.0.0.1:5000/worker_details',
   'http://127.0.0.1:5000/worker_details', 'http://127.0.0.1:5000/account_details']
  callbackFuncs = [(response) => {loadHomeWindow(response, propagatedCallback)}, loadCompanyWindow, loadSearchWindow, loadAccountWindow];
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

function loadHomeWindow(workerDetails, propagatedCallback){
  loadHTMLChunk("../plain/homeSection.html", document.getElementById("homeScreen"), () => {
    document.getElementById("greetingSpan").innerHTML = "Hello, "+getShortenedTextValue(workerDetails.firstName, 30);
    if(propagatedCallback != null){
        propagatedCallback();
    }
  });
}

function loadSearchWindow(workerDetails){
  loadHTMLChunk("../plain/searchSection.html", document.getElementById("homeScreen"), () => {
    fetchCompaniesByKeyword();
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
    document.getElementById("emailSpan").innerHTML = accountInfo.email;
    document.getElementById("accountSectionFirstNameSpan").innerHTML = accountInfo.firstName;
    document.getElementById("accountSectionLastNameSpan").innerHTML = accountInfo.lastName;
    document.getElementById("accountSectionCitySpan").innerHTML = accountInfo.city;
    document.getElementById("accountSectionCountrySpan").innerHTML = accountInfo.country;
    document.getElementById("accountSectionAddressSpan").innerHTML = accountInfo.address;
    loadCompaniesIntoContainer(accountInfo.companies, document.getElementsByClassName("accountSectionLoadedCompaniesContainer")[0], 0);
    sendAvatarFetchRequest(1);
  });
}

function loadCompaniesIntoContainer(companiesArray, containerDiv, winType){
  if(companiesArray.length < 1){
    //No companies returned
    //loadNoResultsURL = winType == 0? "../plain/noEnrolledCompany.html" : "";
    loadNoResultsURL = "../plain/noEnrolledCompany.html";
    loadHTMLChunk(loadNoResultsURL, containerDiv, () => {});
  }
  else{
    winType == 0? loadEnrolledCompanies(companiesArray, containerDiv): loadMatchingCompanies(companiesArray, containerDiv);
  }
}

function performActionOnCurrentWindow(currentElement){
  callback = document.getElementById("accountSectionContainerDiv") != null ? ()=>{toggleAccountSectionChangeBox(6, currentElement)}
    : ()=>{toggleSearchSectionPopup(currentElement)};
  callback();
}

function loadEnrolledCompanies(companiesArray, containerDiv){
  if(companiesArray.length == 0){
    return;
  }
  containerDiv.innerHTML+="<div></div>";
  var lastAddedDiv = containerDiv.lastChild;
  loadHTMLChunk("../plain/enrolledCompany.html", lastAddedDiv, () => {
      enrolledItems = [document.getElementById("enrolledIdentifier"),
        document.getElementById("enrolledTitle"), document.getElementById("enrolledAvatar")]
      for(let i=0;i<3;i++){
        i==2 ? loadEnrolledCompanyAvatar(enrolledItems[i], companiesArray[0][i]) : enrolledItems[i].innerHTML = companiesArray[0][i];
        enrolledItems[i].removeAttribute('id');
      }
      loadEnrolledCompanies(companiesArray.slice(1), containerDiv);
  })
}

function loadEnrolledCompanyAvatar(imageWidget, encodedAvatar){
  imageWidget.src = encodedAvatar === null ? "../graphics/company.png":
    'data:image/png;base64,' + encodedAvatar;
}

function toggleAccountSectionChangeBox(actionType, parentElement){
  changeBox = document.getElementById("accountSectionChangeBox");
  actions = ['Change avatar', 'Change first name', 'Change last name', 'Change city', 'Change country',
    'Change address', 'Connect to company', 'Browse companies'];
  if(changeBox != null){
    changeBox.remove();
  }
  if(actionType === null){
    return;
  }
  innerHTMLText = "<button id='accountSectionChangeBox'>"+ actions[actionType] +"</button>";
  parentElement.innerHTML+= innerHTMLText;
  document.getElementById("accountSectionChangeBox").addEventListener('click', (e) => {
    e.stopPropagation();
    actionType == 6 ? redirectToHomeSection(document.getElementById("accountSectionChangeBox").parentElement):
      actionType == 7? beginWindowLoadingByType(2, null) : loadPopupWindow(actionType);
    toggleAccountSectionChangeBox(null, null);

  });
  cssTopValue = actionType < 6 ? window.event.pageY-$('#accountSectionContainerDiv').offset().top :
    event.pageY - $(parentElement).offset().top;
  cssLeftValue = actionType < 6 ? window.event.pageX-$('#accountSectionContainerDiv').offset().left :
    event.pageX - $(parentElement).offset().left;
  $('#accountSectionChangeBox').css('top', cssTopValue);
  $('#accountSectionChangeBox').css('left', cssLeftValue);
}

function redirectToHomeSection(companyDiv){
  beginWindowLoadingByType(0, ()=>{
    document.getElementById("homeSectionCompanyIdentifier").value =
      companyDiv.querySelector('.accountSectionEnrolledCompanyIdentifierSpan').innerHTML;
  });
}

function loadPopupWindow(actionType){
  // actionType-1 corresponds to all modifiable fields except for avatar
  executeAfterLoading = actionType == 0? popupLoadChangeAvatar : () => {popupLoadChangeField(actionType-1)};
  document.getElementById("homeScreen").insertAdjacentHTML('afterbegin', '<div id="tempPlainPopupWindow"></div>');
  loadHTMLChunk("../plain/accountSectionPopupWindow.html", document.getElementById("tempPlainPopupWindow"), ()=>{
    submitLambda = () => {submitModifications(actionType)};
    // VALIDATE AVATAR EXTENSION BEFORE SUBMITTING!
    callback = actionType != 0? () => {validateAccountSectionEntry(submitLambda)} : submitLambda;
    document.getElementById("popupWindowApplyChangesButton").addEventListener('click', callback);
    executeAfterLoading();
  });
  toggleScreenVisibility(true, 0);
}

function popupLoadChangeField(fieldIndex){
  fields = Array.from(document.getElementsByClassName("accountSectionField")).map(object => object.innerHTML.toLowerCase());
  htmlLoadPath = fieldIndex == 4? "../plain/accountSectionChangeAddress.html" : "../plain/accountSectionChangeField.html";
  loadHTMLChunk(htmlLoadPath, document.getElementById("popupWindowContent"), () => {
    document.getElementById("popupWindowInfoSpan").innerHTML="Enter new "+fields[fieldIndex];
    document.getElementById("accountSectionNewValueField").placeholder = "New "+fields[fieldIndex];
    if(fieldIndex == 4){
      wkrAddr = document.getElementById("accountSectionNewValueField");
      wkrAddr.addEventListener('blur', () => {expandCompanyTextArea(false, wkrAddr, '30px')}, true);
      wkrAddr.addEventListener('click', () => {expandCompanyTextArea(true, wkrAddr, '80px')}, true);
    }
  })
}

function popupLoadChangeAvatar(){
  document.getElementById("popupWindowInfoSpan").innerHTML="Select new avatar";
  loadHTMLChunk("../plain/accountSectionChangeAvatar.html", document.getElementById("popupWindowContent"), ()=>{
    document.getElementById("popupWindowSelectFile").addEventListener('change', () => {
      document.getElementById("checkMarkSelectedFile").innerHTML="✓";
      document.getElementById("checkMarkSelectedFile").style.color="#39ff14";
    });
  });
}

function toggleScreenVisibility(isLocked, winType){
  containerDiv = winType == 0? document.getElementById("accountSectionContainerDiv") :
    document.getElementById("searchSectionContainerDiv");
  containerDiv.style.pointerEvents = isLocked? "none": "";
  isLocked? containerDiv.classList.add("unselectable") : containerDiv.classList.remove("unselectable");
  containerDiv.style.opacity = isLocked? ".3": "";
}

function submitModifications(modType){
  modType == 0 ? submitAvatarChange(()=>{hidePopup(0)}) : submitFieldChange(modType-1, ()=>{hidePopup(0)});
}

function submitFieldChange(fieldType, propagatedCallback){
  url = 'http://127.0.0.1:5000/update_workerdetails';
  parameters = {actionType: fieldType, username: validateCurrentUser(),
    newValue: document.getElementById("accountSectionNewValueField").value};
  callback = (response) => {parseFieldChangeResponse(response, propagatedCallback)};
  postData(url, parameters, callback);
}

function parseFieldChangeResponse(response, propagatedCallback){
  if(response.success){
    propagatedCallback();
    beginWindowLoadingByType(3, null);
  }
    displayAlert(response.message);
}

function validateAccountSectionEntry(callMethodIfValid){
  var inputField = document.getElementById("accountSectionNewValueField");
  setCustomValidityAccountSectionError(inputField);
  if(!inputField.checkValidity()){
      inputField.reportValidity();
      return;
  }
callMethodIfValid();
}

function setCustomValidityAccountSectionError(object){
  var errorMessage="";
  if(object.validity.valueMissing){
      errorMessage = "Field cannot be empty.";
  }
  else if(object.validity.tooShort){
    objLength = object.tagName == "TEXTAREA" ? "10 and 100 characters." : "3 and 30 characters.";
    errorMessage = "Field must be between " + objLength;
  }
  else if(object.validity.patternMismatch){
    errorMessage = "Field may only contain letters or any of the following symbols: . - followed by letters"
  }
  object.setCustomValidity(errorMessage);
}

function hidePopup(winType){
  document.getElementById("tempPlainPopupWindow").remove();
  toggleScreenVisibility(false, winType);
}

function submitAvatarChange(propagatedCallback){
  url = 'http://127.0.0.1:5000/replace_avatar';
  parameters = new FormData();
  parameters.append('avatar', document.getElementById("popupWindowSelectFile").files[0]);
  parameters.append('username', validateCurrentUser());
  callback = (response) => {parseAvatarChangeResponse(response, propagatedCallback)};
  postBinaryData(url, parameters, callback);
}

function parseAvatarChangeResponse(response, propagatedCallback){
  if(response.success){
    propagatedCallback();
    sendAvatarFetchRequest(0);
    beginWindowLoadingByType(3, null);
  }
    displayAlert(response.message);
}



// SEARCH SECTION sourcecode

function toggleSearchSectionPopup(companyDiv){
  loadSearchPopupWindow(companyDiv);
}

function fetchCompaniesByKeyword(){
  url = 'http://127.0.0.1:5000/search_results';
  keyPhraseValue = document.getElementById("searchSectionFilterInput").value;
  parameters = {username: validateCurrentUser(),
    limit: document.getElementById("searchSectionFilterButton").value,
    keyPhrase: keyPhraseValue === null ? '' : keyPhraseValue};
  callback = (response) => {parseCompanyFetchResponse(response)};
  postData(url, parameters, callback);
}

function parseCompanyFetchResponse(response){
  if(response.success){
    let searchContainer = document.getElementsByClassName("searchSectionResults")[0];
    let lastElementAdded = searchContainer.lastChild;
    if(lastElementAdded != null){
      lastElementAdded.remove();
    }
    searchContainer.insertAdjacentHTML('afterbegin', '<div style="width: 100%;height: 100%"></div>');
    loadCompaniesIntoContainer(response.parameters.companies, searchContainer.lastChild, 1);
  }
  else{
    displayAlert(response.message);
  }
}

function loadMatchingCompanies(companiesArray, containerDiv, counter=0){
  if(companiesArray.length == 0){
    return;
  }
  if(counter==0){
    containerDiv.insertAdjacentHTML('beforeend', '<div class="matchingCompanyContainer">\
    <div class="matchingCompanySplitside"></div><div class="matchingCompanySplitside"></div></div>')
  }
  var lastAddedDiv = containerDiv.lastChild;
  loadHTMLChunk("../plain/matchingCompany.html", lastAddedDiv.children[counter], () => {
      enrolledItems = [document.getElementById("enrolledIdentifier"),
        document.getElementById("enrolledTitle"), document.getElementById("enrolledAvatar")]
      for(let i=0;i<3;i++){
        i==2 ? loadEnrolledCompanyAvatar(enrolledItems[i], companiesArray[0][i]) : enrolledItems[i].innerHTML = companiesArray[0][i];
        enrolledItems[i].removeAttribute('id');
      }
      loadMatchingCompanies(companiesArray.slice(1), containerDiv, (counter+1)%2);
  })
}

function loadSearchPopupWindow(parentDiv){
  let compIdentifier = parentDiv.querySelector('.accountSectionEnrolledCompanyIdentifierSpan').innerHTML;
  executeAfterLoading = ()=>{fetchCompanyDetails(compIdentifier)};
  document.getElementById("homeScreen").insertAdjacentHTML('afterbegin', '<div id="tempPlainPopupWindow"></div>');
  loadHTMLChunk("../plain/searchSectionPopupWindow.html", document.getElementById("tempPlainPopupWindow"), ()=>{
    executeAfterLoading();
  });
  toggleScreenVisibility(true, 1);
}

function fetchCompanyDetails(compId){
  sendDetailsLoadRequest(compId, 0);
  sendDetailsLoadRequest(compId, 1);
}

function sendDetailsLoadRequest(compId, requestType){
  url = requestType == 0? 'http://127.0.0.1:5000/load_company' : 'http://127.0.0.1:5000/load_CEO';
  parameters = {identifier: compId};
  callback = (response) => {parseDetailsFetchResponse(compId, response, requestType)};
  postData(url, parameters, callback);
}

function parseDetailsFetchResponse(compId, response, requestType){
  if(response.success){
    let callbackFunc = requestType==0? ()=>{loadCompanyDetails(compId, response.parameters.companyDetails)}:
      ()=>{loadCEODetails(response.parameters.CEODetails)}
    callbackFunc();
  }
  else{
    displayAlert(response.message);
  }
}

function loadCompanyDetails(compId, listOfAttributes){
  let spanLabels = document.getElementsByClassName("searchSectionCompanySpanLabel");
  spanLabels[0].insertAdjacentHTML("afterbegin", compId);
  for(let i=0;i<listOfAttributes.length-1;i++){
    spanLabels[i+1].insertAdjacentHTML("afterbegin",listOfAttributes[i]);
  }
  document.getElementById("popupCompanyAvatarImage").src = listOfAttributes[listOfAttributes.length-1] === null ? "../graphics/company.png":
    'data:image/png;base64,' + listOfAttributes[listOfAttributes.length-1];
  if(listOfAttributes[listOfAttributes.length-1] === null){
    document.getElementById("popupCompanyAvatarImage").style.filter = "invert(100%)";
  }
}

function loadCEODetails(listOfAttributes){
  let spanLabels = document.getElementsByClassName("searchSectionCEOSpanLabel");
  for(let i=0;i<listOfAttributes.length-1;i++){
    spanLabels[i].insertAdjacentHTML("afterbegin",listOfAttributes[i]);
  }
  document.getElementById("popupCEOAvatarImage").src = listOfAttributes[listOfAttributes.length-1] === null ? "../graphics/user.png":
    'data:image/png;base64,' + listOfAttributes[listOfAttributes.length-1];
  if(listOfAttributes[listOfAttributes.length-1] === null){
    document.getElementById("popupCEOAvatarImage").style.filter = "invert(100%)";
  }
}
