function loadControlsBar(hasLogOut){
  document.getElementsByTagName("BODY")[0].insertAdjacentHTML('afterbegin', '<div id="tempPlainDiv"></div>');
  relativeTo = document.getElementById("tempPlainDiv");
  callback= () => {
    $(document.body).on('click',"#controlsCloseWindow", closeCurrentWindow);
    $(document.body).on('click',"#controlsMinimizeWindow", minimizeCurrentWindow);
    if(hasLogOut){
      $(document.body).on('click',"#controlsLogOut", displayPromptLogOut);
    }
  }
  callMethod = hasLogOut ? () => {loadHTMLChunk("../plain/controlBarWithLog.html", relativeTo, callback)}:
    () => {loadHTMLChunk("../plain/controlBarNoLog.html", relativeTo, callback)};
  callMethod();
}

function closeCurrentWindow(){
  const { remote } = require('electron')
  remote.BrowserWindow.getFocusedWindow().close();
}

function minimizeCurrentWindow(){
  const { remote } = require('electron')
  remote.BrowserWindow.getFocusedWindow().minimize();
}

function displayPromptLogOut(){
  if(document.getElementById("tempPlainDivAlert") != null){
    return;
  }
  document.getElementsByTagName("BODY")[0].insertAdjacentHTML('afterbegin', '<div id="tempPlainDivAlert"></div>');
  loadHTMLChunk("../plain/controlBarAlertPopup.html", document.getElementById("tempPlainDivAlert"), () => {
    $(document.body).on('click',"#controlsBarPromptCancelButton", vanishPromptLogOut);
    $(document.body).on('click',"#controlsBarPromptLogOutButton", unauthenticateCurrentUser);
    $(document.body).on('mouseover',"#controlsBarPromptCancelButton", () => {
      $('#controlsBarSlider').css('left', '0');
    });
    $(document.body).on('mouseover',"#controlsBarPromptLogOutButton", () => {
      $('#controlsBarSlider').css('left', '50%');
    });
    toggleContainerVisibility(true)
  });
}

function toggleContainerVisibility(isLocked){
  containerDiv = document.getElementsByClassName("container")[0];
  containerDiv.style.pointerEvents = isLocked? "none": "";
  isLocked? containerDiv.classList.add("unselectable") : containerDiv.classList.remove("unselectable");
  containerDiv.style.opacity = isLocked? ".3": "";
}

function vanishPromptLogOut(){
  tempPlainDivAlert = document.getElementById("tempPlainDivAlert");
  if(tempPlainDivAlert != null){
    tempPlainDivAlert.remove();
  }
  toggleContainerVisibility(false)
}

function unauthenticateCurrentUser(){
  const { ipcRenderer } = require('electron');
  ipcRenderer.send('allowUnauthentication');
}

function loadHTMLChunk(filePath, relativeElement, callback){
  $(relativeElement).load(filePath, callback);
}
