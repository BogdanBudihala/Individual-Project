from db_access import DBManager

def attemptLogin(username):
    __linker = DBManager()
    try:
        __fetchedPass = __linker.fetchPassword(username)
        __workerProfile = __linker.fetchWorkerProfile(username)
        return {'success': True, 'message': None,
                'parameters': {'username': username, 'password': __fetchedPass},
                'employment': {'hasWorkerProfile': __workerProfile}
                }
    except Exception as db_except:
        if '0,' in str(db_except):
            return {'success': False, 'message': "Username or password is not correct.", 'parameters': None}
        else:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptRegister(username, password, email):
    __linker = DBManager()
    try:
        __linker.addAccount(username, password, email)
        return {'success': True, 'message': "Account has been registered successfully.", 'parameters': None}
    except Exception as db_except:
        if 'constraint "user_taken"' in str(db_except):
            return {'success': False, 'message': "Username has already been taken.", 'parameters': None}
        elif 'constraint "email_taken"' in str(db_except):
            return {'success': False, 'message': "Email address has already been taken.", 'parameters': None}
        else:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptReset(username, email):
    pass

def attemptRegisterCompany(identifier, pairedAcc, title, location, desc):
    __linker = DBManager()
    try:
        __linker.addCompany(identifier, pairedAcc, title, location, desc)
        return {'success': True, 'message': "Company has been registered successfully.", 'parameters': None}
    except Exception as db_except:
        if 'constraint "id_taken"' in str(db_except):
            return {'success': False, 'message': "Company identifier has already been taken.", 'parameters': None}
        else:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptRegisterWorkerProfile(pairedAcc, firstName, lastName, city, country, address):
    __linker = DBManager()
    try:
        __linker.addWorkerProfile(pairedAcc, firstName, lastName, city, country, address)
        return {'success': True, 'message': "Worker profile has been registered successfully.", 'parameters': None}
    except Exception as db_except:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptAddEmployee(pairedAcc, pairedComp):
    __linker = DBManager()
    try:
        __linker.addEmployee(pairedAcc, pairedComp)
        return {'success': True, 'message': "Employee has been registered successfully.", 'parameters': None}
    except Exception as db_except:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptLoginEmployee(pairedAcc, pairedComp):
    __linker = DBManager()
    try:
        __fetchedCompId = __linker.loginEmployee(pairedAcc, pairedComp)
        return {'success': True, 'message': None, 'parameters': {'identifier': __fetchedCompId}}
    except Exception as db_except:
        if '0,' in str(db_except):
            return {'success': False, 'message': "Unable to connect to company: Company identifier is not valid.",
                    'parameters': None}
        elif '1,' in str(db_except):
            return {'success': False, 'message': "Unable to connect to company: User is not an active employee of the company.",
                    'parameters': None}
        else:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

def attemptGatherWorkerDetails(username):
    __linker = DBManager()
    try:
        workerDetails = __linker.getWorkerDetails(username)
        return {'success': True, 'message': None, 'parameters': {'firstName': workerDetails[0], 'lastName': workerDetails[1],
                'city': workerDetails[2], 'country': workerDetails[3], 'address': workerDetails[4]}
        }
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker

