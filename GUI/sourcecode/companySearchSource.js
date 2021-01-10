window.onload = bindEvents();


function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
  beginWindowLoadingByType(0, loadLastConnectedCompany);
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
   'http://127.0.0.1:5000/worker_details', 'http://127.0.0.1:5000/account_details', 'http://127.0.0.1:5000/account_settings']
  callbackFuncs = [(response) => {loadHomeWindow(response, propagatedCallback)}, loadCompanyWindow, loadSearchWindow,
    loadAccountWindow, loadSettingsWindow];
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
    document.getElementById("greetingSpan").innerHTML = "Hello, "+workerDetails.firstName;
    if(propagatedCallback != null){
        propagatedCallback();
    }
    attachOnEnterSubmit(document.getElementById("homeSectionCompanyIdentifier"),
      document.getElementsByClassName("homeSectionConnectButton")[0]);
  });
}

function loadSearchWindow(workerDetails){
  loadHTMLChunk("../plain/searchSection.html", document.getElementById("homeScreen"), () => {
    fetchCompaniesByKeyword();
    attachOnEnterSubmit(document.getElementById("searchSectionFilterInput"), document.getElementById("searchSectionSearchButton"));
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
      let dotsCount=1;
      setInterval(() => {
        displayAlert("Connecting"+".".repeat(dotsCount));
        dotsCount+=1;
      }, 333);
      document.body.style.cursor = "progress";
      saveCompanyIdentifier(document.getElementById("homeSectionCompanyIdentifier").value);
      setInterval(() => {
        redirectPage("../templates/employeeLogged.html");
      }, 1000);
    }
    else{
      displayAlert("Unable to connect to company<br>"+response.message);
    }
}

function saveCompanyIdentifier(identifier){
  const { ipcRenderer } = require('electron')
  ipcRenderer.send('saveIdentifier', identifier);
}

function loadLastConnectedCompany(){
  let url = 'http://127.0.0.1:5000/last_connected';
  let parameters = {username: validateCurrentUser()};
  let callback = (response) => {parseLoadLastConnectedResponse(response)};
  postData(url, parameters, callback);
}

function parseLoadLastConnectedResponse(response){
  if(response.success && response.parameters.identifier != null){
    document.getElementById("homeSectionCompanyIdentifier").value = response.parameters.identifier;
  }
  else if(!response.success){
    displayAlert("An error occurred: <br>"+response.message);
  }
}

// COMPANY SECTION sourcecode


function loadCompanyWindow(workerDetails){
  loadHTMLChunk("../plain/companySection.html", document.getElementById("homeScreen"), () => {
    scrollCompanyContent(2);
  });
}

function scrollCompanyContent(windowType){
  let windowContents = Array.from(document.getElementsByClassName("companySectionContent"));
  let newPositions = windowType == 0 ? ["-100%", "100%", "0%"] : windowType == 1 ? ["-100%", "0%", "100%"] : ["0%", "-100%", "100%"];
  document.documentElement.style.setProperty('--companyBeforeWidth', windowType == 2? "100%" : "0%");
  windowContents.forEach((item, i) => {
    item.style.left = newPositions[i];
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
    document.getElementById("greetingSpan").innerHTML = "Hello, "+accountInfo.firstName;
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
    loadNoResultsURL = winType == 0? "../plain/noEnrolledCompany.html" : "../plain/noResultsSearch.html";
    callback = winType == 0? () => {} : () => {
      document.getElementById("innerNoMatchSpan").innerHTML = document.getElementById("searchSectionFilterInput").value}
    loadHTMLChunk(loadNoResultsURL, containerDiv, callback);
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
    document.getElementsByClassName("container")[0].removeEventListener('click', hideChangeBoxOnClickOutside, true);
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
  document.getElementsByClassName("container")[0].addEventListener('click', hideChangeBoxOnClickOutside, true);
  cssTopValue = actionType < 6 ? window.event.pageY-$('#accountSectionContainerDiv').offset().top :
    event.pageY - $(parentElement).offset().top;
  cssLeftValue = actionType < 6 ? window.event.pageX-$('#accountSectionContainerDiv').offset().left :
    event.pageX - $(parentElement).offset().left;
  $('#accountSectionChangeBox').css('top', cssTopValue);
  $('#accountSectionChangeBox').css('left', cssLeftValue);
}

function hideChangeBoxOnClickOutside(e){
  if(!document.getElementById("accountSectionChangeBox").contains(e.target)){
    toggleAccountSectionChangeBox(null, null);
  }
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
  let containerIds = ["accountSectionNewValueFirstNameContainer", "accountSectionNewValueLastNameContainer",
    "accountSectionNewValueCityContainer", "accountSectionNewValueCountryContainer", "accountSectionNewValueAddressContainer"]
  fields = Array.from(document.getElementsByClassName("accountSectionField")).map(object => object.innerHTML.toLowerCase());
  htmlLoadPath = fieldIndex == 4? "../plain/accountSectionChangeAddress.html" : "../plain/accountSectionChangeField.html";
  loadHTMLChunk(htmlLoadPath, document.getElementById("popupWindowContent"), () => {
    document.getElementById("popupWindowInfoSpan").innerHTML="Enter new "+fields[fieldIndex];
    document.getElementById("accountSectionNewValueField").placeholder = "New "+fields[fieldIndex];
    document.getElementById("accountSectionNewValuePlainContainer").id=containerIds[fieldIndex];
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
  if(modType == 0 && document.getElementById("popupWindowSelectFile").files[0] != null &&
    !document.getElementById("popupWindowSelectFile").files[0]['type'].includes('image')){
    displayAlert("File selected is not a valid image.");
    hidePopup(0);
  }
  else{
    modType == 0 ? submitAvatarChange(()=>{hidePopup(0)}) : submitFieldChange(modType-1, ()=>{hidePopup(0)});
  }
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
    limit: parseInt(document.getElementById("searchSectionFilterButton").value)*2,
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
  parameters = requestType == 0 ? {identifier: compId, username: validateCurrentUser()} : {identifier: compId};
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
  for(let i=0;i<listOfAttributes.length-2;i++){
    spanLabels[i+1].insertAdjacentHTML("afterbegin",listOfAttributes[i]);
  }
  document.getElementById("popupCompanyAvatarImage").src = listOfAttributes[listOfAttributes.length-2] === null ? "../graphics/company.png":
    'data:image/png;base64,' + listOfAttributes[listOfAttributes.length-2];
  if(listOfAttributes[listOfAttributes.length-2] === null){
    document.getElementById("popupCompanyAvatarImage").style.filter = "invert(100%)";
  }
  if(listOfAttributes[listOfAttributes.length-1] === 0){
    document.getElementsByClassName("popupWindowSubmitButton")[1].classList.add('lockedElement');
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

function displayFilterPopup(){
  document.getElementById("searchSectionContent").insertAdjacentHTML('afterbegin', "<div id='filterPopupHolder'></div>");
  loadHTMLChunk("../plain/searchSectionFilterPopup.html", document.getElementById("filterPopupHolder"), ()=>{
    toggleCompanyHolderVisibility(false);
    updateRowCounter(2);
  });
}

function toggleCompanyHolderVisibility(isActive){
  if(isActive){
    document.getElementsByClassName("searchSectionResults")[0].classList.remove("lockedElement");
    document.getElementsByClassName("searchSectionResults")[0].classList.remove("unselectable");
    document.getElementsByClassName("container")[0].removeEventListener('click', searchSectionEventListenerHandler, true);
  }
  else{
    document.getElementsByClassName("searchSectionResults")[0].classList.add("lockedElement");
    document.getElementsByClassName("searchSectionResults")[0].classList.add("unselectable");
    document.getElementsByClassName("container")[0].addEventListener('click', searchSectionEventListenerHandler, true);
  }
}

function searchSectionEventListenerHandler(e){
  let popupDiv = document.getElementsByClassName('searchSectionFilterPopup')[0];
  if(!popupDiv) return;
  if (!popupDiv.contains(e.target)){
    toggleCompanyHolderVisibility(true);
    document.getElementById("filterPopupHolder").remove();
  }
}

function updateRowCounter(actionType){
  let rowValues = [5, 10, 20, 50, 100, 250, 500];
  let counterArray = document.getElementsByClassName("searchSectionFilterRowCounter");
  let valueHolder = document.getElementById("searchSectionFilterButton");
  let intValue = parseInt(valueHolder.value);
  let nextValueIndex = actionType == 0? rowValues.indexOf(intValue)-1 : actionType == 1?
    rowValues.indexOf(intValue)+1 : rowValues.indexOf(intValue);

  if(nextValueIndex == -1 || nextValueIndex == rowValues.length){
    return
  }

  for(let i=0; i<counterArray.length; i++){
    counterArray[i].innerHTML = rowValues[nextValueIndex];
  }
  valueHolder.value = rowValues[nextValueIndex];

  document.getElementById("searchSectionArrowButtonLeft").disabled = nextValueIndex == 0;
  document.getElementById("searchSectionArrowButtonRight").disabled = nextValueIndex == rowValues.length-1;
}

function forwardApplication(object){
  let identifier = object.querySelector('.popupUpperSpanHolder .searchSectionCompanySpanLabel').innerHTML;
  let url = 'http://127.0.0.1:5000/application';
  let parameters = {identifier: identifier, username: validateCurrentUser()};
  let callback = parseApplicationResponse;
  postData(url, parameters, callback);
}

function parseApplicationResponse(response){
  displayAlert(response.message);
  hidePopup(1);
}



// SETTINGS SECTION sourcecode


function loadSettingsWindow(accountSettings){
  loadHTMLChunk("../plain/settingsSection.html", document.getElementById("homeScreen"), () => {
    let accountSettingsObjectsArray = document.getElementsByClassName("settingsOptionTogglerContainerAccount");
    accountSettings.accountSettings.forEach((setting, i) => {
      toggleSettingsOption(accountSettingsObjectsArray[setting-1], false, false);
    });
    if(accountSettings.companies.length == 0){
      document.getElementsByClassName("settingsCompanyDropdown")[0].insertAdjacentHTML('beforeend',
        '<span class="settingsNoCompanySpan">No registered company</span>');
      document.getElementsByClassName("settingsCompanyTab")[0].classList.add("lockedElement");
    }else{
      loadRegisteredCompaniesIntoContainer(accountSettings.companies);
    }

  });
}

function loadRegisteredCompaniesIntoContainer(companies){
  companies.forEach((company, i) => {
    let companiesContainer = document.getElementsByClassName("settingsRegisteredCompaniesContainer")[0];
    companiesContainer.insertAdjacentHTML('beforeend',"<div></div>");
    let lastAdded = companiesContainer.lastElementChild;
    loadHTMLChunk("../plain/settingsSectionRegisteredCompany.html", lastAdded, ()=>{
      lastAdded.querySelector(".settingsRegisteredCompanyAvatarImage").src = company[1] === null? "../graphics/company.png":
        'data:image/png;base64,' + company[1];
      if(company[1] === null){
        lastAdded.querySelector(".settingsRegisteredCompanyAvatarImage").style.filter="invert(100%)";
      }
      lastAdded.querySelector(".settingsRegisteredCompanyIdentifierSpan").innerHTML = company[0];
      if(i==0){
        appendChildDropdown(lastAdded.firstElementChild);
      }
      lastAdded.addEventListener('click',  ()=>{appendChildDropdown(lastAdded.firstElementChild);
        companiesContainer.style.display="none";
        document.getElementsByClassName("settingsCompanyTab")[0].style.transform = "translatex(100%)";
        setTimeout(() => {document.getElementsByClassName("settingsCompanyTab")[0].style.transform = "translatex(0)";}, 200)
        requestCompanySettings(document.getElementsByClassName("settingsCompanyDropdown")[0].value);
      });
    })
  });
}

function appendChildDropdown(childToAdd){
  let clone = childToAdd.cloneNode(true);
  let dropdownDiv = document.getElementsByClassName("settingsCompanyDropdown")[0];
  if(dropdownDiv.children.length > 1){
    dropdownDiv.removeChild(dropdownDiv.lastElementChild);
  }

  clone.style.borderTopLeftRadius = "5px";
  dropdownDiv.appendChild(clone);
  dropdownDiv.value = clone.querySelector(".settingsRegisteredCompanyIdentifierSpan")
    .innerHTML;

  requestCompanySettings(dropdownDiv.value);
}

function requestCompanySettings(companyId){
  url = 'http://127.0.0.1:5000/company_settings';
  parameters = {identifier: companyId};
  callback = (response) => {parseCompanySettingsFetchResponse(response)};
  postData(url, parameters, callback);
}

function parseCompanySettingsFetchResponse(response){
  let settingsObjectsArray = document.getElementsByClassName("settingsOptionTogglerContainer");
  for(let i=3;i<6;i++){
    toggleSettingsOption(settingsObjectsArray[i], true, false);
  }
  response.parameters.companySettings.forEach((setting, i) => {
    toggleSettingsOption(settingsObjectsArray[setting-1], false, false);
  });
}

function activateTabSliderTransition(targetPosInPercentage){
  let movementTab = document.getElementById("settingsSectionTabSlider");
  if(!movementTab.value){
    movementTab.value = "0%";
  }
  movementTab.style.left = targetPosInPercentage;
}

function changeSettingsWindow(winType){
  document.getElementById("settingsSectionTabSlider").value = winType == 0? "0%" : "50%";
  document.getElementsByClassName("settingsSectionLowerArea")[0].style.left = winType == 0? "0%" : "-100%";
  document.getElementsByClassName("settingsSectionLowerArea")[1].style.left = winType == 0? "100%" : "0%";
}

function toggleSettingsOption(parent, boolean, updateBool = true){
  parent.value = boolean;
  parent.firstElementChild.style.left = boolean? "0%" : "50%";
  parent.firstElementChild.style.background = boolean? "green" : "red";
  if(updateBool){
    let containerArray = Array.from(document.getElementsByClassName("settingsOptionTogglerContainer"));
    sendSettingsUpdateRequest(containerArray.indexOf(parent)+1, parent.value);
  }
}

function sendSettingsUpdateRequest(settingId, operationBool){
  let url = 'http://127.0.0.1:5000/change_settings';
  let pairedKey = settingId < 4? validateCurrentUser() : document.getElementsByClassName("settingsCompanyDropdown")[0].value;
  let parameters = {pairedKey: pairedKey, settingId: settingId, operation: operationBool};
  postData(url, parameters, parseSettingsUpdateResponse);
}

function parseSettingsUpdateResponse(response){
  if(!response.success){
    displayAlert(response.message);
  }
}
