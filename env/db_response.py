from db_access import DBManager
from base64 import b64encode
from re import sub, search


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
            return {'success': False,
                    'message': "Unable to connect to company: User is not an active employee of the company.",
                    'parameters': None}
        else:
            return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptGatherWorkerDetails(username):
    __linker = DBManager()
    try:
        workerDetails = __linker.getWorkerDetails(username)
        return {'success': True, 'message': None,
                'parameters': {'firstName': workerDetails[0], 'lastName': workerDetails[1],
                               'city': workerDetails[2], 'country': workerDetails[3], 'address': workerDetails[4]}
                }
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptGatherAccountDetails(username):
    __linker = DBManager()
    try:
        workerDetails = __linker.getWorkerDetails(username)
        email = __linker.getAccountEmailAddress(username)
        companyInfo = __linker.getEnrolledCompanies(username)
        for index in range(len(companyInfo)):
            companyInfo[index] = (companyInfo[index][0], companyInfo[index][1],
                                  _encode64DecodeUTF8Image(companyInfo[index][2]))

        return {'success': True, 'message': None,
                'parameters': {'firstName': workerDetails[0], 'lastName': workerDetails[1], 'city': workerDetails[2],
                               'country': workerDetails[3], 'address': workerDetails[4], 'email': email,
                               'companies': companyInfo}
                }
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptReplaceAvatar(username, avatar):
    __linker = DBManager()
    try:
        hasAvatar = __linker.fetchUserAvatar(username)
        if hasAvatar is not None:
            __linker.updateUserAvatar(username, avatar) if avatar is not None else __linker.removeUserAvatar(username)
        else:
            __linker.addUserAvatar(username, avatar) if avatar is not None else None
        return {'success': True, 'message': "Avatar updated successfully.", 'parameters': None}
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptLoadAvatar(username):
    __linker = DBManager()
    try:
        imageAsString = _encode64DecodeUTF8Image(__linker.fetchUserAvatar(username))
        return {'success': True, 'message': "Avatar loaded successfully.", 'parameters':
            {'avatar': imageAsString}}
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptUpdateWorkerDetails(username, actionType, newValue):
    columnIdentifier = ('First Name', 'Last Name', 'City', 'Country', 'Address')
    if actionType not in range(0, len(columnIdentifier)):
        return {'succes': False, 'message': f'''Invalid action type supplied. Action types are indexed from 0 to
                    {len(columnIdentifier) - 1}.''', 'parameters': None}
    __linker = DBManager()
    try:
        __linker.updateWorkerProfile(username, actionType, newValue)
        return {'success': True, 'message': f"{columnIdentifier[actionType]} updated successfully.", 'parameters': None}
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptLoadSearchResults(username, keyPhrase, limit):
    __linker = DBManager()
    if not search("^[1-9][0-9]{0,4}$|^10000$", str(limit)):
        return {'success': False,
                'message': '''Invalid limit parameter supplied. Parameter must be integer between [1, 10000].''',
                'parameters': None}
    if not isinstance(keyPhrase, str):
        return {'success': False,
                'message': "Invalid key phrase parameter supplied. Parameter must be string.",
                'parameters': None}
    try:
        fetchedCompanies = __linker.getCompaniesMatchingKeyPhrase(username, _sanitizeKeyPhrase(keyPhrase), int(limit))
        for index in range(len(fetchedCompanies)):
            fetchedCompanies[index] = (fetchedCompanies[index][0], fetchedCompanies[index][1],
                                       _encode64DecodeUTF8Image(fetchedCompanies[index][2]))
        return {'success': True, 'message': f"Successfully loaded {len(fetchedCompanies)} results.", 'parameters':
            {'companies': fetchedCompanies}}
    except Exception as db_except:
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptLoadCompany(compID):
    __linker = DBManager()
    try:
        fetchedCompany = __linker.fetchCompanyDetails(compID)
        fetchedCompany = (fetchedCompany[0], fetchedCompany[1], fetchedCompany[2], _encode64DecodeUTF8Image(
            fetchedCompany[3]))
        return {'success': True, 'message': "Company loaded successfully.", 'parameters':
            {'companyDetails': fetchedCompany}}
    except Exception as db_except:
        if '0,' in str(db_except):
            return {'success': False, 'message': "Unable to obtain company information: Company identifier not valid.",
                    'parameters': None}
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def attemptLoadCEO(compID):
    __linker = DBManager()
    try:
        fetchedCEO = __linker.fetchCEODetails(compID)
        fetchedCEO = (fetchedCEO[0], fetchedCEO[1], _encode64DecodeUTF8Image(fetchedCEO[2]))
        return {'success': True, 'message': "CEO loaded successfully.", 'parameters':
            {'CEODetails': fetchedCEO}}
    except Exception as db_except:
        if '0,' in str(db_except):
            return {'success': False, 'message': "Unable to obtain CEO information: No CEO associated to this company.",
                    'parameters': None}
        return {'success': False, 'message': str(db_except), 'parameters': None}
    finally:
        del __linker


def _encode64DecodeUTF8Image(binaryData):
    return b64encode(binaryData).decode('utf-8') if binaryData is not None else None


def _sanitizeKeyPhrase(keyPhrase):
    # 1st sub - Removes any symbol that is not alphanumerical or space and replaces it with space
    # Phrases like "Man-made, work.ethic" become "Man made work ethic"
    # 2nd sub - Replace excessive spacing with singular spacing
    # strip - Trims any trailing whitespaces
    # 3rd sub - Adds :* & in between each word in a sequence -
    #       :* - Wildcard for suffix
    #       & - Restricts the input so that both the LHS and RHS are included in the search result
    # 4th sub - Ensures the last word of each sequence also contains the suffix wildcard
    # 5th join - Join the sequences into a singular string separated by | operator
    multiPhraseQuery = keyPhrase.split(',')
    firstHandSanitization = [sub("$", ":*", sanitizedString) for string in multiPhraseQuery if
                             (sanitizedString := sub(" ", ":* & ",
                                                     sub(" {2,}", " ", sub("[^a-zA-Z0-9 ]", " ", string)).strip()))]

    return " | ".join(firstHandSanitization)
