import psycopg2


class DBManager(object):

    def __init__(self):
        try:
            self.__conn = psycopg2.connect(database="Registry", user="genericuser", password="proiectindiv")
            self.__curs = self.__conn.cursor()
        except:
            raise Exception("0,Unable to establish connection with the Database.")

    def __del__(self):
        if self.__conn:
            self.__conn.close()

    def addAccount(self, username, password, email):
        self.__curs.execute(
            '''insert into accounts(username, password, email) values (%s,%s,%s)''',
            (username, password, email)
        )
        self.__conn.commit()

    def addCompany(self, identifier, pairedAcc, title, location, desc):
        self.__curs.execute(
            '''insert into companies(id, paired_account, title, location, description) 
            values (%s,%s,%s,%s,%s)''', (identifier, pairedAcc, title, location, desc)
        )
        self.__curs.execute(
            '''insert into employees(paired_account, paired_company) values (%s,%s)''',
            (pairedAcc, identifier)
        )
        self.__conn.commit()

    def addWorkerProfile(self, pairedAcc, firstName, lastName, city, country, address):
        self.__curs.execute(
            '''insert into workersprofile(paired_account, first_name, last_name, city, country, address) 
            values (%s,%s,%s,%s,%s,%s)''', (pairedAcc, firstName, lastName, city, country, address)
        )
        self.__conn.commit()

    def addEmployee(self, pairedAcc, pairedComp):
        # More args to be added
        self.__curs.execute(
            '''insert into employees(paired_account, paired_company) values (%s,%s)''',
            (pairedAcc, pairedComp)
        )
        self.__conn.commit()

    def loginEmployee(self, pairedAcc, pairedComp):
        self.__curs.execute(
            '''select * from companies where id=%s''', (pairedComp,)
        )
        if self.__curs.fetchone() is None:
            raise Exception("0,Company is not present in Database.")
        self.__curs.execute(
            '''select * from employees where paired_account=%s and paired_company=%s''', (pairedAcc, pairedComp)
        )
        if self.__curs.fetchone() is None:
            raise Exception("1,Username and company ID combination is not present in Database.")
        return pairedComp

    def fetchPassword(self, username):
        self.__curs.execute(
            '''select password from accounts where username=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,Username or password is not present in Database.")
        return retVal[0]

    def fetchWorkerProfile(self, username):
        self.__curs.execute('''select * from workersprofile where paired_account=%s''', (username,))
        return True if self.__curs.fetchone() is not None else False

    def getWorkerDetails(self, username):
        self.__curs.execute(
            '''select * from workersprofile where paired_account=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No paired worker profile associated with this user.")
        return retVal[1:]

    def fetchUserAvatar(self, username):
        self.__curs.execute('''select avatar from workersavatar where paired_account=%s''', (username,))
        retVal = self.__curs.fetchone()
        return retVal[0] if retVal is not None else None

    def updateUserAvatar(self, username, avatar):
        binaryImage = avatar.read()
        self.__curs.execute('''update workersavatar set avatar=%s where paired_account=%s''', (binaryImage, username))
        self.__conn.commit()

    def removeUserAvatar(self, username):
        self.__curs.execute('''delete from workersavatar where paired_account=%s''', (username,))
        self.__conn.commit()

    def addUserAvatar(self, username, avatar):
        binaryImage = avatar.read()
        self.__curs.execute('''insert into workersavatar(paired_account, avatar) values(%s, %s)''',
                            (username, binaryImage))
        self.__conn.commit()

    def getAccountEmailAddress(self, username):
        self.__curs.execute(
            '''select email from accounts where username=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No paired account associated with this user.")
        return retVal[0]

    def getEnrolledCompanies(self, username):
        self.__curs.execute(
            '''select C1.id, C1.title, C2.avatar from companies C1 left join companiesavatar C2 on C1.id=C2.comp_id 
            where C1.paired_account=%s''', (username,)
        )
        retVal = self.__curs.fetchall()
        if retVal is None:
            raise Exception("0,No paired account associated with this user.")
        return retVal

    def updateWorkerProfile(self, username, actionType, newValue):
        columnIdentifier = ('first_name', 'last_name', 'city', 'country', 'address')
        queryBeforeParamBind = f'update workersprofile set {columnIdentifier[actionType]}=%s where paired_account=%s'
        self.__curs.execute(queryBeforeParamBind, (newValue, username))
        self.__conn.commit()

    def getCompaniesMatchingKeyPhrase(self, username, keyPhrase, limit):
        sqlQuery = \
            '''
                    select C.id, C.title, (select avatar from companiesavatar where C.id = comp_id) avatar
                    from companies C where id not in (select id from companies where paired_account=%(username)s)
                    order by random() desc limit %(limit)s
        ''' \
                if not keyPhrase else \
                '''
                    select Query.comp_id,
                    (select title from companies where Query.comp_id = id) title,
                    (select avatar from companiesavatar where Query.comp_id = comp_id) avatar
                    from 
                    (select comp_id from searchquery where search_terms @@ to_tsquery(%(keyphrase)s)
                    and comp_id not in (select id from companies where paired_account=%(username)s)
                    order by ts_rank(search_terms, to_tsquery(%(keyphrase)s)) desc limit %(limit)s) Query
        '''
        parameters = {'username': username, 'limit': limit} if not keyPhrase else \
            {'keyphrase': keyPhrase, 'username': username, 'limit': limit}
        self.__curs.execute(sqlQuery, parameters)
        return self.__curs.fetchmany(limit)

    def fetchCompanyDetails(self, compID):
        self.__curs.execute(
            '''select location, title, description,
               (select avatar from companiesavatar where comp_id=%(compID)s) avatar
                from companies where id=%(compID)s''', {'compID': compID}
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,Company identifier does not exist.")
        return retVal

    def fetchCEODetails(self, compID):
        self.__curs.execute(
            '''select WP.first_name || ' ' || WP.last_name, 
                (select email from accounts where username=P.paired_account) email,
                (select avatar from workersavatar where paired_account=P.paired_account) avatar
                from (select paired_account from companies where id=%s) P, 
                (select paired_account, first_name, last_name from workersprofile) WP
                where WP.paired_account = P.paired_account''', (compID,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No CEO associated to this company ID.")
        return retVal


'''
    @classmethod
    def check_linked(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select linked_id from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone()[0] is not None: raise Exception("Account has a linked worker ID.")

    @classmethod
    def check_pending(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select requested from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone()[0] is not None: raise Exception("Account has a request pending.")

    @classmethod
    def search_unlink(cls, workerid):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if isinstance(workerid, int) is False: raise ("Invalid Worker ID Parameter.")
        cls.__curs.execute('update Accounts set linked_id=? where linked_id=?', (None, workerid))
        cls.__conn.commit()

    @classmethod
    def set_pending(cls, user, val):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception(
            "Username not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username not found in database.")
        if val is not None and val != 1: raise Exception("Invalid Value Parameter.")
        cls.__curs.execute('update Accounts set requested=? where username=?', (val, user))
        cls.__conn.commit()

    @classmethod
    def set_linked(cls, user, id):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception(
            "Username not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username not found in database.")
        if id is not None and isinstance(id, int) is False: raise Exception("Invalid ID Parameter.")
        cls.__curs.execute('update Accounts set linked_id=? where username=?', (id, user))
        cls.__conn.commit()

    @classmethod
    def get_linkedid(cls, user, pw):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select linked_id from Accounts where username=? and password=?', (user, pw))
        val = cls.__curs.fetchone()
        if val is not None:
            return int(val[0])

    @classmethod
    def set_root(cls, user, pw, rootval):
        if cls.__privilege is False: raise Exception("Setting root privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        if isinstance(rootval, int) is False or rootval not in (0, 1): raise Exception("Invalid rootval parameter.")
        cls.__curs.execute('update Accounts set root=? where username=? and password=?', (rootval, user, pw))
        cls.__conn.commit()

    @classmethod
    def is_root(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking root privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select * from Accounts where username=? and password=?', (user, pw))
        if int(cls.__curs.fetchone()[2]) == 1: return True
        return False

    @classmethod
    def add_entry(cls, user, pw):
        if cls.__privilege is False: raise Exception("Adding entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception("Username " + cls.__check_validity(user))
        if cls.__check_validity(pw) is not None: raise Exception("Password " + cls.__check_validity(pw))
        if cls.__check_availability(user) is True: raise Exception("Username has already been taken.")
        cls.__curs.execute('insert into Accounts(username, password, root) values (?, ?, ?)', (user, pw, 0))
        cls.__conn.commit()

    @classmethod
    def del_entry(cls, user, pw):
        if cls.__privilege is False: raise Exception("Removing entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('delete from Accounts where username=? and password=?', (user, pw))
        cls.__conn.commit()

    @classmethod
    def check_entry(cls, user, pw):
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")

    @staticmethod
    def __check_validity(inp):
        # Returns NONE if inp represents a valid username or password, or a string with the error message if inp is invalid
        if len(inp) < 8 or len(inp) > 64: return "must be between 8 and 64 characters in length."
        for chr in inp:
            if not chr.isdigit() and not chr.isalpha(): return "must contain only alpha-numerical characters."

    @classmethod
    def __check_availability(cls, inp):
        # TRUE = Username already exists, FALSE = Username not in database
        cls.__curs.execute('select * from Accounts where username=?', (inp,))
        if cls.__curs.fetchone() is not None: return True
        return False

    @classmethod
    def __check_combo(cls, user, pw):
        # TRUE = Username + Password combo is valid, FALSE = Username does not have a matching password
        cls.__curs.execute('select * from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone() is None: return False
        return True
'''
