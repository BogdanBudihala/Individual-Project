from flask import Flask, request, jsonify, send_file
from db_response import *

app = Flask(__name__)


@app.route("/login_form", methods=['POST'])
def forwardLogin():
    dictParameters = request.get_json()
    return jsonify(attemptLogin(dictParameters['username']))


@app.route("/register_form", methods=['POST'])
def forwardRegister():
    dictParameters = request.get_json()
    return jsonify(attemptRegister(dictParameters['username'], dictParameters['password'], dictParameters['email']))


@app.route("/reset_form", methods=['POST'])
def forwardReset():
    # TO BE IMPLEMENTED
    dictParameters = request.get_json()
    return jsonify(attemptReset(dictParameters['username'], dictParameters['email']))


@app.route("/register_company", methods=['POST'])
def forwardRegisterCompany():
    dictParameters = request.get_json()
    return jsonify(attemptRegisterCompany(dictParameters['id'], dictParameters['username'], dictParameters['title'],
                                          dictParameters['location'], dictParameters['description']))


@app.route("/register_workerprofile", methods=['POST'])
def forwardRegisterEmployeeMandatory():
    dictParameters = request.get_json()
    return jsonify(attemptRegisterWorkerProfile(dictParameters['username'], dictParameters['firstName'],
                                                dictParameters['lastName'], dictParameters['city'],
                                                dictParameters['country'], dictParameters['address']))


@app.route("/add_employee", methods=['POST'])
def forwardAddEmployee():
    dictParameters = request.get_json()
    return jsonify(attemptAddEmployee(dictParameters['username'], dictParameters['identifier']))


@app.route("/login_employee", methods=['POST'])
def forwardLoginEmployee():
    dictParameters = request.get_json()
    return jsonify(attemptLoginEmployee(dictParameters['username'], dictParameters['identifier']))


@app.route("/worker_details", methods=['POST'])
def forwardWorkerDetailsRequest():
    dictParameters = request.get_json()
    return jsonify(attemptGatherWorkerDetails(dictParameters['username']))


@app.route("/account_details", methods=['POST'])
def forwardAccountDetailsRequest():
    dictParameters = request.get_json()
    return jsonify(attemptGatherAccountDetails(dictParameters['username']))


@app.route("/replace_avatar", methods=['POST'])
def forwardReplaceAvatar():
    # NEEDS FILE VALIDATION!
    file = request.files.get('avatar')
    username = request.form.get('username')
    return jsonify(attemptReplaceAvatar(username, file))


@app.route("/load_avatar", methods=['POST'])
def forwardLoadAvatar():
    dictParameters = request.get_json()
    return jsonify(attemptLoadAvatar(dictParameters['username']))


@app.route("/update_workerdetails", methods=['POST'])
def forwardUpdateWorkerDetails():
    dictParameters = request.get_json()
    return jsonify(attemptUpdateWorkerDetails(dictParameters['username'], dictParameters['actionType'],
                                              dictParameters['newValue']))


@app.route("/search_results", methods=['POST'])
def forwardLoadSearchResults():
    dictParameters = request.get_json()
    return jsonify(attemptLoadSearchResults(dictParameters['username'], dictParameters['keyPhrase'],
                                            dictParameters['limit']))

@app.route("/load_company", methods=['POST'])
def forwardLoadCompany():
    dictParameters = request.get_json()
    return jsonify(attemptLoadCompany(dictParameters['identifier'], dictParameters['username']))

@app.route("/load_CEO", methods=['POST'])
def forwardLoadCEO():
    dictParameters = request.get_json()
    return jsonify(attemptLoadCEO(dictParameters['identifier']))

@app.route("/account_settings", methods=['POST'])
def forwardLoadSettings():
    dictParameters = request.get_json()
    return jsonify(attemptLoadSettings(dictParameters['username']))

@app.route("/change_settings", methods=['POST'])
def forwardChangeSettings():
    dictParameters = request.get_json()
    return jsonify(attemptChangeSettings(dictParameters['pairedKey'], dictParameters['settingId'],
                                         dictParameters['operation']))

@app.route("/company_settings", methods=['POST'])
def forwardLoadCompanySettings():
    dictParameters = request.get_json()
    return jsonify(attemptLoadCompanySettings(dictParameters['identifier']))

@app.route("/last_connected", methods=['POST'])
def forwardLoadLastConnected():
    dictParameters = request.get_json()
    return jsonify(attemptLoadLastConnected(dictParameters['username']))

@app.route("/application", methods=['POST'])
def forwardApplication():
    dictParameters = request.get_json()
    return jsonify(attemptForwardApplication(dictParameters['identifier'], dictParameters['username']))

@app.route("/handle_application", methods=['POST'])
def forwardHandleApplication():
    dictParameters = request.get_json()
    return jsonify(attemptHandleApplication(dictParameters['identifier'], dictParameters['username'],
                                             dictParameters['operationType']))

@app.route("/fetch_application", methods=['POST'])
def forwardFetchApplication():
    dictParameters = request.get_json()
    return jsonify(attemptFetchApplication(dictParameters['identifier']))

@app.route("/post_feed", methods=['POST'])
def forwardPostFeed():
    dictParameters = request.get_json()
    return jsonify(attemptPostFeed(dictParameters['identifier'], dictParameters['username'], dictParameters['text']))

@app.route("/fetch_feed", methods=['POST'])
def forwardFetchFeed():
    dictParameters = request.get_json()
    return jsonify(attemptFetchFeed(dictParameters['identifier']))

@app.route("/fetch_level", methods=['POST'])
def forwardFetchLevel():
    dictParameters = request.get_json()
    return jsonify(attemptFetchLevel(dictParameters['identifier'], dictParameters['username']))

def main():
    app.run(debug=True, port=5000)


if __name__ == "__main__":
    main()
