window.onload = bindEvents();

function bindEvents(){
  loadControlsBar(true);
  let currentUser = validateCurrentUser();
}
