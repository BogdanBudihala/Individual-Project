window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  loadSideBarButtons();
  loadCompanyInfo(loadSidebarAvatar);
  loadPanel(0);
}

function loadSideBarButtons(){
  // CHECK EMPLOYEE LEVEL
  url = 'http://127.0.0.1:5000/fetch_level';
  parameters = {identifier: validateCurrentComp(), username: validateCurrentUser()};
  callback = parseLevelFetchResponse;
  postData(url, parameters, callback);
}

function parseLevelFetchResponse(response){
  if(response.success){
    placeSideBarButtons(response.parameters.level);
  }
  else{
    alert(response.message);
  }
}

function placeSideBarButtons(level){
  let buttonLabels = ["Daily feed", "Clock in", "Staff", "Statistics", "Schedule", "Messaging", "Applications", "Broadcast",
  "Set schedule", "Update data", "Manage activity", "Manage structure"];
  let icons = ['feedIcon.png', 'clockIcon.png', 'coworkerIcon.png', 'statisticsIcon.png', 'scheduleIcon.png', 'messageIcon.png',
  'resumeIcon.png', 'broadcastIcon.png', 'schedule2Icon.png', 'dataIcon.png', 'activityIcon.png', 'structureIcon.png']
  let visibleButtons = level == 0 ? 6 : 12;
  let sidebar = document.getElementsByClassName("sideBarMiddle")[0];

  for(var i=0;i<visibleButtons;i++){
    sidebar.insertAdjacentHTML('beforeend', `<div class='sideBarButtonDiv'><img src=../graphics/`+icons[i]+`>
    <button class="sideBarButton" onMouseOver="toggleSlider(this, false)"
    onClick="loadPanel(`+i+`)">`+buttonLabels[i]+'</button></div>')
  }
}

function loadPanel(panelType){
  toggleSlider(document.getElementsByClassName("sideBarButton")[panelType], true);
  let currentWindow = document.getElementsByClassName("content")[0].firstElementChild;
  if(currentWindow != null){
    currentWindow.remove();
  }
  if(panelType == 6){
    validateCurrentComp();
    loadApplicationsTab();
  }
  else if(panelType == 0){
    validateCurrentComp();
    loadFeedTab();
  }
  return;
}

function loadSidebarAvatar(listOfAttributes){
  document.getElementById("sideBarCompanyAvatar").src = listOfAttributes[listOfAttributes.length-2] === null ? "../graphics/company.png":
    'data:image/png;base64,' + listOfAttributes[listOfAttributes.length-2];
  if(listOfAttributes[listOfAttributes.length-2] === null){
    document.getElementById("sideBarCompanyAvatar").style.filter = "invert(100%)";
  }
}

function loadCompanyInfo(callbackIfSuccessful){
  url = 'http://127.0.0.1:5000/load_company';
  parameters = {identifier: validateCurrentComp(), username: validateCurrentUser()};
  callback = (response) => {parseCompanyInfoResponse(response, callbackIfSuccessful)};
  postData(url, parameters, callback);
}

function parseCompanyInfoResponse(response, callback){
  if(response.success){
    callback(response.parameters.companyDetails);
  }
  else{
    alert(response.message);
  }
}

function toggleSlider(currentButton, isClick){
  let slider = document.getElementById("sideBarSlider");
  let buttons = Array.from(document.getElementsByClassName("sideBarButton"));
  slider.style.top = (buttons.indexOf(currentButton) == -1 ? 0 : buttons.indexOf(currentButton))*32+"px";
  slider.style.opacity = "1";
  if(isClick === true){
    slider.value = buttons.indexOf(currentButton) == -1 ? 0 : buttons.indexOf(currentButton);
  }
}

function resetSlider(){
  let slider = document.getElementById("sideBarSlider");
  slider.style.top = slider.value*32 + "px";
  slider.style.opacity = ".7";
}


// Applications tab

function loadApplicationsTab(){
  loadHTMLChunk("../plain/applicationsTab.html", document.getElementsByClassName("content")[0], () => {
    fetchPendingApplications();
  });
}

function fetchPendingApplications(){
  let url = 'http://127.0.0.1:5000/fetch_application';
  let parameters = {identifier: validateCurrentComp()};
  let callback = (response) => {parseApplicationsFetchResponse(response)};
  postData(url, parameters, callback);
}

function parseApplicationsFetchResponse(response){
  if(response.success){
    if(response.parameters.applicants.length === 0){
      document.getElementsByClassName("noPendingRequest")[0].style.display = 'block';
    }
    else{
      loadApplicationsIntoContainer(response.parameters.applicants);
    }
  }
  else{
    alert(response.message);
  }
}

function loadApplicationsIntoContainer(applicants){
  if(applicants.length === 0){
    return;
  }
  let lastAddedDiv = document.createElement("div");

  loadHTMLChunk("../plain/pendingRequest.html", lastAddedDiv, () => {
      let fields = lastAddedDiv.querySelectorAll(".pendingRequestDataContent");
      let avatarField = lastAddedDiv.querySelector(".pendingRequestAvatar");
      for(let i=0;i<3;i++){
          fields[i].innerHTML = applicants[0][i]
      }
      avatarField.src = applicants[0][3] != null ? 'data:image/png;base64,' + applicants[0][3] : '../graphics/user.png'
      if(applicants[0][3] === null){
        avatarField.style.filter = 'invert(100%)';
      }
      document.getElementsByClassName("pendingHolder")[0].appendChild(lastAddedDiv.firstElementChild);
      loadApplicationsIntoContainer(applicants.slice(1));
  })
}

function toggleRequest(object){
  let currentValue = object.value;
  object.value = currentValue === undefined ? 1 : undefined;
  object.style.background = currentValue === undefined ? 'radial-gradient(rgba(18, 28, 37, .7), rgba(13, 75, 134, .6))' : 'transparent';
}

function toggleAll(){
  let button = document.getElementsByClassName("pendingButtonLeft")[0];
  let turnOff = button.value == 1;

  let pendingRequests = Array.from(document.getElementsByClassName("pendingRequest"));
  pendingRequests.forEach((item, i) => {
    item.value = turnOff === false ? 1 : undefined;
    item.style.background = turnOff === false ? 'radial-gradient(rgba(18, 28, 37, .7), rgba(13, 75, 134, .6))' : 'transparent';
  });

  button.value = turnOff === false ? 1 : undefined;
  button.innerHTML = turnOff === false ? '<span>☑</span><span>Unselect all</span>' :
  '<span>☐</span><span>Select all</span>';
}

function handlePendingRequest(actionType){
  let selectedRequests = Array.from(document.getElementsByClassName("pendingRequest")).filter(request => request.value == 1);
  if(selectedRequests.length < 1){
    return;
  }
  selectedRequests.forEach((item, i) => {
    sendApplicationHandleRequest(item.querySelector(".pendingRequestDataContent").innerHTML, actionType);
    item.style.height = "0";
    setTimeout(()=>{
      item.remove();
      if(document.getElementsByClassName("pendingHolder")[0].children.length < 2){
        document.getElementsByClassName("noPendingRequest")[0].style.display = 'block';
      }
    }, 175);
  });
}

function sendApplicationHandleRequest(user, actionType){
  let url = 'http://127.0.0.1:5000/handle_application';
  let parameters = {identifier: validateCurrentComp(), username: user, operationType: actionType};
  let callback = (response) => {parseApplicationsHandleResponse(response)};
  postData(url, parameters, callback);
}

function parseApplicationsHandleResponse(response){
  if(!response.success){
    alert(response.message);
  }
}


// Feed tab


function loadFeedTab(){
  loadHTMLChunk("../plain/feedTab.html", document.getElementsByClassName("content")[0], () => {
    fetchFeed();
    attachOnEnterPost(document.getElementsByClassName("feedContentUpper")[0].firstElementChild);
  });
}

function fetchFeed(){
  let url = 'http://127.0.0.1:5000/fetch_feed';
  let parameters = {identifier: validateCurrentComp()};
  let callback = (response) => {parseFeedFetchResponse(response)};
  postData(url, parameters, callback);
}

function parseFeedFetchResponse(response){
  if(response.success){
    if(response.parameters.feed.length === 0){
      document.getElementsByClassName("noFeedContent")[0].style.display = 'flex';
    }
    else{
      loadFeedIntoContainer(response.parameters.feed);
    }
  }
  else{
    alert(response.message);
  }
}

function loadFeedIntoContainer(feed){
  if(feed.length === 0){
    return;
  }
  let lastAddedDiv = document.createElement("div");

  loadHTMLChunk("../plain/feedPost.html", lastAddedDiv, () => {
      let fields = lastAddedDiv.querySelectorAll(".feedDataContent");
      let avatarField = lastAddedDiv.querySelector(".feedPostedAvatar");
      for(let i=0;i<3;i++){
          fields[i].innerHTML = feed[0][i]
      }
      avatarField.src = feed[0][3] != null ? 'data:image/png;base64,' + feed[0][3] : '../graphics/user.png'
      if(feed[0][3] === null){
        avatarField.style.filter = 'invert(100%)';
      }
      document.getElementsByClassName("feedContentLower")[0].appendChild(lastAddedDiv.firstElementChild);
      loadFeedIntoContainer(feed.slice(1));
  })
}

function attachOnEnterPost(entry){
  entry.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      if(entry.checkValidity()){
        submitPostFeed();
      }
    }
  });
}

function submitPostFeed(){
  let url = 'http://127.0.0.1:5000/post_feed';
  let parameters = {identifier: validateCurrentComp(), username: validateCurrentUser(),
    text: document.getElementsByClassName("feedContentUpper")[0].firstElementChild.value};
  let callback = (response) => {parseFeedPostResponse(response)};
  postData(url, parameters, callback);
}

function parseFeedPostResponse(response){
  if(response.success){
    //let textArea = document.getElementsByClassName("feedContentUpper")[0].firstElementChild
    //textArea.value = '';
    //textArea.blur();
    loadFeedTab();
  }
  else{
    alert(response.message);
  }
}
